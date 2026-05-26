"""
Stray Dogs Directory — FastAPI Backend
YOLO v8 detection + MobileNetV2 classification + cosine similarity matching

Setup:
    pip install fastapi uvicorn[standard] ultralytics tensorflow opencv-python scikit-learn numpy

Run:
    python app.py
    # or with auto-reload:
    uvicorn app:app --port 5000 --reload

Runs on http://localhost:5000
Docs at  http://localhost:5000/docs
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import cv2
import numpy as np
import tensorflow as tf
import json
import os
import base64
import math
from collections import Counter
from ultralytics import YOLO
from sklearn.metrics.pairwise import cosine_similarity
from tensorflow.keras.models import Model
from dotenv import load_dotenv
from supabase import create_client, Client

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Config ─────────────────────────────────────────────────────────────────
MODEL_PATH  = "stray_dog_model.h5"
LABELS_PATH = "class_labels.json"
THRESHOLD   = 0.85   # cosine similarity threshold for a match
IMG_SIZE    = 224
# ───────────────────────────────────────────────────────────────────────────

load_dotenv()
SUPABASE_URL         = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env")
supabase_client: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

print("Loading models...")

# YOLO
yolo = YOLO("yolov8n.pt")

# MobileNetV2 classifier
classifier = tf.keras.models.load_model(MODEL_PATH)

# Labels
with open(LABELS_PATH) as f:
    labels = json.load(f)

# Feature extractor — Dense(128) layer, NOT Dropout (layers[-3])
feature_model = Model(
    inputs=classifier.input,
    outputs=classifier.layers[-3].output   # clean Dense(128) output
)

print(f"Feature vector size: {classifier.layers[-3].output.shape}")
print(f"Total layers: {len(classifier.layers)}")
print("Models loaded. Ready.")


# ── Request Models ───────────────────────────────────────────────────────────

class AnalyseRequest(BaseModel):
    image: str
    mime: str = "image/jpeg"

class SaveRequest(BaseModel):
    dog_id: str
    feature: list[float]

class BatchAnalyseRequest(BaseModel):
    images: list[str]
    mime: str = "image/jpeg"

class SearchRequest(BaseModel):
    images: list[str]
    mime: str = "image/jpeg"
    top_n: int = 10
    breed: str | None = None
    color: str | None = None
    size: str | None = None
    report_type: str | None = None
    lat: float | None = None
    lng: float | None = None
    radius_km: float = 10.0


# ── Helpers ─────────────────────────────────────────────────────────────────

def normalize(vec):
    norm = np.linalg.norm(vec)
    if norm == 0:
        return vec
    return vec / norm


def preprocess(crop):
    img = cv2.resize(crop, (IMG_SIZE, IMG_SIZE))
    img = img / 255.0
    return np.expand_dims(img, axis=0)


def predict_breed(crop):
    pred = classifier.predict(preprocess(crop), verbose=0)
    class_id = int(np.argmax(pred))
    confidence = float(np.max(pred))
    breed = labels.get(str(class_id), "Cannot determine")
    return breed, confidence


def extract_features(crop):
    features = feature_model.predict(preprocess(crop), verbose=0)
    return normalize(features[0])


def load_database() -> dict:
    try:
        response = supabase_client.table("dogs") \
            .select("dog_id, feature_vector") \
            .not_.is_("feature_vector", "null") \
            .execute()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Feature database unavailable: {str(e)}")
    return {
        row["dog_id"]: np.array(row["feature_vector"], dtype=np.float64)
        for row in response.data
        if row.get("feature_vector")
    }


def find_match(feature, database):
    best_score = 0.0
    best_id = None

    for dog_id, stored in database.items():
        score = float(cosine_similarity([feature], [stored])[0][0])
        if score > best_score:
            best_score = score
            best_id = dog_id

    if best_score >= THRESHOLD:
        return best_id, best_score
    return None, best_score


def decode_image(b64_string):
    img_bytes = base64.b64decode(b64_string)
    arr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    return img


BODY_STRUCTURES = {
    "chippiparai":        "Slender sighthound build",
    "kanni":              "Slender sighthound build",
    "mudhol_hound":       "Slender sighthound build",
    "rajapalayam":        "Slender sighthound build",
    "indian_pariah":      "Medium, lean build",
    "kombai":             "Muscular, medium build",
    "doberman_mix":       "Athletic, muscular build",
    "german_shepherd_mix":"Athletic, muscular build",
    "labrador_mix":       "Sturdy, medium build",
    "cocker_spaniel_mix": "Compact, sturdy build",
    "indian_spitz":       "Compact, fluffy build",
    "dalmatian_mix":      "Athletic, spotted build",
}


def predict_color(crop):
    if crop.size == 0 or crop.shape[0] < 5 or crop.shape[1] < 5:
        return "brown"
    pixels = crop.reshape(-1, 3).astype(np.float32)
    k = 3 if len(pixels) >= 30 else 1
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0)
    try:
        _, labels_out, centers = cv2.kmeans(pixels, k, None, criteria, 10, cv2.KMEANS_RANDOM_CENTERS)
    except Exception:
        return "brown"

    counts = np.bincount(labels_out.flatten())
    total = len(labels_out)

    def bgr_to_name(bgr):
        hsv = cv2.cvtColor(np.uint8([[bgr]]), cv2.COLOR_BGR2HSV)[0][0]
        h, s, v = int(hsv[0]), int(hsv[1]), int(hsv[2])
        if s < 40 and v > 190: return "white"
        if s < 40 and v < 70:  return "black"
        if s < 50:             return "grey"
        if h < 15 or h > 160:  return "brown"
        if h < 85:             return "tan"
        return "brown"

    color_names = [bgr_to_name(centers[i]) for i in range(k)]
    proportions = [counts[i] / total for i in range(k)]

    sig_set = {color_names[i] for i in range(k) if proportions[i] > 0.25}
    if len(sig_set) >= 3:
        return "tri-color"
    if "black" in sig_set and "white" in sig_set:
        return "black & white"
    if ("brown" in sig_set or "tan" in sig_set) and "white" in sig_set:
        return "brown & white"

    return color_names[int(np.argmax(counts))]


def predict_size(x1, y1, x2, y2, img_h, img_w):
    ratio = ((x2 - x1) * (y2 - y1)) / (img_h * img_w)
    if ratio < 0.10: return "small"
    if ratio < 0.35: return "medium"
    return "large"


def get_body_structure(breed):
    return BODY_STRUCTURES.get(breed, "Medium build")


def haversine(lat1, lng1, lat2, lng2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2
    return R * 2 * math.asin(math.sqrt(a))


def rank_matches(query_feature, candidates, lat, lng, top_n, detected_breed=None, detected_color=None, radius_km=10.0):
    results = []
    for dog in candidates:
        distance_km = None
        # Radius filter — skip dogs with known location outside the radius
        if lat and lng and dog.get("lat") and dog.get("lng"):
            distance_km = haversine(lat, lng, dog["lat"], dog["lng"])
            if distance_km > radius_km:
                continue

        fv = dog.get("feature_vector")
        if fv:
            stored = normalize(np.array(fv, dtype=np.float64))
            sim = float(cosine_similarity([query_feature], [stored])[0][0])
            match_type = "visual"
        else:
            sim = 0.0
            if detected_breed and dog.get("breed") == detected_breed:
                sim += 0.5
            if detected_color and dog.get("color") == detected_color:
                sim += 0.3
            match_type = "attribute"

        if sim <= 0:
            continue

        score = sim
        if distance_km is not None:
            proximity = max(0.0, 1 - distance_km / radius_km)
            score = 0.7 * sim + 0.3 * proximity

        dog_out = {k: v for k, v in dog.items() if k != "feature_vector"}
        results.append({
            **dog_out,
            "similarity": round(sim * 100),
            "match_type": match_type,
            "distance_km": round(distance_km, 1) if distance_km is not None else None,
            "_score": score,
        })
    results.sort(key=lambda x: x["_score"], reverse=True)
    for r in results:
        r.pop("_score")
    return results[:top_n]


# ── Routes ──────────────────────────────────────────────────────────────────

@app.get("/status")
def status():
    """Health check — React calls this on load to confirm the backend is running."""
    try:
        count_resp = supabase_client.table("dogs") \
            .select("dog_id", count="exact") \
            .not_.is_("feature_vector", "null") \
            .execute()
        dogs_in_db = count_resp.count or 0
    except Exception:
        dogs_in_db = -1
    return {
        "online": True,
        "dogs_in_db": dogs_in_db,
        "model": "MobileNetV2",
        "yolo": "YOLOv8n",
        "feature_dim": int(classifier.layers[-3].output.shape[-1]),
        "threshold": THRESHOLD,
        "num_classes": len(labels),
    }


@app.post("/analyse")
def analyse(body: AnalyseRequest):
    """
    Main pipeline:
    1. Decode base64 image
    2. YOLO → detect dog, get bbox
    3. Crop dog region
    4. MobileNetV2 → breed + confidence
    5. Feature extractor → 128-dim vector
    6. Cosine similarity → match or new
    """
    try:
        img = decode_image(body.image)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not decode image: {str(e)}")

    if img is None:
        raise HTTPException(status_code=400, detail="Invalid image")

    # ── YOLO detection ──────────────────────────────────────────────────
    results = yolo(img)
    dog_boxes = []

    for result in results:
        for box in result.boxes:
            cls_id = int(box.cls[0])
            if cls_id == 16:  # COCO class 16 = dog
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                yolo_conf = float(box.conf[0])
                dog_boxes.append((x1, y1, x2, y2, yolo_conf))

    if not dog_boxes:
        return {
            "is_dog": False,
            "message": "No dog detected in image. Try a clearer photo with the dog more visible."
        }

    # Use the highest-confidence detection
    dog_boxes.sort(key=lambda b: b[4], reverse=True)
    x1, y1, x2, y2, yolo_conf = dog_boxes[0]

    crop = img[y1:y2, x1:x2]
    if crop.size == 0:
        raise HTTPException(status_code=400, detail="Dog detected but crop failed")

    # ── Classification ──────────────────────────────────────────────────
    breed, breed_conf = predict_breed(crop)

    # ── Feature extraction ──────────────────────────────────────────────
    feature = extract_features(crop)
    feature_list = feature.tolist()   # for sending back to React

    # ── Similarity matching ─────────────────────────────────────────────
    database = load_database()
    match_id, similarity = find_match(feature, database)

    return {
        "is_dog": True,
        "breed": breed,
        "breed_confidence": round(breed_conf * 100),
        "yolo_confidence": round(yolo_conf * 100),
        "match_found": match_id is not None,
        "match_id": match_id,
        "similarity": round(similarity * 100),
        "bbox": [x1, y1, x2, y2],
        "feature_dim": len(feature_list),
        "feature": feature_list,          # sent back so React can pass to /save
        "dogs_checked": len(database),
    }


@app.post("/save")
def save(body: SaveRequest):
    """Save feature vector for a confirmed new dog. Called after user submits the report form."""
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
    try:
        count_resp = supabase_client.table("dogs") \
            .select("dog_id", count="exact") \
            .not_.is_("feature_vector", "null") \
            .execute()
        total = count_resp.count or 0
    except Exception:
        total = -1
    return {
        "saved": True,
        "dog_id": body.dog_id,
        "total_in_db": total,
    }


@app.get("/db")
def db_list():
    """List all dogs currently in the feature database."""
    try:
        response = supabase_client.table("dogs") \
            .select("dog_id") \
            .not_.is_("feature_vector", "null") \
            .execute()
        dog_ids = [row["dog_id"] for row in response.data]
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Could not list database: {str(e)}")
    return {
        "dogs": dog_ids,
        "count": len(dog_ids),
    }


@app.post("/analyse-batch")
def analyse_batch(body: BatchAnalyseRequest):
    """
    Multi-photo pipeline — accepts up to 6 base64 images.
    Each is run through YOLO + breed + colour + size prediction.
    Results are aggregated via majority vote and averaged feature vector.
    """
    per_photo = []
    dog_results = []
    database = load_database()

    for b64_str in body.images:
        try:
            img = decode_image(b64_str)
        except Exception as e:
            per_photo.append({"is_dog": False, "error": str(e)})
            continue

        if img is None:
            per_photo.append({"is_dog": False, "error": "Invalid image"})
            continue

        results = yolo(img)
        dog_boxes = []
        for result in results:
            for box in result.boxes:
                if int(box.cls[0]) == 16:
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    dog_boxes.append((x1, y1, x2, y2, float(box.conf[0])))

        if not dog_boxes:
            per_photo.append({"is_dog": False})
            continue

        dog_boxes.sort(key=lambda b: b[4], reverse=True)
        x1, y1, x2, y2, yolo_conf = dog_boxes[0]
        crop = img[y1:y2, x1:x2]
        if crop.size == 0:
            per_photo.append({"is_dog": False, "error": "Crop failed"})
            continue

        breed, breed_conf    = predict_breed(crop)
        feature              = extract_features(crop)
        color                = predict_color(crop)
        img_h, img_w         = img.shape[:2]
        size                 = predict_size(x1, y1, x2, y2, img_h, img_w)

        photo_result = {
            "is_dog":           True,
            "breed":            breed,
            "breed_confidence": round(breed_conf * 100),
            "yolo_confidence":  round(yolo_conf * 100),
            "color":            color,
            "size":             size,
            "feature":          feature,
        }
        per_photo.append(photo_result)
        dog_results.append(photo_result)

    if not dog_results:
        return {
            "is_dog":           False,
            "message":          "No dog detected in any of the photos. Try clearer photos with the dog more visible.",
            "photos_submitted": len(body.images),
            "photos_analyzed":  0,
            "per_photo":        [{k: v for k, v in p.items() if k != "feature"} for p in per_photo],
        }

    agg_breed      = Counter(r["breed"]  for r in dog_results).most_common(1)[0][0]
    agg_color      = Counter(r["color"]  for r in dog_results).most_common(1)[0][0]
    agg_size       = Counter(r["size"]   for r in dog_results).most_common(1)[0][0]
    avg_breed_conf = round(sum(r["breed_confidence"] for r in dog_results) / len(dog_results))
    avg_yolo_conf  = round(sum(r["yolo_confidence"]  for r in dog_results) / len(dog_results))

    features    = np.array([r["feature"] for r in dog_results])
    avg_feature = normalize(features.mean(axis=0))

    match_id, similarity = find_match(avg_feature, database)

    return {
        "is_dog":           True,
        "breed":            agg_breed,
        "breed_confidence": avg_breed_conf,
        "yolo_confidence":  avg_yolo_conf,
        "color":            agg_color,
        "size":             agg_size,
        "body_structure":   get_body_structure(agg_breed),
        "match_found":      match_id is not None,
        "match_id":         match_id,
        "similarity":       round(similarity * 100),
        "feature":          avg_feature.tolist(),
        "feature_dim":      len(avg_feature),
        "dogs_checked":     len(database),
        "photos_submitted": len(body.images),
        "photos_analyzed":  len(dog_results),
        "per_photo":        [{k: v for k, v in p.items() if k != "feature"} for p in per_photo],
    }


@app.post("/search")
def search(body: SearchRequest):
    """Search the dog database by photo(s). Returns top-N ranked matches with similarity scores."""
    dog_features = []
    detected_breeds = []
    detected_colors = []

    for b64 in body.images:
        try:
            img = decode_image(b64)
        except Exception:
            continue
        results = yolo(img)
        boxes = []
        for result in results:
            for box in result.boxes:
                if int(box.cls[0]) == 16:
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    boxes.append((x1, y1, x2, y2, float(box.conf[0])))
        if not boxes:
            continue
        boxes.sort(key=lambda b: b[4], reverse=True)
        x1, y1, x2, y2, _ = boxes[0]
        crop = img[y1:y2, x1:x2]
        if crop.size == 0:
            continue
        dog_features.append(extract_features(crop))
        detected_breeds.append(predict_breed(crop)[0])
        detected_colors.append(predict_color(crop))

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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
