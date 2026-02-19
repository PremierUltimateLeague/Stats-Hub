import csv
import json
import re
from pathlib import Path
from datetime import datetime

# Team abbreviation to full name mapping
TEAM_NAMES = {
    'ATL': 'Atlanta Soul',
    'ATX': 'Austin Torch',
    'DC': 'DC Shadow',
    'INDY': 'Indy Red',
    'MKE': 'Milwaukee Monarchs',
    'MINN': 'Minnesota Strike',
    'NASH': 'Nashville NightShade',
    'NYGL': 'New York Gridlock',
    'PHL': 'Philadelphia Surge',
    'RAL': 'Raleigh Radiance',
}

def parse_weekend(weekend_str):
    """Parse weekend string like '4/3 - 4/5' into start date"""
    # Extract the first date
    match = re.match(r'(\d+)/(\d+)', weekend_str.replace(' ', ''))
    if match:
        month, day = int(match.group(1)), int(match.group(2))
        return f"2026-{month:02d}-{day:02d}"
    return None

def get_week_number(weekend_str):
    """Convert weekend date to week number"""
    weekends = [
        '4/3', '4/10', '4/17', '4/24', '5/1', '5/8', '5/15', '5/22', '5/29', '6/5'
    ]
    for i, w in enumerate(weekends, 1):
        if weekend_str.startswith(w):
            return i
    return None

def export_schedule(csv_path, json_path):
    """Convert schedule CSV to JSON format"""
    
    games_by_week = {}
    
    with open(csv_path, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            weekend = row.get('Weekend', '').strip()
            away_abbrev = row.get('Away Team', '').strip()
            home_abbrev = row.get('Home Team', '').strip()
            division = row.get('Division', '').strip()
            
            if not weekend or not away_abbrev or not home_abbrev:
                continue
            
            week_num = get_week_number(weekend)
            if not week_num:
                continue
            
            if week_num not in games_by_week:
                games_by_week[week_num] = {
                    'week': week_num,
                    'weekend': weekend,
                    'date': parse_weekend(weekend),
                    'season': '2026',
                    'games': []
                }
            
            game = {
                'away': TEAM_NAMES.get(away_abbrev, away_abbrev),
                'awayAbbrev': away_abbrev,
                'home': TEAM_NAMES.get(home_abbrev, home_abbrev),
                'homeAbbrev': home_abbrev,
                'division': division,
                'awayScore': None,  # To be filled in when game is played
                'homeScore': None,
            }
            
            games_by_week[week_num]['games'].append(game)
    
    # Convert to list sorted by week
    schedule = [games_by_week[w] for w in sorted(games_by_week.keys())]
    
    # Write JSON
    with open(json_path, 'w') as f:
        json.dump(schedule, f, indent=2)
    
    print(f"Exported {sum(len(w['games']) for w in schedule)} games across {len(schedule)} weeks")
    return schedule

if __name__ == '__main__':
    export_schedule('data/2026/schedule.csv', 'data/2026/schedule.json')