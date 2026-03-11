import { useState, useMemo } from 'react';
import { StatsTable } from './StatsTable';
import { ToggleSwitch } from './ToggleSwitch';
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
  const [includePostseason, setIncludePostseason] = useState(false);

  const hasChampionshipData = useMemo(() => {
    return data.some(g => g.week === 'Semifinals' || g.week === 'Finals');
  }, [data]);

  const filteredData = useMemo(() => {
    if (includePostseason) return data;
    return data.filter(g => g.week !== 'Semifinals' && g.week !== 'Finals');
  }, [data, includePostseason]);

  const toggle = hasChampionshipData ? (
    <ToggleSwitch
      checked={includePostseason}
      onChange={setIncludePostseason}
      label="Postseason"
    />
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
