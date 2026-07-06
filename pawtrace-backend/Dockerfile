FROM python:3.11-slim

# System deps for OpenCV
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy model files and app code
COPY stray_dog_model.h5 class_labels.json ./
COPY app.py config.py schemas.py ml.py db.py ./

# YOLOv8n weights — downloaded at build time if not present
ARG YOLO_WEIGHTS_URL=""
RUN if [ -n "$YOLO_WEIGHTS_URL" ]; then \
      pip install --no-cache-dir gdown && gdown "$YOLO_WEIGHTS_URL" -O yolov8n.pt; \
    fi
COPY yolov8n.pt* ./

EXPOSE 5001

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5001/status')" || exit 1

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "5001"]
