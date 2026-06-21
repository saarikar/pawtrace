"""
PawTrace India — FastAPI Backend
YOLO v8 detection + MobileNetV2 classification + cosine similarity matching

Setup:
    pip install -r requirements.txt

Run:
    python app.py
    # or with auto-reload:
    uvicorn app:app --port 5000 --reload

Runs on http://localhost:5000
Docs at  http://localhost:5000/docs
"""

import asyncio
import base64
import json
import logging
import os
import re

from google import genai
from google.genai import types
import numpy as np
import tensorflow as tf
from collections import Counter
from fastapi import FastAPI, HTTPException, Request, Security, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import APIKeyHeader
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from starlette.responses import JSONResponse
from tensorflow.keras.models import Model
from ultralytics import YOLO

from config import (
    CORS_ORIGINS, API_KEY, MODEL_PATH, LABELS_PATH, YOLO_PATH, THRESHOLD,
    GEMINI_API_KEY, GEMINI_MODEL, VISION_PROMPT,
)
from schemas import (
    AnalyseRequest, SaveRequest, BatchAnalyseRequest, SearchRequest,
    VisionRequest, VisionBatchRequest,
)
from ml import (
    normalize, decode_image, detect_dogs, get_best_crop, detect_and_crop,
    predict_breed, extract_features, predict_color, predict_size,
    get_body_structure, find_match, rank_matches, aggregate_predictions,
)
from db import supabase_client, load_database, count_dogs_with_features


log = logging.getLogger("pawtrace")

# ── App setup ─────────────────────────────────────────────────────────────

limiter = Limiter(key_func=get_remote_address)
app = FastAPI()
app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(status_code=429, content={"detail": "Rate limit exceeded. Please try again later."})


app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def verify_api_key(api_key: str = Security(api_key_header)):
    if not API_KEY:
        return
    if api_key != API_KEY:
        raise HTTPException(status_code=403, detail="Invalid or missing API key")


# ── Model loading ─────────────────────────────────────────────────────────

log.info("Loading models...")
yolo = YOLO(YOLO_PATH)
classifier = tf.keras.models.load_model(MODEL_PATH)
with open(LABELS_PATH) as f:
    labels = json.load(f)
feature_model = Model(
    inputs=classifier.input,
    outputs=classifier.layers[-3].output,
)
log.info("Feature vector size: %s", classifier.layers[-3].output.shape)
log.info("Models loaded. Ready.")


# ── Helper: extract features from a single image ─────────────────────────

def _extract_from_image(b64_str):
    """Run full detection+classification on a single image. Returns dict or None."""
    import time
    t0 = time.perf_counter()
    pipeline = detect_and_crop(b64_str, yolo)
    if not pipeline.get("is_dog"):
        log.info("YOLO+MobileNetV2 latency: %.0fms | no dog detected", (time.perf_counter() - t0) * 1000)
        return None

    crop = pipeline["crop"]
    img = pipeline["img"]
    x1, y1, x2, y2 = pipeline["bbox"]
    img_h, img_w = img.shape[:2]

    breed, breed_conf = predict_breed(crop, classifier, labels)
    feature = extract_features(crop, feature_model)
    color = predict_color(crop)
    size = predict_size(x1, y1, x2, y2, img_h, img_w)
    log.info("YOLO+MobileNetV2 latency: %.0fms | breed=%s | breed_confidence=%s | yolo_confidence=%s",
             (time.perf_counter() - t0) * 1000, breed, round(breed_conf * 100), pipeline["yolo_confidence"])

    return {
        "is_dog": True,
        "breed": breed,
        "breed_confidence": round(breed_conf * 100),
        "yolo_confidence": pipeline["yolo_confidence"],
        "color": color,
        "size": size,
        "feature": feature,
        "bbox": pipeline["bbox"],
    }


# ── Routes ────────────────────────────────────────────────────────────────

@app.get("/status")
@limiter.limit("30/minute")
def status(request: Request):
    return {
        "online": True,
        "dogs_in_db": count_dogs_with_features(),
        "model": "MobileNetV2",
        "yolo": "YOLOv8n",
        "feature_dim": int(classifier.layers[-3].output.shape[-1]),
        "threshold": THRESHOLD,
        "num_classes": len(labels),
    }


@app.post("/analyse")
@limiter.limit("10/minute")
def analyse(request: Request, body: AnalyseRequest):
    result = _extract_from_image(body.image)
    if result is None:
        return {"is_dog": False, "message": "No dog detected in image. Try a clearer photo with the dog more visible."}

    feature = result["feature"]
    feature_list = feature.tolist()
    database = load_database()
    match_id, similarity = find_match(feature, database)

    return {
        "is_dog": True,
        "breed": result["breed"],
        "breed_confidence": result["breed_confidence"],
        "yolo_confidence": result["yolo_confidence"],
        "match_found": match_id is not None,
        "match_id": match_id,
        "similarity": round(similarity * 100),
        "bbox": result["bbox"],
        "feature_dim": len(feature_list),
        "feature": feature_list,
        "dogs_checked": len(database),
    }


@app.post("/save")
@limiter.limit("20/minute")
def save(request: Request, body: SaveRequest, _=Depends(verify_api_key)):
    feature_list = np.array(body.feature, dtype=np.float64).tolist()
    try:
        result = supabase_client.table("dogs") \
            .update({"feature_vector": feature_list}) \
            .eq("dog_id", body.dog_id) \
            .execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save feature vector: {str(e)}")
    if not result.data:
        raise HTTPException(status_code=404, detail=f"No dog found with dog_id={body.dog_id}")
    return {
        "saved": True,
        "dog_id": body.dog_id,
        "total_in_db": count_dogs_with_features(),
    }


@app.get("/db")
@limiter.limit("30/minute")
def db_list(request: Request, _=Depends(verify_api_key)):
    try:
        response = supabase_client.table("dogs") \
            .select("dog_id") \
            .not_.is_("feature_vector", "null") \
            .execute()
        dog_ids = [row["dog_id"] for row in response.data]
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Could not list database: {str(e)}")
    return {"dogs": dog_ids, "count": len(dog_ids)}


@app.post("/analyse-batch")
@limiter.limit("5/minute")
def analyse_batch(request: Request, body: BatchAnalyseRequest):
    per_photo = []
    dog_results = []
    database = load_database()

    for b64_str in body.images:
        result = _extract_from_image(b64_str)
        if result is None:
            per_photo.append({"is_dog": False})
        else:
            per_photo.append(result)
            dog_results.append(result)

    if not dog_results:
        return {
            "is_dog": False,
            "message": "No dog detected in any of the photos. Try clearer photos with the dog more visible.",
            "photos_submitted": len(body.images),
            "photos_analyzed": 0,
            "per_photo": [{k: v for k, v in p.items() if k != "feature"} for p in per_photo],
        }

    agg_breed, agg_color, agg_size, avg_breed_conf, avg_yolo_conf = aggregate_predictions(dog_results)

    features = np.array([r["feature"] for r in dog_results])
    avg_feature = normalize(features.mean(axis=0))
    match_id, similarity = find_match(avg_feature, database)

    return {
        "is_dog": True,
        "breed": agg_breed,
        "breed_confidence": avg_breed_conf,
        "yolo_confidence": avg_yolo_conf,
        "color": agg_color,
        "size": agg_size,
        "body_structure": get_body_structure(agg_breed),
        "match_found": match_id is not None,
        "match_id": match_id,
        "similarity": round(similarity * 100),
        "feature": avg_feature.tolist(),
        "feature_dim": len(avg_feature),
        "dogs_checked": len(database),
        "photos_submitted": len(body.images),
        "photos_analyzed": len(dog_results),
        "per_photo": [{k: v for k, v in p.items() if k != "feature"} for p in per_photo],
    }


@app.post("/search")
@limiter.limit("10/minute")
def search(request: Request, body: SearchRequest):
    dog_features = []
    detected_breeds = []
    detected_colors = []

    for b64 in body.images:
        result = _extract_from_image(b64)
        if result is None:
            continue
        dog_features.append(result["feature"])
        detected_breeds.append(result["breed"])
        detected_colors.append(result["color"])

    if not dog_features:
        return {"matches": [], "message": "No dog detected in query photos.", "photos_processed": 0, "candidates_checked": 0}

    avg_feature = normalize(np.array(dog_features).mean(axis=0))
    detected_breed = Counter(detected_breeds).most_common(1)[0][0] if detected_breeds else None
    detected_color = Counter(detected_colors).most_common(1)[0][0] if detected_colors else None

    try:
        q = supabase_client.table("dogs").select("*")
        if body.breed:       q = q.eq("breed", body.breed)
        if body.color:       q = q.eq("color", body.color)
        if body.size:        q = q.eq("size", body.size)
        if body.report_type: q = q.eq("report_type", body.report_type)
        response = q.execute()
        candidates = response.data or []
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database unavailable: {str(e)}")

    ranked = rank_matches(avg_feature, candidates, body.lat, body.lng, body.top_n, detected_breed, detected_color, body.radius_km)
    return {
        "matches": ranked,
        "photos_processed": len(dog_features),
        "candidates_checked": len(candidates),
        "detected_breed": detected_breed,
        "detected_color": detected_color,
    }


# ── Gemini Vision LLM ────────────────────────────────────────────────────

def _call_gemini_vision_sync(b64_image: str) -> dict:
    import time
    client = genai.Client(api_key=GEMINI_API_KEY)
    image_bytes = base64.b64decode(b64_image)
    t0 = time.perf_counter()
    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=[
            VISION_PROMPT,
            types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
        ],
    )
    elapsed_ms = (time.perf_counter() - t0) * 1000
    raw_response = response.text
    json_match = re.search(r'\{.*\}', raw_response, re.DOTALL)
    if not json_match:
        log.warning("Gemini latency: %.0fms | FAILED (no parseable JSON). Raw (first 500 chars): %.500s", elapsed_ms, raw_response)
        return {"is_dog": False, "error": "Could not parse vision model response", "raw": raw_response}
    try:
        result = json.loads(json_match.group())
        log.info("Gemini latency: %.0fms | is_dog=%s | breed=%s | breed_confidence=%s",
                 elapsed_ms, result.get("is_dog"), result.get("breed"), result.get("breed_confidence"))
        return result
    except json.JSONDecodeError as exc:
        log.warning("Gemini latency: %.0fms | FAILED (JSON decode: %s). Raw (first 500 chars): %.500s", elapsed_ms, exc, raw_response)
        return {"is_dog": False, "error": "Invalid JSON from vision model", "raw": raw_response}


async def call_gemini_vision(b64_image: str) -> dict:
    return await asyncio.to_thread(_call_gemini_vision_sync, b64_image)


def _enrich_with_features(result, b64_image):
    """Add feature vector and match info to a vision LLM result."""
    try:
        pipeline = detect_and_crop(b64_image, yolo)
        if pipeline.get("is_dog") and pipeline.get("crop") is not None:
            feature = extract_features(pipeline["crop"], feature_model)
            feature_list = feature.tolist()
            database = load_database()
            match_id, sim = find_match(feature, database)
            result["feature"] = feature_list
            result["feature_dim"] = len(feature_list)
            result["match_found"] = match_id is not None
            result["match_id"] = match_id
            result["similarity"] = round(sim * 100)
            result["dogs_checked"] = len(database)
            return result
    except Exception:
        pass

    result["feature"] = None
    result["feature_dim"] = 0
    result["match_found"] = False
    result["match_id"] = None
    result["similarity"] = 0
    result["dogs_checked"] = 0
    return result


def _yolo_fallback_single(b64_image):
    """Full YOLO+MobileNetV2 fallback for a single image."""
    result = _extract_from_image(b64_image)
    if result is None:
        return {"is_dog": False, "message": "No dog detected.", "_source": "yolo_fallback"}

    feature_list = result["feature"].tolist()
    match_id, similarity, dogs_checked = None, 0.0, 0
    try:
        database = load_database()
        match_id, similarity = find_match(result["feature"], database)
        dogs_checked = len(database)
    except Exception as e:
        log.warning("DB unavailable during YOLO fallback (%s), skipping feature match", e)

    return {
        "is_dog": True,
        "breed": result["breed"],
        "breed_confidence": result["breed_confidence"],
        "color": result["color"],
        "color_category": result["color"],
        "size": result["size"],
        "body_structure": get_body_structure(result["breed"]),
        "description": f"A {result['size']} {result['color']} {result['breed']} spotted in the area.",
        "distinguishing_marks": None,
        "health_observations": None,
        "injured": False,
        "injury_notes": None,
        "temperament_guess": "unknown",
        "age_estimate": "adult (1.5-7 yr)",
        "feature": feature_list,
        "feature_dim": len(feature_list),
        "match_found": match_id is not None,
        "match_id": match_id,
        "similarity": round(similarity * 100),
        "dogs_checked": dogs_checked,
        "_source": "yolo_fallback",
    }


@app.get("/vision-status")
@limiter.limit("30/minute")
async def vision_status(request: Request):
    if not GEMINI_API_KEY:
        return {"online": False, "vision_model": GEMINI_MODEL, "provider": "gemini", "error": "GEMINI_API_KEY not set"}
    return {"online": True, "vision_model": GEMINI_MODEL, "provider": "gemini"}


@app.post("/analyse-vision")
@limiter.limit("5/minute")
async def analyse_vision(request: Request, body: VisionRequest, _=Depends(verify_api_key)):
    try:
        result = await call_gemini_vision(body.image)
        if result.get("is_dog"):
            result = _enrich_with_features(result, body.image)
            result["_source"] = "vision_llm"
            return result
        return {**result, "_source": "vision_llm"}
    except Exception as e:
        log.warning("Gemini unavailable (%s), falling back to YOLO+MobileNetV2", e)
        return _yolo_fallback_single(body.image)


@app.post("/analyse-vision-batch")
@limiter.limit("3/minute")
async def analyse_vision_batch(request: Request, body: VisionBatchRequest, _=Depends(verify_api_key)):
    if not body.images:
        return {"is_dog": False, "message": "No images provided."}

    # Vision LLM on first image
    primary_result = None
    try:
        primary_result = await call_gemini_vision(body.images[0])
    except Exception as e:
        log.warning("Vision LLM failed: %s", e)

    # Feature extraction from all images
    all_features = []
    per_photo = []
    for b64 in body.images:
        result = _extract_from_image(b64)
        if result is None:
            per_photo.append({"is_dog": False})
        else:
            all_features.append(result["feature"])
            per_photo.append({"is_dog": True, "yolo_confidence": result["yolo_confidence"]})

    # Match with averaged feature
    feature_list = None
    match_id = None
    similarity = 0
    dogs_checked = 0

    if all_features:
        avg_feature = normalize(np.array(all_features).mean(axis=0))
        feature_list = avg_feature.tolist()
        database = load_database()
        dogs_checked = len(database)
        match_id, sim = find_match(avg_feature, database)
        similarity = round(sim * 100)

    match_fields = {
        "feature": feature_list,
        "feature_dim": len(feature_list) if feature_list else 0,
        "match_found": match_id is not None,
        "match_id": match_id,
        "similarity": similarity,
        "dogs_checked": dogs_checked,
        "photos_submitted": len(body.images),
        "photos_analyzed": len(all_features),
        "per_photo": per_photo,
    }

    # Merge vision LLM result if available
    if primary_result and primary_result.get("is_dog"):
        return {**primary_result, **match_fields, "_source": "vision_llm"}

    if not all_features:
        return {"is_dog": False, "message": "No dog detected in any photo.", **match_fields, "_source": "yolo_fallback"}

    # Fallback classification from first image
    fallback = _extract_from_image(body.images[0])
    if fallback:
        return {
            "is_dog": True,
            "breed": fallback["breed"],
            "breed_confidence": fallback["breed_confidence"],
            "color": fallback["color"],
            "color_category": fallback["color"],
            "size": fallback["size"],
            "body_structure": get_body_structure(fallback["breed"]),
            "description": f"A {fallback['size']} {fallback['color']} {fallback['breed']} spotted in the area.",
            **match_fields,
            "_source": "yolo_fallback",
        }

    return {"is_dog": True, "breed": "Unknown", **match_fields, "_source": "yolo_fallback"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 5001)))
