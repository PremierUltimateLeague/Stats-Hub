import { useState } from 'react';
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
}

export function StatsTable<T extends Record<string, unknown>>({
  data,
  columns,
  searchPlaceholder = "Search...",
  searchableColumns = [],
}: StatsTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

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
    data,
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

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="flex items-center gap-4">
        <input
          type="text"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder={searchPlaceholder}
          className="search-input w-full max-w-sm"
        />
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
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
          No results found for "{globalFilter}"
        </div>
      )}
    </div>
  );
}

export default StatsTable;