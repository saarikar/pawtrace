"""
ML pipeline — YOLO detection, breed classification, feature extraction,
color/size prediction, and similarity matching.
"""

import base64
import math
from collections import Counter

import cv2
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

from config import (
    COCO_DOG_CLASS,
    IMG_SIZE,
    THRESHOLD,
    BODY_STRUCTURES,
    SIZE_SMALL_RATIO,
    SIZE_MEDIUM_RATIO,
    COLOR_SIGNIFICANT_PROPORTION,
    VISUAL_WEIGHT,
    PROXIMITY_WEIGHT,
    BREED_MATCH_BONUS,
    COLOR_MATCH_BONUS,
)


# ── Core helpers ──────────────────────────────────────────────────────────

def normalize(vec):
    norm = np.linalg.norm(vec)
    return vec if norm == 0 else vec / norm


def preprocess(crop):
    img = cv2.resize(crop, (IMG_SIZE, IMG_SIZE))
    img = img / 255.0
    return np.expand_dims(img, axis=0)


def decode_image(b64_string):
    img_bytes = base64.b64decode(b64_string)
    arr = np.frombuffer(img_bytes, np.uint8)
    return cv2.imdecode(arr, cv2.IMREAD_COLOR)


# ── YOLO detection (single function replaces 7 copies) ───────────────────

def detect_dogs(img, yolo_model):
    """Run YOLO on an image and return dog bounding boxes sorted by confidence (best first)."""
    results = yolo_model(img)
    boxes = []
    for result in results:
        for box in result.boxes:
            if int(box.cls[0]) == COCO_DOG_CLASS:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                boxes.append((x1, y1, x2, y2, float(box.conf[0])))
    boxes.sort(key=lambda b: b[4], reverse=True)
    return boxes


def get_best_crop(img, boxes):
    """Crop the highest-confidence dog detection. Returns (crop, (x1,y1,x2,y2,conf)) or (None, None)."""
    if not boxes:
        return None, None
    x1, y1, x2, y2, conf = boxes[0]
    crop = img[y1:y2, x1:x2]
    if crop.size == 0:
        return None, None
    return crop, boxes[0]


def detect_and_crop(b64_string, yolo_model):
    """Full decode → detect → crop pipeline. Returns dict with crop, img, box info or error."""
    img = decode_image(b64_string)
    if img is None:
        return {"error": "Invalid image"}

    boxes = detect_dogs(img, yolo_model)
    crop, best_box = get_best_crop(img, boxes)

    if crop is None:
        return {
            "is_dog": False,
            "message": "No dog detected in image. Try a clearer photo with the dog more visible.",
        }

    x1, y1, x2, y2, yolo_conf = best_box
    return {
        "is_dog": True,
        "crop": crop,
        "img": img,
        "bbox": [x1, y1, x2, y2],
        "yolo_confidence": round(yolo_conf * 100),
    }


# ── Breed & feature prediction ───────────────────────────────────────────

def predict_breed(crop, classifier, labels):
    pred = classifier.predict(preprocess(crop), verbose=0)
    class_id = int(np.argmax(pred))
    confidence = float(np.max(pred))
    breed = labels.get(str(class_id), "Cannot determine")
    return breed, confidence


def extract_features(crop, feature_model):
    features = feature_model.predict(preprocess(crop), verbose=0)
    return normalize(features[0])


# ── Color prediction ─────────────────────────────────────────────────────

def _bgr_to_name(bgr):
    hsv = cv2.cvtColor(np.uint8([[bgr]]), cv2.COLOR_BGR2HSV)[0][0]
    h, s, v = int(hsv[0]), int(hsv[1]), int(hsv[2])
    if s < 40 and v > 190:
        return "white"
    if s < 40 and v < 70:
        return "black"
    if s < 50:
        return "grey"
    if h < 15 or h > 160:
        return "brown"
    if h < 85:
        return "tan"
    return "brown"


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

    color_names = [_bgr_to_name(centers[i]) for i in range(k)]
    proportions = [counts[i] / total for i in range(k)]

    sig_set = {color_names[i] for i in range(k) if proportions[i] > COLOR_SIGNIFICANT_PROPORTION}
    if len(sig_set) >= 3:
        return "tri-color"
    if "black" in sig_set and "white" in sig_set:
        return "black & white"
    if ("brown" in sig_set or "tan" in sig_set) and "white" in sig_set:
        return "brown & white"

    return color_names[int(np.argmax(counts))]


# ── Size & body structure ────────────────────────────────────────────────

def predict_size(x1, y1, x2, y2, img_h, img_w):
    ratio = ((x2 - x1) * (y2 - y1)) / (img_h * img_w)
    if ratio < SIZE_SMALL_RATIO:
        return "small"
    if ratio < SIZE_MEDIUM_RATIO:
        return "medium"
    return "large"


def get_body_structure(breed):
    return BODY_STRUCTURES.get(breed, "Medium build")


# ── Similarity matching ──────────────────────────────────────────────────

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
                sim += BREED_MATCH_BONUS
            if detected_color and dog.get("color") == detected_color:
                sim += COLOR_MATCH_BONUS
            match_type = "attribute"

        if sim <= 0:
            continue

        score = sim
        if distance_km is not None:
            proximity = max(0.0, 1 - distance_km / radius_km)
            score = VISUAL_WEIGHT * sim + PROXIMITY_WEIGHT * proximity

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


# ── Batch aggregation helpers ─────────────────────────────────────────────

def aggregate_predictions(dog_results):
    """Majority-vote aggregation for batch analysis."""
    agg_breed = Counter(r["breed"] for r in dog_results).most_common(1)[0][0]
    agg_color = Counter(r["color"] for r in dog_results).most_common(1)[0][0]
    agg_size = Counter(r["size"] for r in dog_results).most_common(1)[0][0]
    avg_breed_conf = round(sum(r["breed_confidence"] for r in dog_results) / len(dog_results))
    avg_yolo_conf = round(sum(r["yolo_confidence"] for r in dog_results) / len(dog_results))
    return agg_breed, agg_color, agg_size, avg_breed_conf, avg_yolo_conf
