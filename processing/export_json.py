#!/usr/bin/env python3
"""
Export processed stats CSVs to JSON format for the Astro frontend.
"""

import json
import pandas as pd
from pathlib import Path
from datetime import datetime

REPO_ROOT = Path(__file__).parent.parent
DATA_DIR = REPO_ROOT / "data"

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
    'PORT': 'Portland Rising',
    'RAL': 'Raleigh Radiance',
}


def ensure_output_dir(year: int) -> Path:
    output_dir = DATA_DIR / str(year)
    output_dir.mkdir(parents=True, exist_ok=True)
    return output_dir


def export_teams_overall(csv_path: Path, json_path: Path) -> None:
    if not csv_path.exists():
        print(f"Warning: {csv_path} not found, skipping")
        return
    
    df = pd.read_csv(csv_path)
    df['team_full'] = df['team'].map(TEAM_NAMES).fillna(df['team'])
    
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
    
    if 'completionRate' in df.columns:
        df['completionRate'] = (df['completionRate'] * 100).round(1)
    
    df = df.fillna(0)
    records = df.to_dict(orient='records')
    
    with open(json_path, 'w') as f:
        json.dump(records, f, indent=2)
    
    print(f"Exported {len(records)} team records to {json_path}")


def export_teams_by_game(csv_path: Path, json_path: Path) -> None:
    if not csv_path.exists():
        print(f"Warning: {csv_path} not found, skipping")
        return
    
    df = pd.read_csv(csv_path)
    df['team_full'] = df['team'].map(TEAM_NAMES).fillna(df['team'])
    
    df = df.rename(columns={
        'team': 'abbrev',
        'team_full': 'team',
        'match': 'match',
        'week': 'week',
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
    
    if 'completionRate' in df.columns:
        df['completionRate'] = (df['completionRate'] * 100).round(1)
    
    df = df.fillna(0)
    records = df.to_dict(orient='records')
    
    with open(json_path, 'w') as f:
        json.dump(records, f, indent=2)
    
    print(f"Exported {len(records)} team game records to {json_path}")


def export_players_overall(csv_path: Path, json_path: Path) -> None:
    if not csv_path.exists():
        print(f"Warning: {csv_path} not found, skipping")
        return
    
    df = pd.read_csv(csv_path)
    df['team_full'] = df['team'].map(TEAM_NAMES).fillna(df['team'])
    
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
    
    columns_to_keep = [
        'player', 'team', 'teamAbbrev', 'goals', 'assists', 'blocks', 
        'turnovers', 'touches', 'throws', 'catches', 'offensePoints', 'defensePoints'
    ]
    columns_to_keep = [c for c in columns_to_keep if c in df.columns]
    df = df[columns_to_keep]

    df["+/-"] = df['goals'] + df['assists'] - df['turnovers']
    
    df = df.fillna(0)
    records = df.to_dict(orient='records')
    
    with open(json_path, 'w') as f:
        json.dump(records, f, indent=2)
    
    print(f"Exported {len(records)} player records to {json_path}")


def export_players_by_game(csv_path: Path, json_path: Path) -> None:
    if not csv_path.exists():
        print(f"Warning: {csv_path} not found, skipping")
        return
    
    df = pd.read_csv(csv_path)
    df['team_full'] = df['team'].map(TEAM_NAMES).fillna(df['team'])
    
    df = df.rename(columns={
        'team': 'teamAbbrev',
        'team_full': 'team',
        'Player': 'player',
        'week': 'week',
        'match': 'match',
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
    
    columns_to_keep = [
        'player', 'team', 'teamAbbrev', 'week', 'match', 'goals', 'assists', 'blocks', 
        'turnovers', 'touches', 'offensePoints', 'defensePoints'
    ]
    columns_to_keep = [c for c in columns_to_keep if c in df.columns]
    df = df[columns_to_keep]
    
    df = df.fillna(0)
    records = df.to_dict(orient='records')
    
    with open(json_path, 'w') as f:
        json.dump(records, f, indent=2)
    
    print(f"Exported {len(records)} player game records to {json_path}")

def export_season(year: int, stats_dir: Path) -> None:
    output_dir = ensure_output_dir(year)
    
    export_teams_overall(
        stats_dir / "team-stats-overall.csv",
        output_dir / "teams_season.json"
    )
    
    export_teams_by_game(
        stats_dir / "team-stats-game.csv",
        output_dir / "teams_games.json"
    )
    
    export_players_overall(
        stats_dir / "player-stats-overall.csv",
        output_dir / "players_season.json"
    )
    
    export_players_by_game(
        stats_dir / "player-stats-game.csv",
        output_dir / "players_games.json"
    )
    
    export_standings(
        stats_dir / "team-stats-game.csv",
        output_dir / "standings.json"
    )
    
    metadata = {
        "season": year,
        "lastUpdated": datetime.now().isoformat(),
    }
    
    with open(output_dir / "metadata.json", 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"Exported season {year} metadata")


def main():
    repo_root = REPO_ROOT
    
    stats_2024 = repo_root / "stats"
    if stats_2024.exists() and (stats_2024 / "team-stats-overall.csv").exists():
        print("\nExporting 2024 season...")
        export_season(2024, stats_2024)
    
    stats_2025 = repo_root / "2025" / "stats"
    if stats_2025.exists() and (stats_2025 / "team-stats-overall.csv").exists():
        print("\nExporting 2025 season...")
        export_season(2025, stats_2025)
    
    print("\nDone!")

def export_standings(csv_path: Path, json_path: Path) -> None:
    """Calculate standings from game-by-game stats."""
    if not csv_path.exists():
        print(f"Warning: {csv_path} not found, skipping standings")
        return
    
    df = pd.read_csv(csv_path)
    
    # Division assignments (2024-2025 structure)
    north_division = ['New York Gridlock', 'Indy Red', 'Minnesota Strike', 
                      'Milwaukee Monarchs', 'Philadelphia Surge', 'Portland Rising']
    south_division = ['Atlanta Soul', 'Austin Torch', 'DC Shadow', 
                      'Nashville NightShade', 'Raleigh Radiance', 'LA Astra']
    
    # Get unique matches
    matches = df['match'].unique()
    
    # Track wins/losses for each team, and game results in order
    standings = {}
    game_results = {}  # team -> list of (week_num, result)
    
    for match in matches:
        match_data = df[df['match'] == match]
        if len(match_data) != 2:
            continue
        
        team1 = match_data.iloc[0]
        team2 = match_data.iloc[1]
        
        team1_name = team1['team']
        team2_name = team2['team']
        team1_goals = team1['goals']
        team2_goals = team2['goals']
        week_str = team1['week']
        
        # Parse week number
        try:
            week_num = int(week_str.replace('Week ', ''))
        except:
            week_num = 0
        
        # Initialize teams if not seen
        for team in [team1_name, team2_name]:
            if team not in standings:
                team_full = TEAM_NAMES.get(team, team)
                division = 'North' if team_full in north_division else 'South' if team_full in south_division else 'Unknown'
                standings[team] = {
                    'abbrev': team,
                    'team': team_full,
                    'division': division,
                    'wins': 0,
                    'losses': 0,
                    'pointsFor': 0,
                    'pointsAgainst': 0,
                }
                game_results[team] = []
        
        # Record result
        standings[team1_name]['pointsFor'] += team1_goals
        standings[team1_name]['pointsAgainst'] += team2_goals
        standings[team2_name]['pointsFor'] += team2_goals
        standings[team2_name]['pointsAgainst'] += team1_goals
        
        if team1_goals > team2_goals:
            standings[team1_name]['wins'] += 1
            standings[team2_name]['losses'] += 1
            game_results[team1_name].append((week_num, 'W'))
            game_results[team2_name].append((week_num, 'L'))
        elif team2_goals > team1_goals:
            standings[team2_name]['wins'] += 1
            standings[team1_name]['losses'] += 1
            game_results[team2_name].append((week_num, 'W'))
            game_results[team1_name].append((week_num, 'L'))
        else:
            # Tie (rare)
            game_results[team1_name].append((week_num, 'T'))
            game_results[team2_name].append((week_num, 'T'))
    
    # Convert to list and calculate derived stats
    records = []
    for team, team_data in standings.items():
        total_games = team_data['wins'] + team_data['losses']
        team_data['games'] = total_games
        team_data['winPct'] = round(team_data['wins'] / total_games * 100, 1) if total_games > 0 else 0
        team_data['pointDiff'] = team_data['pointsFor'] - team_data['pointsAgainst']
        
        # Calculate last 5 games (sorted by week, most recent last)
        results = sorted(game_results[team], key=lambda x: x[0])
        last_5_results = [r[1] for r in results[-5:]]
        team_data['last5'] = last_5_results
        
        # Convert numpy types to Python types
        team_data['wins'] = int(team_data['wins'])
        team_data['losses'] = int(team_data['losses'])
        team_data['pointsFor'] = int(team_data['pointsFor'])
        team_data['pointsAgainst'] = int(team_data['pointsAgainst'])
        team_data['games'] = int(team_data['games'])
        team_data['pointDiff'] = int(team_data['pointDiff'])
        
        records.append(team_data)
    
    # Sort by division, then wins (desc), then point differential (desc)
    records.sort(key=lambda x: (x['division'], -x['wins'], -x['pointDiff']))
    
    with open(json_path, 'w') as f:
        json.dump(records, f, indent=2)
    
    print(f"Exported {len(records)} team standings to {json_path}")

if __name__ == "__main__":
    main()