#!/usr/bin/env python3
"""
Process championship weekend data and append to existing season JSON files.

2025 format: xlsx files with team sheets (Jersey #, Full Name, Goals, Assists, Blocks, Turnovers, Points played)
2024 format: Stato CSV exports per team per game (full stat columns)

Usage:
    python processing/process_championship.py
"""

import json
import pandas as pd
import openpyxl
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).parent.parent
DATA_DIR = REPO_ROOT / "data"
CHAMP_DIR = REPO_ROOT / "input_data" / "championship"

TEAM_NAMES = {
    "ATL": "Atlanta Soul",
    "ATX": "Austin Torch",
    "DC": "DC Shadow",
    "IND": "Indy Red",
    "INDY": "Indy Red",
    "LA": "LA Astra",
    "MKE": "Milwaukee Monarchs",
    "MIN": "Minnesota Strike",
    "MINN": "Minnesota Strike",
    "NSH": "Nashville NightShade",
    "NASH": "Nashville NightShade",
    "NY": "New York Gridlock",
    "PHL": "Philadelphia Surge",
    "PORT": "Portland Rising",
    "RAL": "Raleigh Radiance",
}

# ─── Championship game definitions ────────────────────────────────────────────
# Each entry: (filename_or_folder, away_abbrev, home_abbrev, week_label)

CHAMP_GAMES_2025 = [
    ("DC_vs_NY_stats_2025_Champs.xlsx", "DC", "NY", "Semifinals"),
    ("INDY_vs_RAL_stats_2025_Champs.xlsx", "INDY", "RAL", "Semifinals"),
    ("Finals_stats_2025_Champs.xlsx", "DC", "RAL", "Finals"),
]

CHAMP_GAMES_2024 = [
    ("Championship Weekend Semi_ DC @ PHL", "DC", "PHL", "Semifinals"),
    ("Championship Weekend Semi_ NY @ ATX", "NY", "ATX", "Semifinals"),
    ("Championship Final_ DC @ NY", "DC", "NY", "Finals"),
]

METERS_TO_YARDS = 1.09361


# ─── 2025 xlsx processing ────────────────────────────────────────────────────

def process_2025_xlsx(filepath: Path, away: str, home: str, week: str) -> tuple[list[dict], dict]:
    """Process a 2025 championship xlsx file. Returns (player_games, team_game_summary)."""
    wb = openpyxl.load_workbook(filepath, data_only=True)
    match_name = f"{ away} @ {home}"

    player_rows = []
    team_summaries = []

    for team_abbrev in [away, home]:
        # Find the sheet — try exact match, then case-insensitive
        sheet_name = None
        for s in wb.sheetnames:
            if s.upper() == team_abbrev.upper():
                sheet_name = s
                break
        if not sheet_name:
            print(f"  Warning: No sheet found for {team_abbrev} in {filepath.name}")
            continue

        ws = wb[sheet_name]
        headers = [cell.value for cell in ws[1]]

        team_goals = 0
        team_assists = 0
        team_blocks = 0
        team_turnovers = 0

        for row in ws.iter_rows(min_row=2, values_only=True):
            row_dict = dict(zip(headers, row))

            # Skip empty rows
            if not row_dict.get("Full Name"):
                continue

            jersey = str(row_dict.get("Jersey #", "")).replace(".0", "").strip()
            name = row_dict["Full Name"]
            player_name = f"{jersey.zfill(2)} {name}" if jersey else name

            goals = int(row_dict.get("Goals", 0) or 0)
            assists = int(row_dict.get("Assists", 0) or 0)
            blocks = int(row_dict.get("Blocks", 0) or 0)
            turnovers = int(row_dict.get("Turnovers", 0) or 0)

            team_goals += goals
            team_assists += assists
            team_blocks += blocks
            team_turnovers += turnovers

            player_rows.append({
                "player": player_name,
                "team": TEAM_NAMES.get(team_abbrev, team_abbrev),
                "teamAbbrev": team_abbrev,
                "week": week,
                "match": match_name,
                "goals": goals,
                "assists": assists,
                "blocks": blocks,
                "turnovers": turnovers,
                "+/-": goals + assists + blocks - turnovers,
            })

        team_summaries.append({
            "team": TEAM_NAMES.get(team_abbrev, team_abbrev),
            "abbrev": team_abbrev,
            "match": match_name,
            "week": week,
            "goals": team_goals,
            "blocks": team_blocks,
            "turnovers": team_turnovers,
        })

    # Compute team-level stats from Points sheet
    points_ws = None
    for name in ["Points", "points"]:
        if name in wb.sheetnames:
            points_ws = wb[name]
            break
    if points_ws:
        _enrich_team_stats_from_points(points_ws, team_summaries, away, home)

    return player_rows, team_summaries


def _enrich_team_stats_from_points(ws, team_summaries: list[dict], away: str, home: str):
    """Derive holds, breaks, clean holds from the Points sheet."""
    away_full = TEAM_NAMES.get(away, away)
    home_full = TEAM_NAMES.get(home, home)

    # Parse points: (pulling_team, scoring_team, clean)
    points = []
    for row in ws.iter_rows(min_row=2, max_col=4, values_only=True):
        if row[1] and row[2]:
            points.append({
                "pulling": str(row[1]).strip(),
                "scoring": str(row[2]).strip(),
                "clean": bool(row[3]) if row[3] is not None else False,
            })

    for summary in team_summaries:
        abbrev = summary["abbrev"]
        holds = 0
        clean_holds = 0
        break_goals = 0

        for pt in points:
            scoring = pt["scoring"]
            pulling = pt["pulling"]

            if scoring == abbrev:
                if pulling == abbrev:
                    # We pulled and scored = break (we were on D and scored)
                    break_goals += 1
                else:
                    # They pulled, we received and scored = hold
                    holds += 1
                    if pt["clean"]:
                        clean_holds += 1

        summary["holds"] = holds
        summary["cleanHolds"] = clean_holds
        summary["breakGoals"] = break_goals


# ─── 2024 CSV processing ─────────────────────────────────────────────────────

def process_2024_folder(base_dir: Path, folder: str, away: str, home: str, week: str) -> tuple[list[dict], list[dict]]:
    """Process a 2024 championship game folder with Stato CSVs."""
    game_dir = base_dir / folder
    if not game_dir.exists():
        print(f"  Warning: {game_dir} not found")
        return [], []

    match_name = f"{away} @ {home}"
    player_rows = []
    team_summaries = []

    for team_abbrev in [away, home]:
        # Find the team subfolder
        team_dir = None
        for d in game_dir.iterdir():
            if d.is_dir() and d.name.upper() == team_abbrev.upper():
                team_dir = d
                break
        if not team_dir:
            print(f"  Warning: No folder for {team_abbrev} in {game_dir}")
            continue

        # Find the Player Stats CSV
        stats_csv = None
        for f in team_dir.glob("Player Stats*.csv"):
            stats_csv = f
            break
        if not stats_csv:
            print(f"  Warning: No Player Stats CSV for {team_abbrev}")
            continue

        df = pd.read_csv(stats_csv)

        # Rename columns to match our schema
        col_renames = {
            "Player": "player",
            "Touches": "touches",
            "Throws": "throws",
            "Catches": "catches",
            "Defensive blocks": "blocks",
            "Goals": "goals",
            "Turnovers": "turnovers",
            "Assists": "assists",
            "Secondary assists": "secondaryAssists",
            "Offense points played": "offensePoints",
            "Defense points played": "defensePoints",
            "Possessions initiated": "possessionsInitiated",
            "Thrower errors": "throwerErrors",
            "Receiver errors": "receiverErrors",
            # 2024 uses meters — we'll convert
            "Total completed throw gain (m)": "totalThrowYards",
            "Average completed throw gain (m)": "avgThrowYards",
            "Total caught pass gain (m)": "totalCatchYards",
            "Average caught pass gain (m)": "avgCatchYards",
        }
        df = df.rename(columns=col_renames)

        # Convert meters to yards
        for col in ["totalThrowYards", "avgThrowYards", "totalCatchYards", "avgCatchYards"]:
            if col in df.columns:
                df[col] = (df[col] * METERS_TO_YARDS).round(1)

        df["team"] = TEAM_NAMES.get(team_abbrev, team_abbrev)
        df["teamAbbrev"] = team_abbrev
        df["week"] = week
        df["match"] = match_name

        # Compute +/-
        df["+/-"] = (
            df.get("goals", 0)
            + df.get("assists", 0)
            + df.get("blocks", 0)
            - df.get("turnovers", 0)
            - df.get("throwerErrors", 0)
            - df.get("receiverErrors", 0)
        )

        # Round yard columns
        for col in ["totalThrowYards", "avgThrowYards", "totalCatchYards", "avgCatchYards"]:
            if col in df.columns:
                df[col] = df[col].round(1)

        # Select columns that exist
        keep_cols = [
            "player", "team", "teamAbbrev", "week", "match",
            "goals", "assists", "secondaryAssists", "blocks", "turnovers",
            "touches", "throws", "catches",
            "offensePoints", "defensePoints", "possessionsInitiated",
            "throwerErrors", "receiverErrors",
            "totalThrowYards", "avgThrowYards", "totalCatchYards", "avgCatchYards",
            "+/-",
        ]
        keep_cols = [c for c in keep_cols if c in df.columns]
        df = df[keep_cols].fillna(0)

        player_rows.extend(df.to_dict(orient="records"))

        # Team summary
        team_summaries.append({
            "team": TEAM_NAMES.get(team_abbrev, team_abbrev),
            "abbrev": team_abbrev,
            "match": match_name,
            "week": week,
            "goals": int(df["goals"].sum()),
            "blocks": int(df["blocks"].sum()),
            "turnovers": int(df["turnovers"].sum()),
        })

    return player_rows, team_summaries


# ─── Main pipeline ────────────────────────────────────────────────────────────

def load_json(path: Path) -> list[dict]:
    if path.exists():
        with open(path) as f:
            return json.load(f)
    return []


def save_json(data: list[dict], path: Path) -> None:
    with open(path, "w") as f:
        json.dump(data, f, indent=2)
    print(f"  Saved {len(data)} records to {path}")


def remove_championship_records(data: list[dict]) -> list[dict]:
    """Remove any existing championship records so we can re-append cleanly."""
    return [r for r in data if r.get("week") not in ("Semifinals", "Finals")]


def process_season(year: int):
    """Process championship data for a given season and append to existing JSON."""
    data_dir = DATA_DIR / str(year)
    champ_source = CHAMP_DIR / str(year)

    if not champ_source.exists():
        print(f"No championship data found for {year} at {champ_source}")
        return

    print(f"\nProcessing {year} championship data...")

    all_player_games: list[dict] = []
    all_team_games: list[dict] = []

    if year == 2025:
        for filename, away, home, week in CHAMP_GAMES_2025:
            filepath = champ_source / filename
            if not filepath.exists():
                print(f"  Warning: {filepath} not found, skipping")
                continue
            print(f"  Processing {week}: {away} @ {home}")
            players, teams = process_2025_xlsx(filepath, away, home, week)
            all_player_games.extend(players)
            all_team_games.extend(teams)

    elif year == 2024:
        for folder, away, home, week in CHAMP_GAMES_2024:
            print(f"  Processing {week}: {away} @ {home}")
            players, teams = process_2024_folder(champ_source, folder, away, home, week)
            all_player_games.extend(players)
            all_team_games.extend(teams)

    if not all_player_games and not all_team_games:
        print(f"  No championship data processed for {year}")
        return

    # Load existing data, remove old championship records, append new ones
    players_games_path = data_dir / "players_games.json"
    teams_games_path = data_dir / "teams_games.json"

    existing_player_games = remove_championship_records(load_json(players_games_path))
    existing_team_games = remove_championship_records(load_json(teams_games_path))

    # Append
    existing_player_games.extend(all_player_games)
    existing_team_games.extend(all_team_games)

    save_json(existing_player_games, players_games_path)
    save_json(existing_team_games, teams_games_path)

    # Update standings with championship results
    standings_path = data_dir / "standings.json"
    if standings_path.exists():
        _update_standings_with_championship(standings_path, all_team_games)

    print(f"  {year} championship: {len(all_player_games)} player records, {len(all_team_games)} team records")


def _update_standings_with_championship(standings_path: Path, team_games: list[dict]):
    """Optionally mark championship results in standings (not affecting W-L record)."""
    # Championship games don't count toward regular season standings,
    # but we could add a 'championshipResults' field later if desired.
    pass


def main():
    process_season(2024)
    process_season(2025)
    print("\nDone!")


if __name__ == "__main__":
    main()