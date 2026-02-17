interface TeamBadgeProps {
  team: string;
  showLogo?: boolean;
}

// Team color mapping
const teamColors: Record<string, { bg: string; text: string }> = {
  'Atlanta Soul': { bg: 'bg-teams-atlanta', text: 'text-white' },
  'Austin Torch': { bg: 'bg-teams-austin', text: 'text-white' },
  'DC Shadow': { bg: 'bg-teams-dc', text: 'text-white' },
  'Indy Red': { bg: 'bg-teams-indy', text: 'text-black' },
  'Madison Radicals': { bg: 'bg-teams-madison', text: 'text-white' },
  'Minnesota Strike': { bg: 'bg-teams-minnesota', text: 'text-white' },
  'Nashville NightShade': { bg: 'bg-teams-nashville', text: 'text-white' },
  'New York Gridlock': { bg: 'bg-teams-new-york', text: 'text-white' },
  'Philadelphia Surge': { bg: 'bg-teams-philadelphia', text: 'text-white' },
  'Raleigh Radiance': { bg: 'bg-teams-raleigh', text: 'text-white' },
};

// Fallback for unknown teams
const defaultColors = { bg: 'bg-pul-gray', text: 'text-white' };

export function TeamBadge({ team, showLogo = false }: TeamBadgeProps) {
  const colors = teamColors[team] || defaultColors;

  return (
    <span className={`team-badge ${colors.bg} ${colors.text}`}>
      {team}
    </span>
  );
}

export default TeamBadge;
