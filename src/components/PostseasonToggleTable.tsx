import { useState, useMemo } from 'react';
import { StatsTable } from './StatsTable';
import type { ColumnDef } from '@tanstack/react-table';

type AggregationMode = 'player' | 'team';

interface PostseasonToggleTableProps<T extends Record<string, unknown>> {
  regularSeasonData: T[];
  gamesData: T[];
  columns: ColumnDef<T, unknown>[];
  aggregationMode: AggregationMode;
  defaultHiddenColumns?: string[];
  searchPlaceholder?: string;
  searchableColumns?: string[];
  filterColumn?: string;
  filterLabel?: string;
  linkColumn?: string;
  linkPrefix?: string;
  showTeamLogos?: boolean;
  teamLogos?: Record<string, string>;
  playerLinkColumn?: string;
  gameLinkColumn?: string;
}

const PLAYER_SUM_COLS = [
  'goals', 'assists', 'secondaryAssists', 'blocks', 'turnovers',
  'touches', 'throws', 'catches', 'offensePoints', 'defensePoints',
  'possessionsInitiated', 'throwerErrors', 'receiverErrors',
  'totalThrowYards', 'totalCatchYards',
];

const TEAM_SUM_COLS = [
  'goals', 'breakGoals', 'blocks', 'holds', 'cleanHolds',
  'passAttempts', 'turnovers', 'completedPasses', 'hucks',
];

function aggregateWithPostseason<T extends Record<string, unknown>>(
  regularData: T[],
  gamesData: T[],
  mode: AggregationMode,
): T[] {
  const champGames = gamesData.filter(
    g => g.week === 'Semifinals' || g.week === 'Finals'
  );

  if (champGames.length === 0) return regularData;

  const sumCols = mode === 'player' ? PLAYER_SUM_COLS : TEAM_SUM_COLS;
  const keyField = mode === 'player' ? 'player' : 'team';

  // Clone regular season data into a lookup
  const combined = new Map<string, Record<string, unknown>>();
  for (const row of regularData) {
    const key = `${row[keyField]}||${row.team || ''}`;
    combined.set(key, { ...row });
  }

  // Add championship stats
  for (const game of champGames) {
    const key = `${game[keyField]}||${game.team || ''}`;
    let record = combined.get(key);

    if (!record) {
      // Player/team only in championship — seed with zeros
      record = { ...game };
      for (const col of sumCols) {
        record[col] = 0;
      }
      // Copy non-stat fields from the game
      record[keyField] = game[keyField];
      record.team = game.team;
      if (game.teamAbbrev) record.teamAbbrev = game.teamAbbrev;
      if (game.abbrev) record.abbrev = game.abbrev;
      combined.set(key, record);
    }

    for (const col of sumCols) {
      if (col in game) {
        record[col] = ((record[col] as number) || 0) + ((game[col] as number) || 0);
      }
    }
  }

  // Recalculate derived fields
  for (const record of combined.values()) {
    if (mode === 'player') {
      record['+/-'] = (
        ((record.goals as number) || 0) +
        ((record.assists as number) || 0) +
        ((record.blocks as number) || 0) -
        ((record.turnovers as number) || 0) -
        ((record.throwerErrors as number) || 0) -
        ((record.receiverErrors as number) || 0)
      );
    } else {
      const attempts = (record.passAttempts as number) || 0;
      const completed = (record.completedPasses as number) || 0;
      record.completionRate = attempts > 0
        ? Math.round(completed / attempts * 1000) / 10
        : 0;
    }
  }

  return Array.from(combined.values()) as T[];
}

export function PostseasonToggleTable<T extends Record<string, unknown>>({
  regularSeasonData,
  gamesData,
  columns,
  aggregationMode,
  defaultHiddenColumns = [],
  searchPlaceholder,
  searchableColumns,
  filterColumn,
  filterLabel,
  linkColumn,
  linkPrefix,
  showTeamLogos,
  teamLogos,
  playerLinkColumn,
  gameLinkColumn,
}: PostseasonToggleTableProps<T>) {
  const [includePostseason, setIncludePostseason] = useState(false);

  const hasChampionshipData = useMemo(() => {
    return gamesData.some(g => g.week === 'Semifinals' || g.week === 'Finals');
  }, [gamesData]);

  const combinedData = useMemo(() => {
    if (!includePostseason) return regularSeasonData;
    return aggregateWithPostseason(regularSeasonData, gamesData, aggregationMode);
  }, [includePostseason, regularSeasonData, gamesData, aggregationMode]);

  return (
    <div>
      <StatsTable
        data={combinedData}
        columns={columns}
        defaultHiddenColumns={defaultHiddenColumns}
        searchPlaceholder={searchPlaceholder}
        searchableColumns={searchableColumns}
        filterColumn={filterColumn}
        filterLabel={filterLabel}
        linkColumn={linkColumn}
        linkPrefix={linkPrefix}
        showTeamLogos={showTeamLogos}
        teamLogos={teamLogos}
        playerLinkColumn={playerLinkColumn}
        gameLinkColumn={gameLinkColumn}
        extraFilters={hasChampionshipData ? (
          <label className="inline-flex items-center gap-2 cursor-pointer text-sm select-none">
            <button
              type="button"
              role="switch"
              aria-checked={includePostseason}
              onClick={() => setIncludePostseason(!includePostseason)}
              className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ease-in-out ${
                includePostseason ? 'bg-pul-black' : 'bg-pul-border'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition duration-200 ease-in-out mt-0.5 ${
                  includePostseason ? 'translate-x-[18px]' : 'translate-x-0.5'
                }`}
              />
            </button>
            <span className={includePostseason ? 'text-pul-black font-medium' : 'text-pul-gray'}>
              Postseason
            </span>
          </label>
        ) : undefined}
      />
    </div>
  );
}

export default PostseasonToggleTable;