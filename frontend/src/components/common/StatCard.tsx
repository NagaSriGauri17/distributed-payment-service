import React from 'react';
import { Card, CardContent, Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
  trend?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, subtitle, trend }) => {
  const theme = useTheme();
  const dark = theme.palette.mode === 'dark';

  return (
    <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
      <Box sx={{
        position: 'absolute', top: -20, right: -20,
        width: 100, height: 100, borderRadius: '50%',
        background: `${color}18`,
        pointerEvents: 'none',
      }} />
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{
            p: 1.25, borderRadius: 2,
            background: `${color}18`,
            color: color,
            display: 'flex', alignItems: 'center',
          }}>
            {icon}
          </Box>
          {trend && (
            <Typography variant="caption" sx={{
              color: trend.startsWith('+') ? '#10b981' : '#ef4444',
              fontWeight: 700, bgcolor: trend.startsWith('+') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              px: 1, py: 0.25, borderRadius: 1,
            }}>
              {trend}
            </Typography>
          )}
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 800, color: dark ? '#e2e8f0' : '#0f172a', mb: 0.25 }}>
          {value}
        </Typography>
        <Typography variant="body2" sx={{ color: dark ? '#64748b' : '#94a3b8', fontWeight: 500, fontSize: '0.8rem' }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" sx={{ color: dark ? '#475569' : '#cbd5e1' }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};
