# PawTrace India — Project Context

## Stack
- **Frontend**: React + Vite — `straydogs/` directory, port 3002 (3000/3001 are usually occupied)
- **Backend**: FastAPI + Uvicorn — `straydogs-backend/` directory, port 5000
- **Database**: Supabase (postgres + storage)

## UI Conventions
- **100% inline styles** — no CSS files, no Tailwind, no styled-components ever
- All styles are plain JS objects passed to `style={}`

### Color Palette
```js
const ORANGE      = '#E07B39'
const DARK_ORANGE = '#C0510B'
const NAVY        = '#1F4E79'
const LIGHT_NAVY  = '#2E74B5'
const BG          = '#FDF8F4'
const GRAY        = '#6B7280'
const LIGHT_GRAY  = '#F3F4F6'
const GREEN       = '#16A34A'
const RED         = '#DC2626'
const AMBER       = '#D97706'
```

## Routing
- **No React Router** — state machine in `straydogs/src/App.jsx`
- Active page controlled by `const [page, setPage] = useState('home')`
- Navigation via `setPage('pagename')` — never `<Link>` or `useNavigate`
- 5 nav tabs: `home`, `feed`, `report`, `stats`, `profile`

## Dev Server Startup
TensorFlow + YOLO take ~35 seconds to load. **Always start backend first and wait for it.**

Kill port 5000 if occupied:
```powershell
$p = (Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue).OwningProcess
if ($p) { Stop-Process -Id $p -Force }
```

Start backend (`straydogs-backend/`), then wait for `Application startup complete` in output before starting frontend (`straydogs/` → `npm run dev`).

## Backend ML Pipeline
- **Detection**: YOLOv8n (`yolov8n.pt`) — COCO class 16 (dog), returns bounding box crop
- **Classification**: MobileNetV2 custom model (`stray_dog_model.h5`) — 12 Indian breeds
- **Similarity matching**: Dense(128) feature extractor — cosine similarity, threshold 0.85
- Routes: `/status`, `/analyse`, `/analyse-batch`, `/save`, `/db`
