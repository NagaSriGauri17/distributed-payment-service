import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar, Box, CssBaseline, Drawer, IconButton, List, ListItemButton,
  ListItemIcon, ListItemText, Toolbar, Typography, Avatar, Chip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import PaymentIcon from '@mui/icons-material/Payment';
import AssignmentIcon from '@mui/icons-material/Assignment';
import NotificationsIcon from '@mui/icons-material/Notifications';
import BarChartIcon from '@mui/icons-material/BarChart';
import DashboardIcon from '@mui/icons-material/Dashboard';

const DRAWER_WIDTH = 240;

const navItems = [
  { label: 'Dashboard',     path: '/',               icon: <DashboardIcon /> },
  { label: 'Payments',      path: '/payments',        icon: <PaymentIcon /> },
  { label: 'Audit Logs',    path: '/audit',           icon: <AssignmentIcon /> },
  { label: 'Notifications', path: '/notifications',   icon: <NotificationsIcon /> },
  { label: 'Metrics',       path: '/metrics',         icon: <BarChartIcon /> },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const drawer = (
    <Box>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid #eee' }}>
        <Box sx={{ width: 32, height: 32, bgcolor: '#DB0011', borderRadius: 1,
                   display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: 14 }}>H</Typography>
        </Box>
        <Box>
          <Typography variant="subtitle2" fontWeight={700}>PaymentHub</Typography>
          <Typography variant="caption" color="text.secondary">HSBC Demo</Typography>
        </Box>
      </Box>
      <List sx={{ pt: 1 }}>
        {navItems.map(item => (
          <ListItemButton
            key={item.path}
            selected={location.pathname === item.path}
            onClick={() => { navigate(item.path); setMobileOpen(false); }}
            sx={{
              mx: 1, borderRadius: 2, mb: 0.5,
              '&.Mui-selected': { bgcolor: '#FFF0F0', color: '#DB0011',
                '& .MuiListItemIcon-root': { color: '#DB0011' } },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" elevation={0}
        sx={{ width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` }, ml: { sm: `${DRAWER_WIDTH}px` },
              bgcolor: '#fff', borderBottom: '1px solid #eee', color: 'text.primary' }}>
        <Toolbar>
          <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 2, display: { sm: 'none' } }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            {navItems.find(n => n.path === location.pathname)?.label ?? 'PaymentHub'}
          </Typography>
          <Chip label="Local Dev" size="small" color="warning" sx={{ mr: 2 }} />
          <Avatar sx={{ bgcolor: '#DB0011', width: 32, height: 32, fontSize: 14 }}>G</Avatar>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}>
        <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}>
          {drawer}
        </Drawer>
        <Drawer variant="permanent" sx={{ display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', borderRight: '1px solid #eee' } }} open>
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` }, mt: 8, bgcolor: '#F5F5F5', minHeight: '100vh' }}>
        {children}
      </Box>
    </Box>
  );
}
