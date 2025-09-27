'use client';

import { Table, TableBody, TableCell, TableHead, TableRow, Skeleton, Paper } from '@mui/material';

/**
 * SkeletonTable Component
 * Skeleton loading state for tables
 */
export default function SkeletonTable({
  rows = 5,
  columns = 4,
  showHeader = true,
  ...props
}) {
  return (
    <Paper {...props}>
      <Table>
        {showHeader && (
          <TableHead>
            <TableRow>
              {Array.from({ length: columns }).map((_, index) => (
                <TableCell key={index}>
                  <Skeleton variant="text" width="80%" height={24} />
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
        )}

        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <TableCell key={colIndex}>
                  <Skeleton variant="text" width="90%" height={20} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}
