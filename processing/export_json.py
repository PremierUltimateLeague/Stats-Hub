#!/usr/bin/env python3
"""
Export processed stats CSVs to JSON format for the Astro frontend.

This script reads the CSVs from stats/ and outputs JSON files to data/
that the frontend can consume at build time.
"""

import json
import pandas as pd
from pathlib import Path
from datetime import datetime

# Paths
REPO_ROOT = Path(__file__).parent.parent
DATA_DIR = REPO_ROOT / "data"

# Team name mapping (abbreviation -> full name)
TEAM_NAMES = {
    'ATL': 'Atlanta Soul',
    'ATX': 'Austin Torch',
    'DC': 'DC Shadow',
    'IND': 'Indy Red',
    'INDY': 'Indy Red',
    'LA': 'LA Astra',
    'MKE': 'Milwaukee Monarchs',
    'MIN': 'Minnesota Strike',
    'MINN': 'Minnesota Strike',
    'NSH': 'Nashville NightShade',
    'NASH': 'Nashville NightShade',
    'NY': 'New York Gridlock',
    'PHL': 'Philadelphia Surge',
    'RAL': 'Raleigh Radiance',
}


def ensure_output_dir(year: int) -> Path:
    """Create output directory for a given year."""
    output_dir = DATA_DIR / str(year)
    output_dir.mkdir(parents=True, exist_ok=True)
    return output_dir


def export_teams_overall(csv_path: Path, json_path: Path) -> None:
    """Export team stats overall."""
    if not csv_path.exists():
        print(f"Warning: {csv_path} not found, skipping")
        return
    
    df = pd.read_csv(csv_path)
    
    # Add full team names
    df['team_full'] = df['team'].map(TEAM_NAMES).fillna(df['team'])
    
    # Rename columns for frontend
    df = df.rename(columns={
        'team': 'abbrev',
        'team_full': 'team',
        'goals': 'goals',
        'break_goals': 'breakGoals',
        'defensive_blocks': 'blocks',
        'holds': 'holds',
        'clean_holds': 'cleanHolds',
        'pass_attempts': 'passAttempts',
        'turnovers': 'turnovers',
        'completed_passess': 'completedPasses',
        'completion_rate': 'completionRate',
        'hucks': 'hucks',
    })
    
    # Format completion rate as percentage
    if 'completionRate' in df.columns:
        df['completionRate'] = (df['completionRate'] * 100).round(1)
    records = df.to_dict(orient='records')
    
    with open(json_path, 'w') as f:
        json.dump(records, f, indent=2)
    
    print(f"Exported {len(records)} team records to {json_path}")


def export_players_overall(csv_path: Path, json_path: Path) -> None:
    """Export player stats overall."""
    if not csv_path.exists():
        print(f"Warning: {csv_path} not found, skipping")
        return
    
    df = pd.read_csv(csv_path)
    
    # Add full team names
    df['team_full'] = df['team'].map(TEAM_NAMES).fillna(df['team'])
    
    # Rename columns for frontend
    df = df.rename(columns={
        'team': 'teamAbbrev',
        'team_full': 'team',
        'Player': 'player',
        'Touches': 'touches',
        'Throws': 'throws',
        'Catches': 'catches',
        'Defensive blocks': 'blocks',
        'Goals': 'goals',
        'Turnovers': 'turnovers',
        'Assists': 'assists',
        'Secondary assists': 'secondaryAssists',
        'Offense points played': 'offensePoints',
        'Defense points played': 'defensePoints',
    })
    
    # Select key columns for the frontend
    columns_to_keep = [
        'player', 'team', 'teamAbbrev', 'goals', 'assists', 'blocks', 
        'turnovers', 'touches', 'throws', 'catches', 'offensePoints', 'defensePoints'
    ]
    
    # Only keep columns that exist
    columns_to_keep = [c for c in columns_to_keep if c in df.columns]
    df = df[columns_to_keep]
    
    records = df.to_dict(orient='records')
    
    with open(json_path, 'w') as f:
        json.dump(records, f, indent=2)
    
    print(f"Exported {len(records)} player records to {json_path}")


def export_season(year: int, stats_dir: Path) -> None:
    """Export all stats for a given season."""
    output_dir = ensure_output_dir(year)
    
    # Export team stats
    export_teams_overall(
        stats_dir / "team-stats-overall.csv",
        output_dir / "teams_season.json"
    )
    
    # Export player stats
    export_players_overall(
        stats_dir / "player-stats-overall.csv",
        output_dir / "players_season.json"
    )
    
    # Create metadata file
    metadata = {
        "season": year,
        "lastUpdated": datetime.now().isoformat(),
    }
    
    with open(output_dir / "metadata.json", 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"Exported season {year} metadata")


def main():
    """Export all available seasons."""
    repo_root = REPO_ROOT
    
    # 2024 data is in stats/
    stats_2024 = repo_root / "stats"
    if stats_2024.exists() and (stats_2024 / "team-stats-overall.csv").exists():
        print("\nExporting 2024 season...")
        export_season(2024, stats_2024)
    
    # 2025 data is in 2025/stats/
    stats_2025 = repo_root / "2025" / "stats"
    if stats_2025.exists() and (stats_2025 / "team-stats-overall.csv").exists():
        print("\nExporting 2025 season...")
        export_season(2025, stats_2025)
    
    print("\nDone!")


if __name__ == "__main__":
    main()