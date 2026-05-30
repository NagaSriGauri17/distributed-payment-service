import React from 'react';
import { Box } from '@mui/material';

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  COMPLETED: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: 'Completed' },
  FAILED:    { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  label: 'Failed' },
  PENDING:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Pending' },
  PROCESSING:{ color: '#6366f1', bg: 'rgba(99,102,241,0.12)', label: 'Processing' },
  REVERSED:  { color: '#06b6d4', bg: 'rgba(6,182,212,0.12)',  label: 'Reversed' },
};

export const StatusChip: React.FC<{ status: string }> = ({ status }) => {
  const cfg = STATUS_CONFIG[status] ?? { color: '#64748b', bg: 'rgba(100,116,139,0.12)', label: status };
  return (
    <Box sx={{
      display: 'inline-flex', alignItems: 'center', gap: 0.75,
      px: 1.25, py: 0.35, borderRadius: 1.5,
      bgcolor: cfg.bg, color: cfg.color,
      fontSize: '0.72rem', fontWeight: 700,
    }}>
      <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: cfg.color, flexShrink: 0 }} />
      {cfg.label}
    </Box>
  );
};
