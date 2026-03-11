import { teamColors as teamColorMap } from '../utils/teams';

interface TeamBadgeProps {
  team: string;
  showDot?: boolean;
}


export function TeamBadge({ team, showDot = true }: TeamBadgeProps) {
  const color = teamColorMap[team]?.primary || '#666666';

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