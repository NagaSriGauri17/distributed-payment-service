import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Card, CardContent, Typography, List, ListItem, ListItemAvatar,
  Avatar, ListItemText, Chip, Divider, Switch, FormControlLabel, Badge,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import UndoIcon from '@mui/icons-material/Undo';
import SyncIcon from '@mui/icons-material/Sync';
import { TopBar } from '../components/layout/TopBar';

interface NotifItem {
  id: string;
  type: string;
  paymentId: string;
  message: string;
  time: Date;
  read: boolean;
}

const iconFor = (type: string) => {
  switch (type) {
    case 'PAYMENT_COMPLETED': return <CheckCircleIcon />;
    case 'PAYMENT_FAILED': return <ErrorIcon />;
    case 'PAYMENT_REVERSED': return <UndoIcon />;
    default: return <SyncIcon />;
  }
};

const colorFor = (type: string) => {
  switch (type) {
    case 'PAYMENT_COMPLETED': return '#2e7d32';
    case 'PAYMENT_FAILED': return '#c62828';
    case 'PAYMENT_REVERSED': return '#f57c00';
    default: return '#1a237e';
  }
};

const SAMPLE_EVENTS = [
  'PAYMENT_COMPLETED', 'PAYMENT_FAILED', 'PAYMENT_REVERSED', 'PAYMENT_PROCESSING',
];

export const NotificationsPage: React.FC = () => {
  const [notifs, setNotifs] = useState<NotifItem[]>([]);
  const [live, setLive] = useState(true);
  const timer = useRef<NodeJS.Timeout>();

  const addNotif = () => {
    const type = SAMPLE_EVENTS[Math.floor(Math.random() * SAMPLE_EVENTS.length)];
    const paymentId = `pay-${Math.random().toString(36).slice(2, 10)}`;
    setNotifs(prev => [{
      id: Math.random().toString(36).slice(2),
      type,
      paymentId,
      message: type === 'PAYMENT_COMPLETED'
        ? `Payment ${paymentId.slice(0,8)} of £${(Math.random() * 1000 + 10).toFixed(2)} completed successfully`
        : type === 'PAYMENT_FAILED'
        ? `Payment ${paymentId.slice(0,8)} failed — insufficient funds`
        : type === 'PAYMENT_REVERSED'
        ? `Payment ${paymentId.slice(0,8)} has been reversed`
        : `Payment ${paymentId.slice(0,8)} is being processed`,
      time: new Date(),
      read: false,
    }, ...prev.slice(0, 49)]);
  };

  useEffect(() => {
    if (live) { timer.current = setInterval(addNotif, 4000); }
    else { clearInterval(timer.current); }
    return () => clearInterval(timer.current);
  }, [live]);

  const unread = notifs.filter(n => !n.read).length;
  const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, read: true })));

  return (
    <Box>
      <TopBar title="Notifications" />
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
          <FormControlLabel
            control={<Switch checked={live} onChange={e => setLive(e.target.checked)} color="primary" />}
            label="Live feed (simulated Kafka events)"
          />
          {unread > 0 && (
            <Chip label={`${unread} unread`} color="error" size="small" onClick={markAllRead}
              sx={{ cursor: 'pointer' }} />
          )}
          {unread > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ cursor: 'pointer' }} onClick={markAllRead}>
              Mark all read
            </Typography>
          )}
        </Box>

        <Card>
          <CardContent sx={{ p: 0 }}>
            {notifs.length === 0 ? (
              <Box sx={{ py: 8, textAlign: 'center' }}>
                <SyncIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
                <Typography color="text.secondary">
                  Waiting for Kafka events… enable live feed above
                </Typography>
              </Box>
            ) : (
              <List disablePadding>
                {notifs.map((n, i) => (
                  <React.Fragment key={n.id}>
                    <ListItem
                      onClick={() => setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}
                      sx={{ bgcolor: n.read ? 'transparent' : '#f3f4ff', cursor: 'pointer',
                        '&:hover': { bgcolor: '#f8f9fa' } }}>
                      <ListItemAvatar>
                        <Badge variant="dot" color="error" invisible={n.read}>
                          <Avatar sx={{ bgcolor: colorFor(n.type), width: 38, height: 38 }}>
                            {iconFor(n.type)}
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography variant="body2" sx={{ fontWeight: n.read ? 400 : 600 }}>{n.message}</Typography>}
                        secondary={
                          <Box sx={{ display: 'flex', gap: 1, mt: 0.5, alignItems: 'center' }}>
                            <Chip label={n.type.replace('PAYMENT_', '')} size="small"
                              sx={{ fontSize: '0.65rem', height: 18, bgcolor: `${colorFor(n.type)}15`, color: colorFor(n.type) }} />
                            <Typography variant="caption" color="text.secondary">
                              {n.time.toLocaleTimeString('en-GB')}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {i < notifs.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};
