"""
Import 2023 PUL Player Stats from CSV into Stats Hub JSON format.

The 2023 data is game-level with columns:
  Number, Name, Trimmed Name, Assists, Goals, Ds, Turnovers, Team, Home/Away, Week, Opponent

This script generates:
  - data/2023/players_season.json (aggregated season totals)
  - data/2023/players_games.json (per-game stats)
  - data/2023/teams_season.json (aggregated team totals)
  - data/2023/teams_games.json (per-game team stats)

Run from repo root:
  python processing/import_2023_stats.py
"""

import csv
import json
import os
from collections import defaultdict

# Team name normalization (fix inconsistencies in source data)
TEAM_NAME_FIXES = {
    'Nashville Nightshade': 'Nashville NightShade',
}

TEAM_ABBREVS = {
    'Atlanta Soul': 'ATL',
    'Austin Torch': 'ATX',
    'Columbus Pride': 'CBUS',
    'DC Shadow': 'DC',
    'Indy Red': 'IND',
    'Milwaukee Monarchs': 'MKE',
    'Minnesota Strike': 'MIN',
    'Nashville NightShade': 'NSH',
    'New York Gridlock': 'NY',
    'Philadelphia Surge': 'PHL',
    'Portland Rising': 'PORT',
    'Raleigh Radiance': 'RAL',
}

def safe_int(val):
    """Convert a value to int, treating empty/None as 0."""
    if val is None or val == '' or val == ' ':
        return 0
    try:
        return int(float(val))
    except (ValueError, TypeError):
        return 0

def main():
    csv_path = os.path.join('data', '2023', 'raw', '2023_PUL_Player_Stats_Compilation_Final_xlsx_-_Game_data.csv')
    output_dir = os.path.join('data', '2023')
    
    # Also check alternate locations
    if not os.path.exists(csv_path):
        alt_path = os.path.join('data', '2023', '2023_game_data.csv')
        if os.path.exists(alt_path):
            csv_path = alt_path
        else:
            # Try to find any CSV in the 2023 directory
            for f in os.listdir(os.path.join('data', '2023')):
                if f.endswith('.csv'):
                    csv_path = os.path.join('data', '2023', f)
                    break
    
    if not os.path.exists(csv_path):
        print(f"Error: Could not find 2023 CSV data.")
        print(f"Place the CSV file in data/2023/ and try again.")
        return
    
    print(f"Reading {csv_path}...")
    
    # Parse all game rows
    game_rows = []
    with open(csv_path, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            team = row.get('Team', '').strip()
            team = TEAM_NAME_FIXES.get(team, team)
            
            number = row.get('Number', '').strip()
            name = row.get('Trimmed Name', '').strip() or row.get('Name', '').strip()
            
            if not name or not team:
                continue
            
            # Pad number
            if number.isdigit():
                number = number.zfill(2)
            
            home_away = row.get('Home/Away', '').strip()
            week = row.get('Week', '').strip()
            opponent = row.get('Opponent', '').strip()
            
            # Build match string (e.g., "ATL @ DC" or "DC @ ATL")
            team_abbrev = TEAM_ABBREVS.get(team, team[:3].upper())
            
            # Determine match format
            if home_away == 'Away':
                match = f"{team_abbrev} @ {opponent}"
            else:
                match = f"{opponent} @ {team_abbrev}"
            
            game_rows.append({
                'player': f"{number} {name}" if number else name,
                'team': team,
                'teamAbbrev': team_abbrev,
                'match': match,
                'week': f"Week {week}" if week and not week.startswith('Week') else week,
                'goals': safe_int(row.get('Goals', 0)),
                'assists': safe_int(row.get('Assists', 0)),
                'blocks': safe_int(row.get('Ds', 0)),
                'turnovers': safe_int(row.get('Turnovers', 0)),
            })
    
    print(f"Parsed {len(game_rows)} game records")
    
    # Generate players_games.json
    players_games = []
    for row in game_rows:
        players_games.append({
            'player': row['player'],
            'team': row['team'],
            'teamAbbrev': row['teamAbbrev'],
            'match': row['match'],
            'week': row['week'],
            'goals': row['goals'],
            'assists': row['assists'],
            'blocks': row['blocks'],
            'turnovers': row['turnovers'],
        })
    
    # Aggregate player season totals
    player_totals = defaultdict(lambda: {
        'goals': 0, 'assists': 0, 'blocks': 0, 'turnovers': 0, 'touches': 0,
        'team': '', 'teamAbbrev': ''
    })
    
    for row in game_rows:
        key = row['player']
        player_totals[key]['goals'] += row['goals']
        player_totals[key]['assists'] += row['assists']
        player_totals[key]['blocks'] += row['blocks']
        player_totals[key]['turnovers'] += row['turnovers']
        player_totals[key]['touches'] += row['goals'] + row['assists']  # Approximate
        player_totals[key]['team'] = row['team']
        player_totals[key]['teamAbbrev'] = row['teamAbbrev']
    
    players_season = []
    for player_name, stats in sorted(player_totals.items()):
        players_season.append({
            'player': player_name,
            'team': stats['team'],
            'teamAbbrev': stats['teamAbbrev'],
            'goals': stats['goals'],
            'assists': stats['assists'],
            'blocks': stats['blocks'],
            'turnovers': stats['turnovers'],
            'touches': stats['touches'],
        })
    
    # Aggregate team game stats
    team_game_stats = {}
    
    for row in game_rows:
        key = (row['teamAbbrev'], row['match'], row['week'])
        if key not in team_game_stats:
            team_game_stats[key] = {
                'goals': 0, 'assists': 0, 'blocks': 0, 'turnovers': 0,
                'team': row['team'], 'teamAbbrev': row['teamAbbrev'],
            }
        team_game_stats[key]['goals'] += row['goals']
        team_game_stats[key]['assists'] += row['assists']
        team_game_stats[key]['blocks'] += row['blocks']
        team_game_stats[key]['turnovers'] += row['turnovers']
    
    teams_games = []
    for (abbrev, match, week), stats in sorted(team_game_stats.items()):
        teams_games.append({
            'abbrev': abbrev,
            'team': stats.get('team', ''),
            'match': match,
            'week': week,
            'goals': stats['goals'],
            'assists': stats['assists'],
            'blocks': stats['blocks'],
            'turnovers': stats['turnovers'],
        })
    
    # Aggregate team season totals
    team_season = defaultdict(lambda: {
        'goals': 0, 'assists': 0, 'blocks': 0, 'turnovers': 0, 'touches': 0,
        'holds': 0, 'completionRate': 0,
    })
    
    for player_name, stats in player_totals.items():
        team = stats['team']
        team_season[team]['goals'] += stats['goals']
        team_season[team]['assists'] += stats['assists']
        team_season[team]['blocks'] += stats['blocks']
        team_season[team]['turnovers'] += stats['turnovers']
    
    teams_season = []
    for team_name, stats in sorted(team_season.items()):
        teams_season.append({
            'team': team_name,
            'abbrev': TEAM_ABBREVS.get(team_name, ''),
            'goals': stats['goals'],
            'assists': stats['assists'],
            'blocks': stats['blocks'],
            'turnovers': stats['turnovers'],
            'touches': stats['goals'] + stats['assists'],
            'holds': 0,
            'completionRate': 0,
        })
    
    # Write output files
    os.makedirs(output_dir, exist_ok=True)
    
    with open(os.path.join(output_dir, 'players_games.json'), 'w', encoding='utf-8') as f:
        json.dump(players_games, f, indent=2, ensure_ascii=False)
    print(f"Exported {len(players_games)} player game records to data/2023/players_games.json")
    
    with open(os.path.join(output_dir, 'players_season.json'), 'w', encoding='utf-8') as f:
        json.dump(players_season, f, indent=2, ensure_ascii=False)
    print(f"Exported {len(players_season)} player season records to data/2023/players_season.json")
    
    with open(os.path.join(output_dir, 'teams_games.json'), 'w', encoding='utf-8') as f:
        json.dump(teams_games, f, indent=2, ensure_ascii=False)
    print(f"Exported {len(teams_games)} team game records to data/2023/teams_games.json")
    
    with open(os.path.join(output_dir, 'teams_season.json'), 'w', encoding='utf-8') as f:
        json.dump(teams_season, f, indent=2, ensure_ascii=False)
    print(f"Exported {len(teams_season)} team season records to data/2023/teams_season.json")
    
    # Export metadata
    with open(os.path.join(output_dir, 'meta.json'), 'w', encoding='utf-8') as f:
        json.dump({
            'season': '2023',
            'status': 'complete',
            'teams': len(teams_season),
            'players': len(players_season),
        }, f, indent=2)
    print(f"Exported metadata to data/2023/meta.json")
    
    print(f"\nDone! Remember to add '2023' to your seasons array.")


if __name__ == '__main__':
    main()