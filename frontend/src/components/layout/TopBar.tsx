import React from 'react';
import { AppBar, Toolbar, Typography, Box, IconButton, Tooltip, useTheme } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useColorMode } from '../../App';

interface TopBarProps { title: string; subtitle?: string; onRefresh?: () => void; }

export const TopBar: React.FC<TopBarProps> = ({ title, subtitle, onRefresh }) => {
  const theme = useTheme();
  const { toggleColorMode, mode } = useColorMode();
  const dark = theme.palette.mode === 'dark';

  return (
    <AppBar position="static" elevation={0} sx={{
      bgcolor: dark ? '#12122a' : '#ffffff',
      borderBottom: dark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.08)',
    }}>
      <Toolbar sx={{ gap: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ color: dark ? '#e2e8f0' : '#0f172a', fontWeight: 800, letterSpacing: '-0.3px', lineHeight: 1.2 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ color: dark ? '#64748b' : '#94a3b8' }}>
              {subtitle}
            </Typography>
          )}
        </Box>

        {onRefresh && (
          <Tooltip title="Refresh">
            <IconButton onClick={onRefresh} size="small" sx={{
              color: dark ? '#64748b' : '#94a3b8',
              bgcolor: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
              '&:hover': { bgcolor: 'rgba(99,102,241,0.15)', color: '#6366f1' },
            }}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}

        <Tooltip title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
          <IconButton onClick={toggleColorMode} size="small" sx={{
            color: mode === 'dark' ? '#f59e0b' : '#6366f1',
            bgcolor: mode === 'dark' ? 'rgba(245,158,11,0.1)' : 'rgba(99,102,241,0.1)',
            '&:hover': { bgcolor: mode === 'dark' ? 'rgba(245,158,11,0.2)' : 'rgba(99,102,241,0.2)' },
          }}>
            {mode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
};
