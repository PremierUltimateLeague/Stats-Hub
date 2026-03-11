# Stats Hub v2 - Project Structure

```
stats-hub-v2/
├── .github/
│   └── workflows/
│       ├── deploy.yml              # GitHub Actions: build & deploy to gh-pages
│       └── fetch-stats.yaml        # GitHub Actions: fetch CSVs from Drive & export JSON
│
├── data/                           # Generated JSON (gitignored, built by Python)
│   ├── 2025/
│   │   ├── teams_season.json
│   │   ├── teams_games.json
│   │   ├── players_season.json
│   │   ├── players_games.json
│   │   ├── standings.json
│   │   └── _metadata.json
│   └── 2024/
│       └── ...
│
├── input_data/                     # Raw CSVs fetched from Google Drive (gitignored)
│   ├── 2025/
│   │   ├── team-stats-overall.csv
│   │   ├── team-stats-game.csv
│   │   ├── player-stats-overall.csv
│   │   └── player-stats-game.csv
│   └── championship/
│       ├── 2025/
│       └── 2024/
│
├── processing/                     # Data pipeline scripts
│   ├── requirements.txt
│   ├── fetch-drive-data.js         # Step 1: Download CSVs from Google Drive
│   ├── export_json.py              # Step 2: Convert CSVs to JSON for the frontend
│   ├── export_schedule.py          # Export 2026 schedule data to JSON
│   └── process_championship.py    # Append championship game data to season JSON
│
├── src/                            # Astro frontend
│   ├── components/
│   │   ├── StatsTable.tsx          # React + TanStack Table component
│   │   ├── TeamBadge.tsx           # Team color dot + name display
│   │   ├── SeasonSelect.astro      # Season switcher dropdown
│   │   ├── BackButton.astro        # Navigation back button
│   │   └── EmptySeasonState.astro  # Empty state for missing data
│   │
│   ├── config/
│   │   ├── seasons.ts              # List of available seasons
│   │   ├── teamMeta.ts             # Team metadata (founded, status, location)
│   │   └── divisions.ts            # Division assignments by season
│   │
│   ├── layouts/
│   │   └── Layout.astro            # Base layout (nav, footer)
│   │
│   ├── pages/
│   │   ├── index.astro             # Landing / home page
│   │   ├── search.astro            # Search players & teams
│   │   ├── leaders.astro           # Season leaders by category
│   │   ├── standings.astro         # League standings
│   │   ├── schedule.astro          # Season schedule
│   │   ├── compare.astro           # Player comparison tool
│   │   ├── records.astro           # All-time records
│   │   ├── teams/
│   │   │   ├── index.astro         # Teams list
│   │   │   └── [team].astro        # Individual team page
│   │   └── players/
│   │       ├── index.astro         # Players list
│   │       └── [player].astro      # Individual player page
│   │
│   ├── scripts/
│   │   └── tabSwitcher.ts          # Shared tab-switching logic
│   │
│   ├── utils/
│   │   ├── teams.ts                # Team logos, abbreviations, colors, folders
│   │   └── seasonLoader.ts         # Utility to load season JSON files
│   │
│   └── styles/
│       └── global.css              # Tailwind + custom PUL theming
│
├── public/
│   ├── favicon.ico
│   └── images/
│       └── teams/                  # Team logos (PNG)
│
├── .editorconfig
├── .env.example
├── astro.config.mjs
├── eslint.config.js
├── tailwind.config.mjs
├── tsconfig.json
├── package.json
└── README.md
```

## Data Flow

1. **Raw Data** (Google Drive CSVs)
   ↓ `node processing/fetch-drive-data.js`
2. **Input CSVs** (`input_data/<year>/`)
   ↓ `python processing/export_json.py`
3. **JSON** (`data/<year>/`)
   ↓ Astro build
4. **Static HTML** (`dist/`)
   ↓ GitHub Actions (`deploy.yml`)
5. **Live Site** (GitHub Pages)

Championship data has an additional step:
- `python processing/process_championship.py` — appends championship game records to the season JSON files

## Key Commands
```bash
# Install dependencies
npm install
pip install -r processing/requirements.txt

# Fetch raw CSVs from Google Drive (requires DRIVE_FOLDER_ID env var)
node processing/fetch-drive-data.js

# Export CSVs to JSON for the frontend
python processing/export_json.py

# Process championship data (run after export_json.py)
python processing/process_championship.py

# Dev server
npm run dev

# Lint
npm run lint

# Build static site
npm run build

# Preview build
npm run preview
```
