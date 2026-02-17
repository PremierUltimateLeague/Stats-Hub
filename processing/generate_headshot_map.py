import json
import re
from pathlib import Path

def generate_headshot_filename(player_name: str) -> str:
    """
    Convert player name like "00 Genny De Jesus" to headshot filename like "DeJesus00.jpg"
    """
    # Parse number and name
    match = re.match(r'^(\d+)\s+(.+)$', player_name)
    if not match:
        return None
    
    number = match.group(1)
    full_name = match.group(2)
    
    # Get last name (last word, or last two words if hyphenated or compound)
    name_parts = full_name.split()
    if len(name_parts) >= 2:
        last_name = name_parts[-1]
        # Handle compound last names like "De Jesus" -> "DeJesus"
        if len(name_parts) >= 3 and name_parts[-2].lower() in ['de', 'van', 'von', 'la', 'le', 'mc', 'mac', 'o']:
            last_name = name_parts[-2] + name_parts[-1]
    else:
        last_name = name_parts[0]
    
    # Remove spaces and special characters, keep capitalization
    last_name = re.sub(r'[^a-zA-Z]', '', last_name)
    
    return f"{last_name}{number}.jpg"

def main():
    # Load all players
    players = set()
    
    for season in ['2025', '2024']:
        try:
            with open(f'data/{season}/players_season.json', 'r') as f:
                data = json.load(f)
                for player in data:
                    if player.get('player') and isinstance(player['player'], str):
                        players.add((player['player'], player.get('team', '')))
        except FileNotFoundError:
            pass
    
    # Generate mapping
    mapping = {}
    for player_name, team in sorted(players):
        filename = generate_headshot_filename(player_name)
        if filename:
            mapping[player_name] = {
                'filename': filename,
                'team': team
            }
            print(f"{player_name} -> {filename}")
    
    # Save mapping
    with open('data/headshot_map.json', 'w') as f:
        json.dump(mapping, f, indent=2)
    
    print(f"\nGenerated mapping for {len(mapping)} players")
    print("Saved to data/headshot_map.json")

if __name__ == '__main__':
    main()