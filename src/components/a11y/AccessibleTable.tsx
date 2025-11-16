import * as React from 'react';
import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type SortDirection = 'asc' | 'desc' | null;

interface AccessibleTableProps {
  caption: string;
  headers: string[];
  rows: any[][];
  sortable?: boolean;
  className?: string;
  onSort?: (columnIndex: number, direction: SortDirection) => void;
}

/**
 * Accessible table component with proper structure and optional sorting
 * Includes caption, scope attributes, and keyboard navigation
 */
export const AccessibleTable: React.FC<AccessibleTableProps> = ({
  caption,
  headers,
  rows,
  sortable = false,
  className,
  onSort,
}) => {
  const [sortColumn, setSortColumn] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = (columnIndex: number) => {
    if (!sortable) return;

    let newDirection: SortDirection = 'asc';

    if (sortColumn === columnIndex) {
      if (sortDirection === 'asc') {
        newDirection = 'desc';
      } else if (sortDirection === 'desc') {
        newDirection = null;
      }
    }

    setSortColumn(newDirection ? columnIndex : null);
    setSortDirection(newDirection);

    onSort?.(columnIndex, newDirection);
  };

  const getSortIcon = (columnIndex: number) => {
    if (sortColumn !== columnIndex) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }

    if (sortDirection === 'asc') {
      return <ArrowUp className="ml-2 h-4 w-4" />;
    }

    if (sortDirection === 'desc') {
      return <ArrowDown className="ml-2 h-4 w-4" />;
    }

    return <ArrowUpDown className="ml-2 h-4 w-4" />;
  };

  const getSortAriaSort = (columnIndex: number): 'ascending' | 'descending' | 'none' => {
    if (sortColumn !== columnIndex || !sortDirection) {
      return 'none';
    }
    return sortDirection === 'asc' ? 'ascending' : 'descending';
  };

  return (
    <div className={cn('relative overflow-auto', className)}>
      <Table>
        <caption className="sr-only">{caption}</caption>
        <TableHeader>
          <TableRow>
            {headers.map((header, index) => (
              <TableHead
                key={index}
                scope="col"
                aria-sort={sortable ? getSortAriaSort(index) : undefined}
              >
                {sortable ? (
                  <Button
                    variant="ghost"
                    onClick={() => handleSort(index)}
                    className="-ml-3 h-8 data-[state=open]:bg-accent"
                    aria-label={`Sort by ${header}`}
                  >
                    {header}
                    {getSortIcon(index)}
                  </Button>
                ) : (
                  header
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={headers.length} className="text-center py-8">
                No data available
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <TableCell key={cellIndex}>{cell}</TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

AccessibleTable.displayName = 'AccessibleTable';
