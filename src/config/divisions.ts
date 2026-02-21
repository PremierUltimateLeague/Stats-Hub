/**
 * Division assignments by season.
 * Sources:
 *   - https://www.premierultimateleague.com/expansion
 *   - https://en.wikipedia.org/wiki/Premier_Ultimate_League
 *   - https://ultiworld.com/2022/04/01/premier-ultimate-league-2022-season-preview/
 *   - https://ultiworld.com/2023/02/14/pul-announces-2023-season-schedule/
 *
 * 2019: No divisions (8 teams, inaugural season)
 * 2020: Central / East (12 teams, season cancelled — COVID-19)
 * 2021: Limited Championship Series (9 of 12 teams, no formal divisions)
 *       Competed: ATX, COL, DC, IND, MED, MKE, NY, PORT, RAL
 *       Opted out: ATL, MIN, NSH
 * 2022: East / Midwest / South (all 12 teams, first full season since 2019)
 * 2023: East / Midwest / South (11 teams — Philly replaced Medellín)
 * 2024: North / South (11 teams — Columbus on hiatus)
 * 2025: North / South (11 teams — Columbus dissolved, Portland suspended, LA Astra joined)
 */

export type DivisionMap = Record<string, string>;

export const teamDivisions: Record<string, DivisionMap> = {
  '2019': {
    // No divisions in inaugural season
  },
  '2020': {
    // Season cancelled (COVID-19), but divisions were announced
    'Austin Torch': 'Central',
    'Indy Red': 'Central',
    'Medellin Revolution': 'Central',
    'Milwaukee Monarchs': 'Central',
    'Nashville NightShade': 'Central',
    'Minnesota Strike': 'Central',
    'Atlanta Soul': 'East',
    'Columbus Pride': 'East',
    'DC Shadow': 'East',
    'New York Gridlock': 'East',
    'Portland Rising': 'East',
    'Raleigh Radiance': 'East',
  },
  '2021': {
    // Limited Championship Series — no formal divisions
  },
  '2022': {
    'Columbus Pride': 'East',
    'DC Shadow': 'East',
    'Medellin Revolution': 'East',
    'New York Gridlock': 'East',
    'Portland Rising': 'East',
    'Indy Red': 'Midwest',
    'Milwaukee Monarchs': 'Midwest',
    'Minnesota Strike': 'Midwest',
    'Atlanta Soul': 'South',
    'Austin Torch': 'South',
    'Nashville NightShade': 'South',
    'Raleigh Radiance': 'South',
  },
  '2023': {
    'Columbus Pride': 'East',
    'DC Shadow': 'East',
    'New York Gridlock': 'East',
    'Philadelphia Surge': 'East',
    'Portland Rising': 'East',
    'Indy Red': 'Midwest',
    'Milwaukee Monarchs': 'Midwest',
    'Minnesota Strike': 'Midwest',
    'Atlanta Soul': 'South',
    'Austin Torch': 'South',
    'Nashville NightShade': 'South',
    'Raleigh Radiance': 'South',
  },
  '2024': {
    'DC Shadow': 'North',
    'Indy Red': 'North',
    'Milwaukee Monarchs': 'North',
    'Minnesota Strike': 'North',
    'New York Gridlock': 'North',
    'Portland Rising': 'North',
    'Atlanta Soul': 'South',
    'Austin Torch': 'South',
    'Nashville NightShade': 'South',
    'Philadelphia Surge': 'South',
    'Raleigh Radiance': 'South',
  },
  '2025': {
    'DC Shadow': 'North',
    'Indy Red': 'North',
    'Milwaukee Monarchs': 'North',
    'Minnesota Strike': 'North',
    'New York Gridlock': 'North',
    'Atlanta Soul': 'South',
    'Austin Torch': 'South',
    'LA Astra': 'South',
    'Nashville NightShade': 'South',
    'Philadelphia Surge': 'South',
    'Raleigh Radiance': 'South',
  },
};

/**
 * Get a team's division for a specific season.
 * Returns undefined if the team wasn't in that season or divisions didn't exist.
 */
export function getTeamDivision(team: string, season: string): string | undefined {
  return teamDivisions[season]?.[team];
}