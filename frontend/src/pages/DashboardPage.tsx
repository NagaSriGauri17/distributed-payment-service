import React, { useEffect, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, CircularProgress, useTheme } from '@mui/material';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PaymentIcon from '@mui/icons-material/Payment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { TopBar } from '../components/layout/TopBar';
import { StatCard } from '../components/common/StatCard';
import { paymentApi } from '../api/paymentApi';
import { Payment } from '../types';
import { useAuth } from '../App';

const generateTrend = () => {
  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const t = new Date(now.getTime() - (11 - i) * 5 * 60 * 1000);
    return {
      time: t.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      requests: Math.floor(Math.random() * 40 + 10),
      errors: Math.floor(Math.random() * 5),
    };
  });
};

const STATUS_COLORS = { COMPLETED: '#10b981', FAILED: '#ef4444', PENDING: '#f59e0b', PROCESSING: '#6366f1', REVERSED: '#06b6d4' };

export const DashboardPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [trend] = useState(generateTrend());
  const theme = useTheme();
  const dark = theme.palette.mode === 'dark';
  const { user } = useAuth();

  const load = async () => {
    setLoading(true);
    try {
      const accounts = ['ACC001', 'ACC002', 'ACC003', 'ACC004'];
      const results = await Promise.allSettled(accounts.map(a => paymentApi.getByAccount(a)));
      const all: Payment[] = [];
      const seen = new Set<string>();
      results.forEach(r => {
        if (r.status === 'fulfilled') {
          r.value.forEach(p => { if (!seen.has(p.id)) { seen.add(p.id); all.push(p); } });
        }
      });
      all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setPayments(all);
    } catch { setPayments([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const stats = {
    total: payments.length,
    completed: payments.filter(p => p.status === 'COMPLETED').length,
    failed: payments.filter(p => p.status === 'FAILED').length,
    volume: payments.filter(p => p.status === 'COMPLETED').reduce((s, p) => s + p.amount, 0),
  };

  const pieData = Object.entries(
    payments.reduce((acc, p) => { acc[p.status] = (acc[p.status] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <Box sx={{ flex: 1 }}>
      <TopBar title="Dashboard" subtitle={`${greeting}, ${user?.name?.split(' ')[0]} 👋`} onRefresh={load} />
      <Box sx={{ p: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
            <CircularProgress sx={{ color: '#6366f1' }} />
          </Box>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard title="Total Payments" value={stats.total} icon={<PaymentIcon />} color="#6366f1" trend="+12%" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard title="Completed" value={stats.completed} icon={<CheckCircleIcon />} color="#10b981" trend="+8%" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard title="Failed" value={stats.failed} icon={<ErrorIcon />} color="#ef4444" trend={stats.failed > 0 ? `-${stats.failed}` : '0'} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Volume"
                value={`₹${stats.volume.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                icon={<TrendingUpIcon />} color="#06b6d4" trend="+24%"
              />
            </Grid>

            <Grid item xs={12} md={8}>
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2.5, fontWeight: 700 }}>Request Rate — Last 60 min</Typography>
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={trend}>
                      <defs>
                        <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="errGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={dark ? 'rgba(255,255,255,0.05)' : '#f1f5f9'} />
                      <XAxis dataKey="time" tick={{ fontSize: 11, fill: dark ? '#475569' : '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: dark ? '#475569' : '#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: dark ? '#1e1e3a' : '#fff', border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`, borderRadius: 8 }} />
                      <Area type="monotone" dataKey="requests" stroke="#6366f1" strokeWidth={2} fill="url(#reqGrad)" name="Requests" />
                      <Area type="monotone" dataKey="errors" stroke="#ef4444" strokeWidth={2} fill="url(#errGrad)" name="Errors" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2.5, fontWeight: 700 }}>Payment Status</Typography>
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                          dataKey="value" nameKey="name" paddingAngle={3}>
                          {pieData.map((entry, i) => (
                            <Cell key={i} fill={(STATUS_COLORS as any)[entry.name] || '#6366f1'} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: dark ? '#1e1e3a' : '#fff', border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`, borderRadius: 8 }} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: 240, gap: 1 }}>
                      <PaymentIcon sx={{ fontSize: 48, color: '#475569' }} />
                      <Typography color="text.secondary" variant="body2">No payments yet — create one!</Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Recent activity */}
            <Grid item xs={12}>
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Recent Payments</Typography>
                  {payments.slice(0, 5).map(p => (
                    <Box key={p.id} sx={{
                      display: 'flex', alignItems: 'center', py: 1.5,
                      borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.04)' : '#f1f5f9'}`,
                      '&:last-child': { borderBottom: 'none' },
                    }}>
                      <Box sx={{
                        width: 8, height: 8, borderRadius: '50%',
                        bgcolor: (STATUS_COLORS as any)[p.status] || '#6366f1',
                        mr: 2, flexShrink: 0,
                      }} />
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#6366f1', mr: 2, minWidth: 100 }}>
                        {p.id?.slice(0, 8)}...
                      </Typography>
                      <Typography variant="body2" sx={{ flex: 1, color: dark ? '#94a3b8' : '#64748b' }}>
                        {p.sourceAccount} → {p.destinationAccount}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, mr: 2 }}>
                        {p.amount?.toLocaleString()} {p.currency}
                      </Typography>
                      <Box sx={{
                        px: 1.5, py: 0.25, borderRadius: 1,
                        bgcolor: `${(STATUS_COLORS as any)[p.status] || '#6366f1'}18`,
                        color: (STATUS_COLORS as any)[p.status] || '#6366f1',
                        fontSize: '0.7rem', fontWeight: 700,
                      }}>
                        {p.status}
                      </Box>
                    </Box>
                  ))}
                  {payments.length === 0 && (
                    <Typography color="text.secondary" variant="body2" sx={{ py: 2, textAlign: 'center' }}>
                      No recent payments
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Box>
    </Box>
  );
};
