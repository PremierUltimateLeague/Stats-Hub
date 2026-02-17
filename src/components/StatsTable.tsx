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
  showTeamColors?: boolean;
  playerLinkColumn?: string;
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
  showTeamColors = false,
  playerLinkColumn,
}: StatsTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
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
    return Array.from(uniqueValues).sort();
  }, [data, filterColumn]);

  // Filter data by column filter first
  const filteredData = useMemo(() => {
    if (!filterColumn || columnFilter === 'all') return data;
    return data.filter(row => String(row[filterColumn]) === columnFilter);
  }, [data, filterColumn, columnFilter]);

  // Generate search suggestions
  const suggestions = useMemo(() => {
    if (!globalFilter || globalFilter.length < 2) return [];

    const search = globalFilter.toLowerCase();
    const matches: string[] = [];

    const columnsToSearch = searchableColumns.length > 0
      ? searchableColumns
      : columns.map(c => (c as { accessorKey?: string }).accessorKey).filter(Boolean) as string[];

    filteredData.forEach(row => {
      columnsToSearch.forEach(col => {
        const value = row[col];
        if (value != null) {
          const strValue = String(value);
          if (strValue.toLowerCase().includes(search) && !matches.includes(strValue)) {
            matches.push(strValue);
          }
        }
      });
    });

    return matches.slice(0, 8); // Limit to 8 suggestions
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

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, columnId, filterValue) => {
      const columnsToSearch = searchableColumns.length > 0
        ? searchableColumns
        : columns.map(c => (c as { accessorKey?: string }).accessorKey).filter(Boolean);

      const search = String(filterValue).toLowerCase();

      return columnsToSearch.some(col => {
        const value = row.getValue(col as string);
        if (value == null) return false;
        return String(value).toLowerCase().includes(search);
      });
    },
  });

  const getColumnId = (header: any): string => {
    return header.column.columnDef.accessorKey || header.id;
  };

  // Team colors for badges
  const teamColors: Record<string, string> = {
    'Atlanta Soul': '#E31837',
    'Austin Torch': '#FF6B00',
    'DC Shadow': '#000000',
    'Indy Red': '#ED1C24',
    'LA Astra': '#6B5B95',
    'Milwaukee Monarchs': '#1E3A5F',
    'Minnesota Strike': '#00A3E0',
    'Nashville NightShade': '#4B0082',
    'New York Gridlock': '#FF1493',
    'Philadelphia Surge': '#0077B6',
    'Portland Rising': '#2E8B57',
    'Raleigh Radiance': '#00A651',
  };

  // Render cell content, with optional link and team color
  const renderCell = (cell: any) => {
    const colId = cell.column.columnDef.accessorKey || cell.column.id;
    const value = cell.getValue();
    
    // Check if this is a team column that should show color
    const isTeamColumn = colId === 'team' && showTeamColors;
    const teamColor = isTeamColumn && value ? teamColors[String(value)] : null;
    
    // Check if this is a player column that should link
    const isPlayerLink = playerLinkColumn && colId === playerLinkColumn && value;
    
    const content = (
      <span className={isTeamColumn && teamColor ? "inline-flex items-center gap-2" : ""}>
        {teamColor && (
          <span 
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: teamColor }}
          />
        )}
        {flexRender(cell.column.columnDef.cell, cell.getContext())}
      </span>
    );
    
    // Player link
    if (isPlayerLink) {
      const href = `/Stats-Hub/players/${encodeURIComponent(String(value))}`;
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