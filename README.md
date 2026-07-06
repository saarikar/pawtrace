# PawTrace India

A community-driven platform for Indian cities to spot, report, and track stray and lost dogs using AI-assisted breed identification and visual similarity matching.

## Features

- **Home** — landing page with quick actions and recent activity
- **Dog search** — browse and filter sightings by breed, colour, size, or upload a photo for visual similarity matching
- **Report a dog** — photograph a stray or lost pet; AI identifies the breed and checks for duplicates
- **Status tracking** — mark dogs as sighted / being rescued / in shelter / reunited
- **Lost pet flow** — report a missing pet with owner contact details
- **Vaccination records** — log vaccination history per dog
- **Stats** — city-level breakdown of breeds, sightings, and rescue rates
- **Auth** — sign up / sign in via Supabase; profile page per user

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + React Router |
| Backend | FastAPI + Uvicorn |
| Mobile | React Native + Expo (SDK 56) |
| Database | Supabase (Postgres + Storage + Auth) |
| ML — detection | YOLOv8n (COCO class 16 — dog) |
| ML — classification | MobileNetV2 fine-tuned on 12 Indian breeds |
| ML — dedup | Dense(128) feature extractor + cosine similarity (threshold 0.85) |
| AI vision (optional) | Google Gemini (gemini-2.0-flash) with YOLO + MobileNetV2 fallback |

## Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- `stray_dog_model.h5` — included in the repo under `pawtrace-backend/`

---

## Quick Start (for reviewers)

The Supabase database is already set up and running. You just need two small config files with the keys — **contact the contributor to get these**.

Once you have them:

1. Place `.env` in the `pawtrace-backend/` folder
2. Place `.env.local` in the `pawtrace-web/` folder
3. Follow **Backend Setup** and **Frontend Setup** below

You do not need to create a Supabase account or run any SQL.

---

## 1. Supabase Setup (skip if reviewing — see Quick Start above)

1. Create a new project at [supabase.com](https://supabase.com).
2. Open the **SQL editor** and run the contents of `pawtrace-web/supabase/schema.sql`. This creates the `profiles` and `dogs` tables, RLS policies, triggers, and seed data.
3. In **Project Settings → API**, note your:
   - Project URL (`https://xxxx.supabase.co`)
   - `anon` public key — goes in `pawtrace-web/.env.local` as `VITE_SUPABASE_ANON_KEY`
   - `service_role` secret key — goes in `pawtrace-backend/.env` as `SUPABASE_SERVICE_KEY` (never commit this)
4. In **Storage**, create a public bucket named `dog-photos`.

---

## 2. Backend Setup

```bash
cd pawtrace-backend
```

### Environment variables

Create a `.env` file (never commit this):

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

# Auth key for protected endpoints (/save, /analyse-vision, …).
# Must match VITE_BACKEND_API_KEY in pawtrace-web/.env.local — pick any long random string.
API_KEY=your-api-key

# Google Gemini vision (optional). Leave blank to fall back to YOLO + MobileNetV2.
GEMINI_API_KEY=your-gemini-api-key
# GEMINI_MODEL=gemini-2.0-flash   # optional override
```

### Model files

`stray_dog_model.h5` is included in the repo. The `yolov8n.pt` weights are downloaded automatically by Ultralytics on first run.

### Install dependencies

```bash
pip install -r requirements.txt
```

> TensorFlow + YOLO take ~35 seconds to load on first start — this is expected.

### Start the backend

```bash
python app.py
```

Wait for:
```
Application startup complete.
```

The API is now running at `http://localhost:5001`.  
Interactive docs: `http://localhost:5001/docs`

---

## 2a. Gemini Vision (Optional but Recommended)

For richer analysis — breed-mix estimates, health observations, distinguishing marks, injury detection, and temperament guesses — the backend calls **Google Gemini** (`gemini-2.0-flash`). If `GEMINI_API_KEY` is not set (or Gemini is unreachable), the backend automatically falls back to the local YOLO + MobileNetV2 pipeline, so the app keeps working without it.

### Setup

1. Create an API key at [Google AI Studio](https://aistudio.google.com/apikey).
2. Add it to `pawtrace-backend/.env`:
   ```env
   GEMINI_API_KEY=your-gemini-api-key
   ```
3. Restart the backend, then visit `http://localhost:5001/vision-status` — you should see `{"online": true, "provider": "gemini", ...}`.

### Environment variables

| Variable | Default | Description |
|---|---|---|
| `GEMINI_API_KEY` | *(empty)* | Google Gemini API key. Empty → vision disabled, YOLO + MobileNetV2 fallback used. |
| `GEMINI_MODEL` | `gemini-2.0-flash` | Gemini model to use. |

---

## 3. Frontend Setup

Open a **new terminal**:

```bash
cd pawtrace-web
```

### Environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Must match API_KEY in pawtrace-backend/.env
VITE_BACKEND_API_KEY=your-api-key

# Backend URL (optional — defaults to http://127.0.0.1:5001)
VITE_BACKEND_URL=http://127.0.0.1:5001
```

### Install dependencies

```bash
npm install
```

### Start the frontend

```bash
npm run dev
```

---

## 4. Docker (optional)

```bash
docker compose up --build
```

This starts the backend and frontend (web on port 5173). Note: the Docker backend is exposed on port **5000**, whereas the local `python app.py` path above runs on **5001**. To enable Gemini vision inside Docker, add `GEMINI_API_KEY` to the `pawtrace-backend` service's environment in `docker-compose.yml`.

---

## 5. Mobile App — Expo (optional)

The React Native app lives in `pawtrace-mobile/`. Its Supabase URL/key and backend URL are configured in `app.json` under `expo.extra` (no `.env` needed).

```bash
cd pawtrace-mobile
npm install
npx expo start
```

Scan the QR code with the **Expo Go** app (iOS/Android), or press `a` / `i` to launch an emulator. The app talks to the backend at the `backendUrl` in `app.json` (default `http://localhost:5001`); when testing on a physical device, change it to your computer's LAN IP so the phone can reach the backend.

---

## Project Structure

```
pawtrace/
├── pawtrace-web/               # React frontend (Vite)
│   ├── src/
│   │   ├── App.jsx             # React Router layout + auth context
│   │   ├── lib/
│   │   │   ├── constants.js    # Shared brand colours + enums
│   │   │   ├── utils.js        # Shared utilities (timeAgo, etc.)
│   │   │   ├── data.js         # Supabase queries
│   │   │   ├── supabase.js     # Supabase client
│   │   │   └── vision.js       # Backend ML API calls
│   │   └── pages/              # Route pages (Home, Feed, Search, Report, Dog, Stats, Profile, Auth)
│   ├── supabase/schema.sql     # Database schema (run once)
│   └── .env.example
│
├── pawtrace-backend/           # FastAPI backend
│   ├── app.py                  # Route handlers
│   ├── config.py               # Constants + env vars
│   ├── schemas.py              # Pydantic request models
│   ├── ml.py                   # ML pipeline (YOLO, breed, features, matching)
│   ├── db.py                   # Supabase query helpers
│   ├── class_labels.json       # 12 breed label map
│   └── requirements.txt
│
├── pawtrace-mobile/            # React Native + Expo app
│   ├── src/
│   │   ├── screens/            # App screens
│   │   ├── components/         # Reusable UI components
│   │   ├── lib/                # Shared utilities + API layer
│   │   └── context/            # App context (auth, profile)
│   └── app.json
│
└── docker-compose.yml
```

---

## Backend API

| Method | Route | Description |
|---|---|---|
| `GET` | `/status` | Health check + model info |
| `POST` | `/analyse` | Run YOLO + MobileNetV2 on a base64 image |
| `POST` | `/analyse-batch` | Analyse multiple images |
| `POST` | `/save` | Save a feature vector to Supabase |
| `GET` | `/db` | List dogs with stored feature vectors |
| `POST` | `/search` | Visual + attribute search with geo-ranking |
| `GET` | `/vision-status` | Check Gemini vision availability |
| `POST` | `/analyse-vision` | Gemini vision analysis (falls back to YOLO + MobileNetV2) |
| `POST` | `/analyse-vision-batch` | Batch vision analysis |

---

## Notes

- **No CSS files** — all styles are inline JS objects.
- The backend must be running for AI breed analysis. The frontend degrades gracefully if the backend is unreachable.
- Protected endpoints (`/save`, `/analyse-vision`, …) require an `X-API-Key` header matching `API_KEY`; the web app sends it automatically from `VITE_BACKEND_API_KEY`.
- If port 5001 is occupied on Windows:
  ```powershell
  $p = (Get-NetTCPConnection -LocalPort 5001 -ErrorAction SilentlyContinue).OwningProcess
  if ($p) { Stop-Process -Id $p -Force }
  ```
