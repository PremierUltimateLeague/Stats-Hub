interface TeamBadgeProps {
  team: string;
  showDot?: boolean;
}

const teamColors: Record<string, string> = {
  'Atlanta Soul': '#E31837',
  'Austin Torch': '#F7941D',
  'DC Shadow': '#8B2332',
  'Indy Red': '#ED1C24',
  'LA Astra': '#6B5B95',
  'Milwaukee Monarchs': '#1E3A5F',
  'Minnesota Strike': '#582C83',
  'Nashville NightShade': '#4B0082',
  'New York Gridlock': '#FF6B35',
  'Philadelphia Surge': '#006D77',
  'Portland Rising': '#2E8B57',
  'Raleigh Radiance': '#00A651',
};

export function TeamBadge({ team, showDot = true }: TeamBadgeProps) {
  const color = teamColors[team] || '#666666';
  
  return (
    <span className="inline-flex items-center gap-2">
      {showDot && (
        <span 
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
        />
      )}
      <span>{team}</span>
    </span>
  );
}

export default TeamBadge;