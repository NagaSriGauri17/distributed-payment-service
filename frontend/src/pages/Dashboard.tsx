import React, { useEffect, useState } from 'react';
import { Grid, Card, CardContent, Typography, Box, Alert, CircularProgress } from '@mui/material';
import PaymentIcon from '@mui/icons-material/Payment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import StatCard from '../components/StatCard';
import { getPaymentsByAccount, getActuatorHealth } from '../services/api';
import { Payment } from '../types';

const COLORS = ['#2E7D32', '#C62828', '#F57C00', '#1565C0', '#616161'];

export default function Dashboard() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [health, setHealth]     = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    Promise.all([
      getPaymentsByAccount('ACC-001').catch(() => []),
      getActuatorHealth().catch(() => null),
    ]).then(([p, h]) => {
      setPayments(p as Payment[]);
      setHealth(h);
    }).catch(() => setError('Could not reach backend. Make sure services are running.'))
      .finally(() => setLoading(false));
  }, []);

  const statusCounts = payments.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  const totalAmount = payments.filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.amount, 0);

  const byDay = payments.reduce((acc, p) => {
    const day = new Date(p.createdAt).toLocaleDateString('en-GB', { weekday: 'short' });
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const barData = Object.entries(byDay).map(([day, count]) => ({ day, count }));

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>Overview</Typography>

      {error && <Alert severity="warning" sx={{ mb: 3 }}>{error}</Alert>}

      {health && (
        <Alert severity={health.status === 'UP' ? 'success' : 'error'} sx={{ mb: 3 }}>
          Backend status: <strong>{health.status}</strong>
        </Alert>
      )}

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Payments" value={payments.length}
            icon={<PaymentIcon />} color="#DB0011" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Completed" value={statusCounts['COMPLETED'] || 0}
            icon={<CheckCircleIcon />} color="#2E7D32" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Failed" value={statusCounts['FAILED'] || 0}
            icon={<ErrorIcon />} color="#C62828" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Volume" value={`£${totalAmount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`}
            icon={<AccountBalanceIcon />} color="#1565C0" />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>Payments by Day</Typography>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#DB0011" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>Status Breakdown</Typography>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
