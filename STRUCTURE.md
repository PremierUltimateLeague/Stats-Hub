# Stats Hub v2 - Project Structure

```
stats-hub-v2/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions: build & deploy to gh-pages
│
├── data/                        # Generated JSON (gitignored, built by Python)
│   ├── 2025/
│   │   ├── teams_season.json
│   │   ├── teams_games.json
│   │   ├── players_season.json
│   │   ├── players_games.json
│   │   └── metadata.json
│   └── 2024/
│       └── ...
│
├── processing/                  # Python data pipeline
│   ├── requirements.txt
│   ├── integrate.py             # Step 1: Parse raw game files
│   ├── calculate.py             # Step 2: Aggregate stats
│   └── export_json.py           # Step 3: Output JSON for frontend
│
├── src/                         # Astro frontend
│   ├── components/
│   │   ├── StatsTable.tsx       # React + TanStack Table
│   │   ├── TeamBadge.tsx
│   │   ├── SeasonSelector.tsx
│   │   └── SearchFilter.tsx
│   │
│   ├── layouts/
│   │   └── Layout.astro         # Base layout (nav, footer, theme)
│   │
│   ├── pages/
│   │   ├── index.astro          # Landing page / current season
│   │   ├── teams.astro          # Team stats table
│   │   ├── players.astro        # Player stats table
│   │   └── [year]/              # Dynamic routes for historical seasons
│   │       ├── index.astro
│   │       ├── teams.astro
│   │       └── players.astro
│   │
│   └── styles/
│       └── global.css           # Tailwind + custom PUL theming
│
├── public/
│   ├── favicon.ico
│   └── images/
│       └── teams/               # Team logos
│
├── astro.config.mjs
├── tailwind.config.mjs
├── tsconfig.json
├── package.json
└── README.md
```

## Data Flow

1. **Raw Data** (Google Drive CSVs) 
   ↓ `processing/integrate.py`
2. **Integrated Data** (`integ-data/`)
   ↓ `processing/calculate.py`  
3. **Stats** (`stats/`)
   ↓ `processing/export_json.py`
4. **JSON** (`data/`)
   ↓ Astro build
5. **Static HTML** (`dist/`)
   ↓ GitHub Actions
6. **Live Site** (GitHub Pages)

## Key Commands

```bash
# Install dependencies
npm install
pip install -r processing/requirements.txt

# Run Python pipeline
python processing/integrate.py
python processing/calculate.py
python processing/export_json.py

# Dev server
npm run dev

# Build static site
npm run build

# Preview build
npm run preview
```
