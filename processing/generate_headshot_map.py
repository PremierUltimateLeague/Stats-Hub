import json
import re
from pathlib import Path

# Team name to folder mapping
TEAM_FOLDERS = {
    'Atlanta Soul': 'Atlanta',
    'Austin Torch': 'Austin',
    'Columbus Pride': 'Columbus',
    'DC Shadow': 'DC',
    'Indy Red': 'Indy',
    'LA Astra': 'LA',
    'Milwaukee Monarchs': 'Milwaukee',
    'Minnesota Strike': 'Minnesota',
    'Nashville NightShade': 'Nashville',
    'New York Gridlock': 'New York City',
    'Philadelphia Surge': 'Philadelphia',
    'Portland Rising': 'Portland',
    'Raleigh Radiance': 'Raleigh',
}

HEADSHOT_EXTENSIONS = ['.jpg', '.jpeg', '.png']

def generate_headshot_filename(player_name: str) -> str:
    """
    Convert player name like "00 Genny De Jesus" to base filename like "DeJesus00"
    (no extension — we check for multiple extensions when searching)
    """
    match = re.match(r'^(\d+)\s+(.+)$', player_name)
    if not match:
        return None
    
    number = match.group(1)
    full_name = match.group(2)
    
    name_parts = full_name.split()
    if len(name_parts) >= 2:
        last_name = name_parts[-1]
        if len(name_parts) >= 3 and name_parts[-2].lower() in ['de', 'van', 'von', 'la', 'le', 'mc', 'mac', 'o']:
            last_name = name_parts[-2] + name_parts[-1]
    else:
        last_name = name_parts[0]
    
    last_name = re.sub(r'[^a-zA-Z-]', '', last_name)
    
    return f"{last_name}{number}"


def find_headshot(team: str, base_filename: str) -> str | None:
    """
    Search for headshot in year subfolders, preferring the latest year.
    Returns relative path like "Atlanta/2026/Smith10.jpg" or None.
    """
    team_folder = TEAM_FOLDERS.get(team)
    if not team_folder:
        return None
    
    team_path = Path('public/images/players') / team_folder
    if not team_path.exists():
        return None
    
    # Generate filename variations (with/without leading zeros)
    name_part = ''.join(c for c in base_filename if not c.isdigit())
    num_part = ''.join(c for c in base_filename if c.isdigit())
    
    # Try: original, without leading zeros, with leading zero
    num_variations = list(dict.fromkeys([
        num_part,                          # e.g. "04"
        num_part.lstrip('0') or '0',       # e.g. "4"
        num_part.zfill(2),                 # e.g. "04"
    ]))
    
    # Get year subfolders sorted descending (latest first)
    year_dirs = sorted(
        [d for d in team_path.iterdir() if d.is_dir() and re.match(r'^\d{4}$', d.name)],
        key=lambda d: d.name,
        reverse=True
    )
    
    # Build a case-insensitive lookup for each directory
    def find_in_dir(directory: Path) -> str | None:
        if not directory.exists():
            return None
        # Map lowercase filenames to actual filenames
        actual_files = {f.name.lower(): f.name for f in directory.iterdir() if f.is_file()}
        
        for num in num_variations:
            for ext in HEADSHOT_EXTENSIONS:
                candidate = f"{name_part}{num}{ext}".lower()
                if candidate in actual_files:
                    return actual_files[candidate]
        return None
    
    # Search each year
    for year_dir in year_dirs:
        match = find_in_dir(year_dir)
        if match:
            return f"{team_folder}/{year_dir.name}/{match}"
    
    # Check team root
    match = find_in_dir(team_path)
    if match:
        return f"{team_folder}/{match}"
    
    return None

def main():
    # Collect players with their teams per season (latest season first)
    player_teams: dict[str, str] = {}  # player_name -> most recent team
    
    for season in ['2026', '2025', '2024', '2023']:
        try:
            with open(f'data/{season}/players_season.json', 'r') as f:
                data = json.load(f)
                for player in data:
                    name = player.get('player', '')
                    team = player.get('team', '')
                    if name and isinstance(name, str) and name not in player_teams:
                        player_teams[name] = team
        except FileNotFoundError:
            pass
    
    # Generate mapping
    mapping = {}
    found_count = 0
    missing_count = 0
    
    for player_name in sorted(player_teams.keys()):
        team = player_teams[player_name]
        base_filename = generate_headshot_filename(player_name)
        if not base_filename:
            continue
        
        headshot_path = find_headshot(team, base_filename)
        
        mapping[player_name] = {
            'filename': base_filename,
            'team': team,
            'headshot': headshot_path,
        }
        
        if headshot_path:
            found_count += 1
        else:
            missing_count += 1
    
    # Save mapping
    with open('data/headshot_map.json', 'w') as f:
        json.dump(mapping, f, indent=2)
    
    print(f"Generated mapping for {len(mapping)} players")
    print(f"  ✅ Found headshots: {found_count}")
    print(f"  ❌ Missing headshots: {missing_count}")
    print("Saved to data/headshot_map.json")


if __name__ == '__main__':
    main()