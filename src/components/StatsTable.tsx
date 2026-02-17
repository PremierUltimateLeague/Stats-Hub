import { useState, useMemo } from 'react';
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
  linkColumn?: string;    // Column to make clickable
  linkPrefix?: string;    // URL prefix for links
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
}: StatsTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilter, setColumnFilter] = useState<string>('all');

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

  // Render cell content, with optional link
  const renderCell = (cell: any) => {
    const colId = cell.column.columnDef.accessorKey || cell.column.id;
    const value = cell.getValue();
    
    if (linkColumn && colId === linkColumn && value) {
      const href = `${linkPrefix}${encodeURIComponent(String(value))}`;
      return (
        <a href={href} className="text-pul-black hover:underline font-medium">
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </a>
      );
    }
    
    return flexRender(cell.column.columnDef.cell, cell.getContext());
  };

  return (
    <div className="space-y-4">
      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Search Input */}
        <input
          type="text"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder={searchPlaceholder}
          className="search-input w-full max-w-xs"
        />
        
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
                      data-sorted={header.column.getIsSorted() || undefined}
                      style={{ 
                        width: header.getSize(),
                        textAlign: isNumeric ? 'right' : 'left'
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
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