import { useState, useMemo, useRef, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';

interface StatsTableProps<T extends Record<string, unknown>> {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  searchPlaceholder?: string;
  searchableColumns?: string[];
  filterColumn?: string;
  filterLabel?: string;
  linkColumn?: string;
  linkPrefix?: string;
  showTeamLogos?: boolean;
  playerLinkColumn?: string;
  gameLinkColumn?: string;
}

export function StatsTable<T extends Record<string, unknown>>({
  data,
  columns,
  searchPlaceholder = "Search...",
  searchableColumns = [],
  filterColumn,
  filterLabel = "Filter",
  linkColumn,
  linkPrefix = "",
  showTeamLogos = true,
  playerLinkColumn,
  gameLinkColumn,
}: StatsTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>(() => {
    const hasWeekColumn = columns.some(
      (col) => (col as any).accessorKey === 'week'
    );
    return hasWeekColumn ? [{ id: 'week', desc: false }] : [];
  });
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilter, setColumnFilter] = useState<string>('all');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);

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

    // Sort numerically for week-like values
    if (filterColumn === 'week') {
      return values.sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, '') || '0');
        const numB = parseInt(b.replace(/\D/g, '') || '0');
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

    const normalizeString = (str: string) =>
      str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

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

    // Sort: prioritize matches where search is prefix of first meaningful word
    matches.sort((a, b) => {
      const aNorm = normalizeString(a);
      const bNorm = normalizeString(b);

      // For player names like "00 Chelsea Smith", extract name parts
      const aWords = aNorm.replace(/^\d+\s+/, '').split(/\s+/);
      const bWords = bNorm.replace(/^\d+\s+/, '').split(/\s+/);

      // Check if search is prefix of first name (highest priority)
      const aFirstName = aWords[0]?.startsWith(search);
      const bFirstName = bWords[0]?.startsWith(search);
      if (aFirstName && !bFirstName) return -1;
      if (!aFirstName && bFirstName) return 1;

      // Then prefix of any word
      const aAnyWord = aWords.some(w => w.startsWith(search));
      const bAnyWord = bWords.some(w => w.startsWith(search));
      if (aAnyWord && !bAnyWord) return -1;
      if (!aAnyWord && bAnyWord) return 1;

      // Then alphabetical
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
      const accessorKey = (col as any).accessorKey;
      if (accessorKey === 'week') {
        return {
          ...col,
          sortingFn: (rowA: any, rowB: any) => {
            const a = parseInt(rowA.original.week?.replace(/\D/g, '') || '0');
            const b = parseInt(rowB.original.week?.replace(/\D/g, '') || '0');
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
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, _columnId, filterValue) => {
      const normalizeString = (str: string) =>
        str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

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

  const getColumnId = (header: any): string => {
    return header.column.columnDef.accessorKey || header.id;
  };

  // Team logos for badges
  const teamLogos: Record<string, string> = {
    'Atlanta Soul': 'atlanta.png',
    'Austin Torch': 'austin.png',
    'Columbus Pride': 'columbus.png',
    'DC Shadow': 'dc.png',
    'Indy Red': 'indy.png',
    'LA Astra': 'la.png',
    'Medellin Revolution': 'medellin.png',
    'Milwaukee Monarchs': 'milwaukee.png',
    'Minnesota Strike': 'minnesota.png',
    'Nashville NightShade': 'nashville.png',
    'New York Gridlock': 'new-york.png',
    'Philadelphia Surge': 'philadelphia.png',
    'Portland Rising': 'portland.png',
    'Raleigh Radiance': 'raleigh.png',
  };

  // Render cell content, with optional link and team color
  const renderCell = (cell: any) => {
    const colId = cell.column.columnDef.accessorKey || cell.column.id;
    const value = cell.getValue();

    // Check if this is a team column that should show logo
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

    // Check if this is a player column that should link
    const isPlayerLink = playerLinkColumn && colId === playerLinkColumn && value;

    // Player link
    if (isPlayerLink) {
      const href = `/Stats-Hub/players/${encodeURIComponent(String(value))}`;
      return (
        <a href={href} className="text-pul-black hover:underline">
          {content}
        </a>
      );
    }

    // Check if this is a game column that should link
    const isGameLink = gameLinkColumn && colId === gameLinkColumn && value;

    // Game link
    if (isGameLink) {
      const href = `/Stats-Hub/games/${String(value)}`;
      return (
        <a href={href} className="text-pul-black hover:underline">
          {content}
        </a>
      );
    }

    // Team/other link
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

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
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

        <span className="text-sm text-pul-gray">
          {table.getFilteredRowModel().rows.length} results
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-pul-border rounded">
        <table className="stats-table table-fixed w-full">
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
                  const isNumeric = typeof cell.getValue() === 'number';
                  return (
                    <td
                      key={cell.id}
                      className={isNumeric ? 'text-right tabular-nums' : ''}
                    >
                      {renderCell(cell)}
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