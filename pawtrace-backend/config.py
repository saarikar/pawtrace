"""
Centralized configuration — constants, env vars, magic numbers.
"""

import os
from dotenv import load_dotenv

load_dotenv()

# ── Supabase ──────────────────────────────────────────────────────────────
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

# ── CORS ──────────────────────────────────────────────────────────────────
CORS_ORIGINS = [
    o.strip()
    for o in os.environ.get("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
]

# ── API key ───────────────────────────────────────────────────────────────
API_KEY = os.environ.get("API_KEY", "")

# ── Model paths ───────────────────────────────────────────────────────────
MODEL_PATH = "stray_dog_model.h5"
LABELS_PATH = "class_labels.json"
YOLO_PATH = "yolov8n.pt"

# ── ML constants ──────────────────────────────────────────────────────────
COCO_DOG_CLASS = 16
IMG_SIZE = 224
THRESHOLD = 0.85  # cosine similarity threshold for a match

# ── Input validation ──────────────────────────────────────────────────────
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB per image (base64)
MAX_BATCH_IMAGES = 6

# ── Size classification thresholds (bbox area / image area) ───────────────
SIZE_SMALL_RATIO = 0.10
SIZE_MEDIUM_RATIO = 0.35

# ── Ranking weights ───────────────────────────────────────────────────────
VISUAL_WEIGHT = 0.7
PROXIMITY_WEIGHT = 0.3
BREED_MATCH_BONUS = 0.5
COLOR_MATCH_BONUS = 0.3
COLOR_SIGNIFICANT_PROPORTION = 0.25

# ── Body structure map ────────────────────────────────────────────────────
BODY_STRUCTURES = {
    "chippiparai":         "Slender sighthound build",
    "kanni":               "Slender sighthound build",
    "mudhol_hound":        "Slender sighthound build",
    "rajapalayam":         "Slender sighthound build",
    "indian_pariah":       "Medium, lean build",
    "kombai":              "Muscular, medium build",
    "doberman_mix":        "Athletic, muscular build",
    "german_shepherd_mix": "Athletic, muscular build",
    "labrador_mix":        "Sturdy, medium build",
    "cocker_spaniel_mix":  "Compact, sturdy build",
    "indian_spitz":        "Compact, fluffy build",
    "dalmatian_mix":       "Athletic, spotted build",
}

# ── Ollama Vision LLM ────────────────────────────────────────────────────
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://127.0.0.1:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_VISION_MODEL", "llava:7b")

VISION_PROMPT = """You are a professional veterinary AI assistant analyzing a photo of a dog found on the streets of India.

Analyze this image and return a JSON object with these fields:
{
  "is_dog": true/false,
  "breed": "primary breed or mix estimation (be specific, e.g. 'Indian Pariah Dog with possible Rajapalayam traits')",
  "breed_confidence": 0-100,
  "color": "detailed color description (e.g. 'tan with white chest patch and dark muzzle')",
  "color_category": "one of: black, white, brown, tan, grey, black & white, brown & white, tri-color, golden",
  "size": "one of: small, medium, large",
  "size_detail": "estimated weight and height (e.g. 'approximately 15kg, 45cm at shoulder')",
  "sex": "male/female/unknown (if visible from photo)",
  "age_estimate": "one of: puppy (< 6 mo), juvenile (6-18 mo), adult (1.5-7 yr), senior (7+ yr)",
  "age_detail": "reasoning for age estimate",
  "body_structure": "detailed body description (build, proportions, ear type, tail type)",
  "distinguishing_marks": "unique features - scars, markings, ear notches, collar, tags, spots",
  "health_observations": "visible health indicators - coat condition, weight, injuries, skin issues",
  "injured": true/false,
  "injury_notes": "description of any visible injuries or null",
  "temperament_guess": "based on posture/expression: friendly, shy, alert, aggressive, calm, fearful",
  "description": "A 2-3 sentence natural language summary describing this dog for a lost-and-found listing"
}

Return ONLY valid JSON, no markdown, no explanation. If this is not a dog, set is_dog to false and leave other fields as null."""
