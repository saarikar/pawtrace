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
| AI vision (optional) | Ollama Vision LLM (llava:7b) with YOLO fallback |

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

The API is now running at `http://localhost:5000`.  
Interactive docs: `http://localhost:5000/docs`

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

This starts both the backend (port 5000) and frontend (port 5173).

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
| `GET` | `/vision-status` | Check Ollama Vision LLM availability |
| `POST` | `/analyse-vision` | Ollama Vision analysis (falls back to YOLO) |
| `POST` | `/analyse-vision-batch` | Batch vision analysis |

---

## Notes

- **No CSS files** — all styles are inline JS objects.
- The backend must be running for AI breed analysis. The frontend degrades gracefully if the backend is unreachable.
- If port 5000 is occupied on Windows:
  ```powershell
  $p = (Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue).OwningProcess
  if ($p) { Stop-Process -Id $p -Force }
  ```
