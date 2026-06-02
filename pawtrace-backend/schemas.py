"""
Pydantic request models with input validation.
"""

import base64
from pydantic import BaseModel, field_validator

from config import MAX_IMAGE_SIZE, MAX_BATCH_IMAGES


def _validate_base64_image(v: str) -> str:
    if len(v) > MAX_IMAGE_SIZE:
        raise ValueError(f"Image too large ({len(v)} bytes). Max {MAX_IMAGE_SIZE // 1024 // 1024} MB.")
    try:
        base64.b64decode(v, validate=True)
    except Exception:
        raise ValueError("Invalid base64 encoding")
    return v


class AnalyseRequest(BaseModel):
    image: str
    mime: str = "image/jpeg"

    @field_validator("image")
    @classmethod
    def check_image(cls, v):
        return _validate_base64_image(v)


class SaveRequest(BaseModel):
    dog_id: str
    feature: list[float]

    @field_validator("dog_id")
    @classmethod
    def check_dog_id(cls, v):
        if not v or len(v) > 100:
            raise ValueError("dog_id must be 1-100 characters")
        return v

    @field_validator("feature")
    @classmethod
    def check_feature(cls, v):
        if len(v) != 128:
            raise ValueError(f"Feature vector must be 128-dim, got {len(v)}")
        return v


class BatchAnalyseRequest(BaseModel):
    images: list[str]
    mime: str = "image/jpeg"

    @field_validator("images")
    @classmethod
    def check_images(cls, v):
        if len(v) > MAX_BATCH_IMAGES:
            raise ValueError(f"Max {MAX_BATCH_IMAGES} images per batch")
        if len(v) == 0:
            raise ValueError("At least one image required")
        for img in v:
            _validate_base64_image(img)
        return v


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

    @field_validator("images")
    @classmethod
    def check_images(cls, v):
        if len(v) > MAX_BATCH_IMAGES:
            raise ValueError(f"Max {MAX_BATCH_IMAGES} images per search")
        if len(v) == 0:
            raise ValueError("At least one image required")
        for img in v:
            _validate_base64_image(img)
        return v

    @field_validator("top_n")
    @classmethod
    def check_top_n(cls, v):
        if v < 1 or v > 50:
            raise ValueError("top_n must be between 1 and 50")
        return v

    @field_validator("radius_km")
    @classmethod
    def check_radius(cls, v):
        if v <= 0 or v > 500:
            raise ValueError("radius_km must be between 0 and 500")
        return v


class VisionRequest(BaseModel):
    image: str
    mime: str = "image/jpeg"

    @field_validator("image")
    @classmethod
    def check_image(cls, v):
        return _validate_base64_image(v)


class VisionBatchRequest(BaseModel):
    images: list[str]
    mime: str = "image/jpeg"

    @field_validator("images")
    @classmethod
    def check_images(cls, v):
        if len(v) > MAX_BATCH_IMAGES:
            raise ValueError(f"Max {MAX_BATCH_IMAGES} images per batch")
        if len(v) == 0:
            raise ValueError("At least one image required")
        for img in v:
            _validate_base64_image(img)
        return v
