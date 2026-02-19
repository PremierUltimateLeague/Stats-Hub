"""
Import 2026 PUL Rosters from CSV files into Stats Hub JSON format.

Place CSV files in data/2026/rosters/ with names like:
  atlanta.csv, austin.csv, dc.csv, etc.

Each CSV should have columns: Player #, Player Full Name, Pronouns
Coaches have "Coach" in the Player # field and are separated out.

Run from the repo root:
  python processing/import_2026_rosters.py
"""

import csv
import json
import os

# Map CSV filenames to full team names
TEAM_MAP = {
    'atlanta': 'Atlanta Soul',
    'austin': 'Austin Torch',
    'dc': 'DC Shadow',
    'indy': 'Indy Red',
    'milwaukee': 'Milwaukee Monarchs',
    'minnesota': 'Minnesota Strike',
    'nashville': 'Nashville NightShade',
    'new_york': 'New York Gridlock',
    'philadelphia': 'Philadelphia Surge',
    'portland': 'Portland Rising',
    'raleigh': 'Raleigh Radiance',
}

TEAM_ABBREVS = {
    'Atlanta Soul': 'ATL',
    'Austin Torch': 'ATX',
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

def main():
    roster_dir = os.path.join('data', '2026', 'rosters')
    output_dir = os.path.join('data', '2026')
    
    if not os.path.exists(roster_dir):
        print(f"Error: {roster_dir} not found. Create it and add CSV files.")
        return
    
    all_players = []
    all_coaches = []
    team_rosters = {}
    
    for filename in sorted(os.listdir(roster_dir)):
        if not filename.endswith('.csv'):
            continue
        
        team_key = filename.replace('.csv', '').lower()
        team_name = TEAM_MAP.get(team_key)
        
        if not team_name:
            print(f"Warning: No team mapping for '{team_key}', skipping {filename}")
            continue
        
        team_abbrev = TEAM_ABBREVS[team_name]
        players = []
        coaches = []
        
        filepath = os.path.join(roster_dir, filename)
        with open(filepath, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            for row in reader:
                number = row.get('Player #', '').strip()
                name = row.get('Player Full Name', '').strip()
                pronouns = row.get('Pronouns', '').strip()
                
                if not name:
                    continue
                
                if number.lower() == 'coach':
                    coaches.append({
                        'name': name,
                        'team': team_name,
                        'teamAbbrev': team_abbrev,
                        'role': 'Coach',
                    })
                else:
                    # Pad single-digit numbers with leading zero to match existing format
                    if number.isdigit():
                        number = number.zfill(2)
                    
                    player_display = f"{number} {name}" if number else name
                    
                    players.append({
                        'player': player_display,
                        'team': team_name,
                        'teamAbbrev': team_abbrev,
                        'number': number,
                        'pronouns': pronouns,
                        'goals': 0,
                        'assists': 0,
                        'blocks': 0,
                        'turnovers': 0,
                        'touches': 0,
                    })
        
        team_rosters[team_name] = {
            'players': players,
            'coaches': coaches,
        }
        all_players.extend(players)
        all_coaches.extend(coaches)
        
        print(f"  {team_name}: {len(players)} players, {len(coaches)} coaches")
    
    # Write players_season.json (same format as other seasons)
    players_output = []
    for p in all_players:
        players_output.append({
            'player': p['player'],
            'team': p['team'],
            'teamAbbrev': p['teamAbbrev'],
            'goals': 0,
            'assists': 0,
            'blocks': 0,
            'turnovers': 0,
            'touches': 0,
        })
    
    players_path = os.path.join(output_dir, 'players_season.json')
    with open(players_path, 'w', encoding='utf-8') as f:
        json.dump(players_output, f, indent=2, ensure_ascii=False)
    print(f"\nExported {len(players_output)} players to {players_path}")
    
    # Write teams_season.json
    teams_output = []
    for team_name, roster in team_rosters.items():
        teams_output.append({
            'team': team_name,
            'abbrev': TEAM_ABBREVS[team_name],
            'rosterSize': len(roster['players']),
            'goals': 0,
            'assists': 0,
            'blocks': 0,
            'turnovers': 0,
            'touches': 0,
            'holds': 0,
            'completionRate': 0,
        })
    
    teams_path = os.path.join(output_dir, 'teams_season.json')
    with open(teams_path, 'w', encoding='utf-8') as f:
        json.dump(teams_output, f, indent=2, ensure_ascii=False)
    print(f"Exported {len(teams_output)} teams to {teams_path}")
    
    # Write coaches.json (bonus - for future use on team pages)
    coaches_path = os.path.join(output_dir, 'coaches.json')
    with open(coaches_path, 'w', encoding='utf-8') as f:
        json.dump(all_coaches, f, indent=2, ensure_ascii=False)
    print(f"Exported {len(all_coaches)} coaches to {coaches_path}")
    
    # Write roster.json (full roster with numbers and pronouns)
    roster_path = os.path.join(output_dir, 'roster.json')
    with open(roster_path, 'w', encoding='utf-8') as f:
        json.dump(all_players, f, indent=2, ensure_ascii=False)
    print(f"Exported full roster to {roster_path}")
    
    # Write season metadata
    meta_path = os.path.join(output_dir, 'meta.json')
    with open(meta_path, 'w', encoding='utf-8') as f:
        json.dump({
            'season': '2026',
            'status': 'preseason',
            'teams': len(team_rosters),
            'players': len(all_players),
            'coaches': len(all_coaches),
        }, f, indent=2)
    print(f"Exported season metadata to {meta_path}")


if __name__ == '__main__':
    main()