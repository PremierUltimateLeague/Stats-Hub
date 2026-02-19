import csv
import json
import re
from pathlib import Path

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
    # Short names from details CSV
    'Atlanta': 'Atlanta Soul',
    'Austin': 'Austin Torch',
    'Raleigh': 'Raleigh Radiance',
    'Philadelphia': 'Philadelphia Surge',
    'Nashville': 'Nashville NightShade',
    'Indy': 'Indy Red',
    'Milwaukee': 'Milwaukee Monarchs',
    'Minnesota': 'Minnesota Strike',
    'New York': 'New York Gridlock',
}

TEAM_ABBREVS = {
    'Atlanta Soul': 'ATL',
    'Austin Torch': 'ATX',
    'DC Shadow': 'DC',
    'Indy Red': 'INDY',
    'Milwaukee Monarchs': 'MKE',
    'Minnesota Strike': 'MINN',
    'Nashville NightShade': 'NASH',
    'New York Gridlock': 'NYGL',
    'Philadelphia Surge': 'PHL',
    'Raleigh Radiance': 'RAL',
}

def parse_weekend(weekend_str):
    """Parse weekend string like '4/3 - 4/5' into start date"""
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

def load_game_details(details_path):
    """Load detailed game info (date, time, location) from CSV"""
    details = {}
    
    if not Path(details_path).exists():
        return details
    
    with open(details_path, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            week = row.get('Week', '').strip()
            away = row.get('Away Team', '').strip()
            home = row.get('Home Team', '').strip()
            
            if not week or not away or not home:
                continue
            
            # Normalize team names
            away_full = TEAM_NAMES.get(away, away)
            home_full = TEAM_NAMES.get(home, home)
            
            # Create a key for matching
            key = f"{week}-{away_full}-{home_full}"
            
            details[key] = {
                'date': row.get('Game Date', '').strip() or None,
                'time': row.get('Time (all EST)', '').strip() or None,
                'location': row.get('Location', '').strip() or None,
            }
    
    return details

def export_schedule(csv_path, json_path, details_path=None):
    """Convert schedule CSV to JSON format"""
    
    # Load details if available
    details = {}
    if details_path:
        details = load_game_details(details_path)
    
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
            
            away_full = TEAM_NAMES.get(away_abbrev, away_abbrev)
            home_full = TEAM_NAMES.get(home_abbrev, home_abbrev)
            
            # Look up details
            detail_key = f"{week_num}-{away_full}-{home_full}"
            game_details = details.get(detail_key, {})
            
            game = {
                'away': away_full,
                'awayAbbrev': away_abbrev,
                'home': home_full,
                'homeAbbrev': home_abbrev,
                'division': division,
                'gameDate': game_details.get('date'),
                'gameTime': game_details.get('time'),
                'location': game_details.get('location'),
                'awayScore': None,
                'homeScore': None,
            }
            
            games_by_week[week_num]['games'].append(game)
    
    # Convert to list sorted by week
    schedule = [games_by_week[w] for w in sorted(games_by_week.keys())]
    
    # Write JSON
    with open(json_path, 'w') as f:
        json.dump(schedule, f, indent=2)
    
    print(f"Exported {sum(len(w['games']) for w in schedule)} games across {len(schedule)} weeks")
    
    # Count games with details
    games_with_details = sum(
        1 for w in schedule for g in w['games'] 
        if g.get('gameDate') or g.get('gameTime')
    )
    print(f"Games with date/time details: {games_with_details}")
    
    return schedule

if __name__ == '__main__':
    export_schedule(
        'data/2026/schedule.csv',
        'data/2026/schedule.json',
        'data/2026/schedule_details.csv'
    )