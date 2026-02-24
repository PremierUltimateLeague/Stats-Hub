import { useState, useMemo } from 'react';
import { StatsTable } from './StatsTable';
import type { ColumnDef } from '@tanstack/react-table';

interface PostseasonFilterTableProps<T extends Record<string, unknown>> {
  data: T[];
  columns: ColumnDef<T, unknown>[];
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

export function PostseasonFilterTable<T extends Record<string, unknown>>({
  data,
  columns,
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
}: PostseasonFilterTableProps<T>) {
  const [includePostseason, setIncludePostseason] = useState(true);

  const hasChampionshipData = useMemo(() => {
    return data.some(g => g.week === 'Semifinals' || g.week === 'Finals');
  }, [data]);

  const filteredData = useMemo(() => {
    if (includePostseason) return data;
    return data.filter(g => g.week !== 'Semifinals' && g.week !== 'Finals');
  }, [data, includePostseason]);

  const toggle = hasChampionshipData ? (
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
  ) : undefined;

  return (
    <StatsTable
      data={filteredData}
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
      extraFilters={toggle}
    />
  );
}

export default PostseasonFilterTable;