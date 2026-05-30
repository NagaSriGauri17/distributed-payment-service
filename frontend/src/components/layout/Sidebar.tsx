import React from 'react';
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Box, Typography, Divider, Avatar, Chip } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PaymentIcon from '@mui/icons-material/Payment';
import HistoryIcon from '@mui/icons-material/History';
import NotificationsIcon from '@mui/icons-material/Notifications';
import BarChartIcon from '@mui/icons-material/BarChart';
import BoltIcon from '@mui/icons-material/Bolt';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../App';
import { useTheme } from '@mui/material/styles';

const DRAWER_WIDTH = 248;

const navItems = [
  { label: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { label: 'Payments', icon: <PaymentIcon />, path: '/payments' },
  { label: 'Audit Logs', icon: <HistoryIcon />, path: '/audit' },
  { label: 'Notifications', icon: <NotificationsIcon />, path: '/notifications' },
  { label: 'Metrics', icon: <BarChartIcon />, path: '/metrics' },
];

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const theme = useTheme();
  const dark = theme.palette.mode === 'dark';

  return (
    <Drawer variant="permanent" sx={{
      width: DRAWER_WIDTH, flexShrink: 0,
      '& .MuiDrawer-paper': {
        width: DRAWER_WIDTH, boxSizing: 'border-box',
        background: dark ? '#12122a' : '#ffffff',
        borderRight: dark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.08)',
        boxShadow: 'none',
      },
    }}>
      {/* Logo */}
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 38, height: 38, borderRadius: 2,
          background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
          boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
        }}>
          <BoltIcon sx={{ color: '#fff', fontSize: 22 }} />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: dark ? '#e2e8f0' : '#0f172a', letterSpacing: '-0.3px' }}>
            PayFlow
          </Typography>
          <Typography variant="caption" sx={{ color: dark ? '#64748b' : '#94a3b8', lineHeight: 1 }}>
            v2.0 · Live
          </Typography>
        </Box>
        <Chip label="LIVE" size="small" sx={{ ml: 'auto', bgcolor: 'rgba(16,185,129,0.15)', color: '#10b981', fontWeight: 700, fontSize: '0.6rem', height: 20 }} />
      </Box>

      <Divider sx={{ borderColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', mx: 2 }} />

      <List sx={{ pt: 2, px: 1 }}>
        {navItems.map(({ label, icon, path }) => {
          const active = location.pathname === path;
          return (
            <ListItem key={path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton onClick={() => navigate(path)} sx={{
                borderRadius: 2.5, px: 2, py: 1.25,
                background: active
                  ? 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(6,182,212,0.1))'
                  : 'transparent',
                border: active ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent',
                '&:hover': { background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(99,102,241,0.06)' },
              }}>
                <ListItemIcon sx={{
                  minWidth: 38,
                  color: active ? '#818cf8' : (dark ? '#475569' : '#94a3b8'),
                }}>
                  {icon}
                </ListItemIcon>
                <ListItemText primary={label} primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontWeight: active ? 700 : 500,
                  color: active ? (dark ? '#e2e8f0' : '#0f172a') : (dark ? '#64748b' : '#64748b'),
                }} />
                {active && (
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#6366f1' }} />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* User section */}
      <Box sx={{ mt: 'auto', p: 2 }}>
        <Divider sx={{ borderColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', mb: 2 }} />
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5,
          borderRadius: 2.5,
          bgcolor: dark ? 'rgba(255,255,255,0.04)' : 'rgba(99,102,241,0.06)',
          border: dark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(99,102,241,0.1)',
        }}>
          <Avatar sx={{ width: 34, height: 34, background: 'linear-gradient(135deg, #6366f1, #06b6d4)', fontSize: 13, fontWeight: 700 }}>
            {user?.initials}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" noWrap sx={{ fontWeight: 700, color: dark ? '#e2e8f0' : '#0f172a', fontSize: '0.8rem' }}>
              {user?.name}
            </Typography>
            <Typography variant="caption" sx={{ color: dark ? '#64748b' : '#94a3b8' }}>
              {user?.role}
            </Typography>
          </Box>
          <ListItemButton onClick={logout} sx={{ p: 0.5, borderRadius: 1.5, minWidth: 0, width: 'auto', '&:hover': { bgcolor: 'rgba(239,68,68,0.1)' } }}>
            <LogoutIcon sx={{ fontSize: 18, color: dark ? '#475569' : '#94a3b8', '&:hover': { color: '#ef4444' } }} />
          </ListItemButton>
        </Box>
      </Box>
    </Drawer>
  );
};
