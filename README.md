# PUL Stats Hub v2

A modern, fast statistics dashboard for the Premier Ultimate League built with Astro, React, and TanStack Table.

**Live site:** [premierultimateleague.github.io/Stats-Hub](https://premierultimateleague.github.io/Stats-Hub/)

## Tech Stack

- **Frontend:** [Astro](https://astro.build/) - Static site generator
- **Tables:** [TanStack Table](https://tanstack.com/table) - Headless table library
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- **Data Processing:** Python + pandas
- **Hosting:** GitHub Pages

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.9+
- npm or yarn

### Installation

```bash
# Clone the repo
git clone https://github.com/PremierUltimateLeague/Stats-Hub.git
cd Stats-Hub


# Set up Python virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Install Node dependencies
npm install
```

### Development

```bash
# Start dev server with hot reload
npm run dev
```

Visit `http://localhost:4321/Stats-Hub/`

### Build

```bash
# Generate static site
npm run build

# Preview build locally
npm run preview
```

## Data Pipeline

### Overview

```
Google Drive CSVs → Python scripts → JSON → Astro build → Static HTML
```

### Steps

1. **Export raw data** from Google Drive (Game Day Info folder)

2. **Process data** (currently R scripts, migrating to Python):

   ```bash
   # These scripts read from stats/ and output to data/
   python processing/export_json.py
   ```

3. **Build site:**

   ```bash
   npm run build
   ```

4. **Deploy** (automatic via GitHub Actions on push to main)

### Directory Structure

```
├── data/                    # Generated JSON for frontend
│   └── 2025/
│       ├── teams_season.json
│       ├── players_season.json
│       └── _metadata.json
│
├── processing/              # Python data pipeline
│   └── export_json.py
│
├── src/
│   ├── components/          # React components
│   │   ├── StatsTable.tsx   # Main table component
│   │   └── TeamBadge.tsx
│   ├── layouts/
│   │   └── Layout.astro     # Base page layout
│   ├── pages/               # Route pages
│   │   ├── index.astro
│   │   ├── teams.astro
│   │   └── players.astro
│   └── styles/
│       └── global.css       # Tailwind + custom styles
└── public/                  # Static assets
```

## Deployment

### Automatic (GitHub Actions)

Every push to `main` triggers a build and deploy:

1. Runs Python export script
2. Builds Astro static site
3. Deploys to GitHub Pages

### Manual

```bash
# Build locally
npm run build

# The dist/ folder contains the static site
# Upload to any static hosting
```

### GitHub Pages Setup

1. Go to repo **Settings** → **Pages**
2. Set **Source** to "GitHub Actions"
3. Push to `main` - the action will deploy automatically

## Adding a New Season

1. Add processed stats CSVs to `stats/YEAR/`
2. Run `python processing/export_json.py`
3. Update navigation in `src/layouts/Layout.astro`
4. Create pages in `src/pages/YEAR/` (or use dynamic routes)
5. Push to `main`

## Customization

### Team Colors

Edit `tailwind.config.mjs` to update team colors:

```js
'teams': {
  'atlanta': '#c8102e',
  'philadelphia': '#004c54',
  // ...
}
```

### Adding Columns

Edit the `columns` array in the relevant page (`teams.astro`, `players.astro`):

```js
const columns = [
  { accessorKey: 'newStat', header: 'New Stat', size: 80 },
  // ...
];
```

## Contributing

1. Fork the repo
2. Create a feature branch
3. Make changes
4. Test locally with `npm run dev`
5. Submit a PR

## License

MIT
