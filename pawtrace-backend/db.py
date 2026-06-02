"""
Database helpers — Supabase client and query functions.
"""

import numpy as np
from fastapi import HTTPException
from supabase import create_client, Client

from config import SUPABASE_URL, SUPABASE_SERVICE_KEY

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env")

supabase_client: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def load_database() -> dict:
    """Load all dog feature vectors from the database."""
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


def count_dogs_with_features() -> int:
    """Count dogs that have a stored feature vector."""
    try:
        resp = supabase_client.table("dogs") \
            .select("dog_id", count="exact") \
            .not_.is_("feature_vector", "null") \
            .execute()
        return resp.count or 0
    except Exception:
        return -1
