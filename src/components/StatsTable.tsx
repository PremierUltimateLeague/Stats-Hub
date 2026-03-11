import { useState, useMemo, useRef, useEffect } from 'react';
import { normalizeString } from '../utils/statsUtils';

const ALWAYS_VISIBLE_COLUMNS = new Set(['player', 'team', 'match', 'week']);
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  type Row,
  type Header,
  type Cell,
} from '@tanstack/react-table';

interface StatsTableProps<T extends Record<string, unknown>> {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  teamLogos?: Record<string, string>;
  searchPlaceholder?: string;
  searchableColumns?: string[];
  filterColumn?: string;
  filterLabel?: string;
  linkColumn?: string;
  linkPrefix?: string;
  showTeamLogos?: boolean;
  playerLinkColumn?: string;
  gameLinkColumn?: string;
  defaultHiddenColumns?: string[];
  extraFilters?: React.ReactNode;
}

export function StatsTable<T extends Record<string, unknown>>({
  data,
  columns,
  teamLogos = {},
  searchPlaceholder = "Search...",
  searchableColumns = [],
  filterColumn,
  filterLabel = "Filter",
  linkColumn,
  linkPrefix = "",
  showTeamLogos = true,
  playerLinkColumn,
  gameLinkColumn,
  defaultHiddenColumns = [],
  extraFilters,
}: StatsTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>(() => {
    const hasWeekColumn = columns.some(
      (col) => (col as ColumnDef<T, unknown> & { accessorKey?: string }).accessorKey === 'week'
    );
    return hasWeekColumn ? [{ id: 'week', desc: false }] : [];
  });
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilter, setColumnFilter] = useState<string>('all');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const columnPickerRef = useRef<HTMLDivElement>(null);

  // Initialize column visibility from defaultHiddenColumns
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    const visibility: VisibilityState = {};
    defaultHiddenColumns.forEach(col => {
      visibility[col] = false;
    });
    return visibility;
  });

  // Get unique values for the filter dropdown
  const filterOptions = useMemo(() => {
    if (!filterColumn) return [];
    const uniqueValues = new Set<string>();
    data.forEach(row => {
      const value = row[filterColumn];
      if (value != null) {
        uniqueValues.add(String(value));
      }
    });
    const values = Array.from(uniqueValues);

    if (filterColumn === 'week') {
      const postseasonOrder: Record<string, number> = { Semifinals: 998, Finals: 999 };
      return values.sort((a, b) => {
        const numA = postseasonOrder[a] ?? parseInt(a.replace(/\D/g, '') || '0');
        const numB = postseasonOrder[b] ?? parseInt(b.replace(/\D/g, '') || '0');
        return numA - numB;
      });
    }

    return values.sort();
  }, [data, filterColumn]);

  // Filter data by column filter first
  const filteredData = useMemo(() => {
    if (!filterColumn || columnFilter === 'all') return data;
    return data.filter(row => String(row[filterColumn]) === columnFilter);
  }, [data, filterColumn, columnFilter]);

  // Generate search suggestions
  const suggestions = useMemo(() => {
    if (!globalFilter || globalFilter.length < 2) return [];

    const search = normalizeString(globalFilter);
    const matches: string[] = [];

    const columnsToSearch = searchableColumns.length > 0
      ? searchableColumns
      : columns.map(c => (c as { accessorKey?: string }).accessorKey).filter(Boolean) as string[];

    filteredData.forEach(row => {
      columnsToSearch.forEach(col => {
        const value = row[col];
        if (value != null) {
          const strValue = String(value);
          if (normalizeString(strValue).includes(search) && !matches.includes(strValue)) {
            matches.push(strValue);
          }
        }
      });
    });

    matches.sort((a, b) => {
      const aNorm = normalizeString(a);
      const bNorm = normalizeString(b);

      const aWords = aNorm.replace(/^\d+\s+/, '').split(/\s+/);
      const bWords = bNorm.replace(/^\d+\s+/, '').split(/\s+/);

      const aFirstName = aWords[0]?.startsWith(search);
      const bFirstName = bWords[0]?.startsWith(search);
      if (aFirstName && !bFirstName) return -1;
      if (!aFirstName && bFirstName) return 1;

      const aAnyWord = aWords.some(w => w.startsWith(search));
      const bAnyWord = bWords.some(w => w.startsWith(search));
      if (aAnyWord && !bAnyWord) return -1;
      if (!aAnyWord && bAnyWord) return 1;

      return aNorm.localeCompare(bNorm);
    });

    return matches.slice(0, 8);
  }, [globalFilter, filteredData, searchableColumns, columns]);

  // Track which columns are numeric (for alignment)
  const numericColumns = new Set<string>();
  if (data.length > 0) {
    Object.entries(data[0]).forEach(([key, value]) => {
      if (typeof value === 'number') {
        numericColumns.add(key);
      }
    });
  }

  // Add custom sorting for columns with week-like values
  const enhancedColumns = useMemo(() => {
    return columns.map(col => {
      const accessorKey = (col as ColumnDef<T, unknown> & { accessorKey?: string }).accessorKey;
      if (accessorKey === 'week') {
        return {
          ...col,
          sortingFn: (rowA: Row<T>, rowB: Row<T>) => {
            const postseasonOrder: Record<string, number> = { Semifinals: 998, Finals: 999 };
            const weekA = (rowA.original as Record<string, unknown>).week ?? '';
            const weekB = (rowB.original as Record<string, unknown>).week ?? '';
            const a = postseasonOrder[String(weekA)] ?? parseInt(String(weekA).replace(/\D/g, '') || '0');
            const b = postseasonOrder[String(weekB)] ?? parseInt(String(weekB).replace(/\D/g, '') || '0');
            return a - b;
          },
        };
      }
      return col;
    });
  }, [columns]);

  const table = useReactTable({
    data: filteredData,
    columns: enhancedColumns,
    state: {
      sorting,
      globalFilter,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, _columnId, filterValue) => {
      const columnsToSearch = searchableColumns.length > 0
        ? searchableColumns
        : columns.map(c => (c as { accessorKey?: string }).accessorKey).filter(Boolean);

      const search = normalizeString(String(filterValue));

      return columnsToSearch.some(col => {
        const value = row.getValue(col as string);
        if (value == null) return false;
        return normalizeString(String(value)).includes(search);
      });
    },
  });

  const getColumnId = (header: Header<T, unknown>): string => {
    return (header.column.columnDef as ColumnDef<T, unknown> & { accessorKey?: string }).accessorKey || header.id;
  };

  // Get toggleable columns for the column picker
  const toggleableColumns = useMemo(() => {
    return table.getAllColumns().filter(col => {
      const id = col.id;
      return !ALWAYS_VISIBLE_COLUMNS.has(id) && col.getCanHide();
    });
  }, [table, columns]);

  // Count hidden columns
  const hiddenCount = toggleableColumns.filter(col => !col.getIsVisible()).length;

  // Render cell content, with optional link and team color
  const renderCell = (cell: Cell<T, unknown>) => {
    const colId = (cell.column.columnDef as ColumnDef<T, unknown> & { accessorKey?: string }).accessorKey || cell.column.id;
    const value = cell.getValue();

    const isTeamColumn = colId === 'team' && showTeamLogos;
    const teamLogo = isTeamColumn && value ? teamLogos[String(value)] : null;

    const content = (
      <span className={isTeamColumn ? "inline-flex items-center gap-2" : ""}>
        {teamLogo && (
          <img
            src={`/Stats-Hub/images/teams/${teamLogo}`}
            alt=""
            className="w-6 h-6 object-contain flex-shrink-0"
          />
        )}
        {flexRender(cell.column.columnDef.cell, cell.getContext())}
      </span>
    );

    const isPlayerLink = playerLinkColumn && colId === playerLinkColumn && value;

    if (isPlayerLink) {
      const href = `/Stats-Hub/players/${encodeURIComponent(String(value))}`;
      return (
        <a href={href} className="text-pul-black hover:underline">
          {content}
        </a>
      );
    }

    const isGameLink = gameLinkColumn && colId === gameLinkColumn && value;

    if (isGameLink) {
      const href = `/Stats-Hub/games/${String(value)}`;
      return (
        <a href={href} className="text-pul-black hover:underline">
          {content}
        </a>
      );
    }

    if (linkColumn && colId === linkColumn && value) {
      const href = `${linkPrefix}${encodeURIComponent(String(value))}`;
      return (
        <a href={href} className="text-pul-black hover:underline font-medium">
          {content}
        </a>
      );
    }

    return content;
  };

  // Handle click outside to close suggestions and column picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
      if (columnPickerRef.current && !columnPickerRef.current.contains(event.target as Node)) {
        setShowColumnPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
      e.preventDefault();
      setGlobalFilter(suggestions[selectedSuggestionIndex]);
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  };

  const selectSuggestion = (suggestion: string) => {
    setGlobalFilter(suggestion);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
  };

  return (
    <div className="space-y-4">
      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Search Input with Suggestions */}
        <div className="relative" ref={searchRef}>
          <input
            type="text"
            value={globalFilter}
            onChange={(e) => {
              setGlobalFilter(e.target.value);
              setShowSuggestions(true);
              setSelectedSuggestionIndex(-1);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="search-input w-full max-w-xs"
          />

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-10 w-full mt-1 bg-pul-white border border-pul-border rounded shadow-lg max-h-60 overflow-auto">
              {suggestions.map((suggestion, index) => (
                <li
                  key={suggestion}
                  onClick={() => selectSuggestion(suggestion)}
                  className={`px-4 py-2 cursor-pointer text-sm ${index === selectedSuggestionIndex
                    ? 'bg-pul-light text-pul-black'
                    : 'hover:bg-pul-light'
                    }`}
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Dropdown Filter */}
        {filterColumn && filterOptions.length > 0 && (
          <select
            value={columnFilter}
            onChange={(e) => setColumnFilter(e.target.value)}
            className="search-input"
          >
            <option value="all">All {filterLabel}</option>
            {filterOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        )}

        {/* Column Visibility Picker */}
        {toggleableColumns.length > 0 && (
          <div className="relative" ref={columnPickerRef}>
            <button
              onClick={() => setShowColumnPicker(!showColumnPicker)}
              className="search-input inline-flex items-center gap-1.5 cursor-pointer"
              type="button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
              </svg>
              Columns
              {hiddenCount > 0 && (
                <span className="text-xs bg-pul-black text-white rounded-full px-1.5 py-0.5 leading-none">
                  {hiddenCount}
                </span>
              )}
            </button>

            {showColumnPicker && (
              <div className="absolute z-20 mt-1 bg-pul-white border border-pul-border rounded shadow-lg py-2 min-w-[200px] max-h-80 overflow-auto right-0">
                {/* Show/Hide All */}
                <div className="px-3 pb-2 mb-2 border-b border-pul-border flex gap-2">
                  <button
                    onClick={() => {
                      const newVisibility: VisibilityState = {};
                      toggleableColumns.forEach(col => {
                        newVisibility[col.id] = true;
                      });
                      setColumnVisibility(newVisibility);
                    }}
                    className="text-xs text-pul-black hover:underline"
                    type="button"
                  >
                    Show all
                  </button>
                  <span className="text-pul-gray">·</span>
                  <button
                    onClick={() => {
                      const newVisibility: VisibilityState = {};
                      defaultHiddenColumns.forEach(col => {
                        newVisibility[col] = false;
                      });
                      // Make sure non-default columns are visible
                      toggleableColumns.forEach(col => {
                        if (!defaultHiddenColumns.includes(col.id)) {
                          newVisibility[col.id] = true;
                        }
                      });
                      setColumnVisibility(newVisibility);
                    }}
                    className="text-xs text-pul-black hover:underline"
                    type="button"
                  >
                    Reset
                  </button>
                </div>

                {toggleableColumns.map(column => (
                  <label
                    key={column.id}
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-pul-light cursor-pointer text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={column.getIsVisible()}
                      onChange={column.getToggleVisibilityHandler()}
                      className="rounded border-pul-border"
                    />
                    {typeof column.columnDef.header === 'string'
                      ? column.columnDef.header
                      : column.id}
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Extra Filters (e.g. postseason toggle) */}
        <div className="ml-auto flex items-center gap-4">
          {extraFilters}
          <span className="text-sm text-pul-gray">
            {table.getFilteredRowModel().rows.length} results
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-pul-border rounded">
        <table className="stats-table table-fixed w-full" aria-label="Stats table">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const colId = getColumnId(header);
                  const isNumeric = numericColumns.has(colId);
                  return (
                    <th
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      aria-label={`Sort by ${typeof header.column.columnDef.header === 'string' ? header.column.columnDef.header : header.id}`}
                      style={{
                        width: header.getSize(),
                        textAlign: isNumeric ? 'right' : 'left',
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                    >
                      <span className="inline-flex items-center gap-1">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        {header.column.getIsSorted() === 'asc' && (
                          <span className="text-pul-black">↑</span>
                        )}
                        {header.column.getIsSorted() === 'desc' && (
                          <span className="text-pul-black">↓</span>
                        )}
                        {!header.column.getIsSorted() && (
                          <span className="text-pul-gray/50">↕</span>
                        )}
                      </span>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => {
                  const value = cell.getValue();
                  const colId = (cell.column.columnDef as any).accessorKey || cell.column.id;
                  const isNumericColumn = numericColumns.has(colId);
                  const isNumeric = isNumericColumn || typeof value === 'number';
                  return (
                    <td
                      key={cell.id}
                      className={isNumeric ? 'text-right tabular-nums' : ''}
                    >
                      {isNumericColumn && value == null ? 0 : renderCell(cell)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {table.getFilteredRowModel().rows.length === 0 && (
        <div className="text-center py-8 text-pul-gray">
          No results found
        </div>
      )}
    </div>
  );
}

export default StatsTable;