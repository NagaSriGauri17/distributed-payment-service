import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Chip, LinearProgress,
  Table, TableBody, TableRow, TableCell, Alert,
} from '@mui/material';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend,
} from 'recharts';
import { TopBar } from '../components/layout/TopBar';
import { StatCard } from '../components/common/StatCard';
import SpeedIcon from '@mui/icons-material/Speed';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import TimerIcon from '@mui/icons-material/Timer';
import MemoryIcon from '@mui/icons-material/Memory';

// Simulate live metrics (in real app, parsed from /actuator/prometheus)
const genMetrics = () => {
  const t = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return {
    time: t,
    requestRate: +(Math.random() * 30 + 5).toFixed(2),
    errorRate: +(Math.random() * 3).toFixed(2),
    p50: +(Math.random() * 50 + 10).toFixed(1),
    p95: +(Math.random() * 150 + 80).toFixed(1),
    p99: +(Math.random() * 400 + 200).toFixed(1),
    heapUsed: +(Math.random() * 200 + 100).toFixed(0),
  };
};

export const MetricsPage: React.FC = () => {
  const [history, setHistory] = useState(() => Array.from({ length: 10 }, genMetrics));
  const [cbState, setCbState] = useState<'CLOSED' | 'OPEN' | 'HALF_OPEN'>('CLOSED');
  const current = history[history.length - 1];

  useEffect(() => {
    const t = setInterval(() => {
      setHistory(prev => [...prev.slice(-19), genMetrics()]);
      // Occasionally simulate circuit breaker opening
      if (Math.random() < 0.05) setCbState('OPEN');
      else if (Math.random() < 0.1) setCbState('HALF_OPEN');
      else setCbState('CLOSED');
    }, 2000);
    return () => clearInterval(t);
  }, []);

  const cbColor = cbState === 'CLOSED' ? 'success' : cbState === 'HALF_OPEN' ? 'warning' : 'error';

  return (
    <Box>
      <TopBar title="Live Metrics" />
      <Box sx={{ p: 3 }}>
        <Alert severity="info" sx={{ mb: 3 }}>
          Metrics are live-simulated. In production, these are scraped from{' '}
          <strong>:8080/actuator/prometheus</strong> by Prometheus and displayed in Grafana.
          <br />Grafana dashboard: <strong>http://localhost:3000</strong> (admin/admin)
        </Alert>

        <Grid container spacing={3}>
          {/* Stat cards */}
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Request Rate" value={`${current.requestRate} req/s`}
              icon={<SpeedIcon />} color="#1a237e" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Error Rate" value={`${current.errorRate}%`}
              icon={<ErrorOutlineIcon />} color={current.errorRate > 2 ? '#c62828' : '#2e7d32'} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="P99 Latency" value={`${current.p99}ms`}
              icon={<TimerIcon />} color={current.p99 > 500 ? '#c62828' : '#1a237e'} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="JVM Heap" value={`${current.heapUsed}MB`}
              icon={<MemoryIcon />} color="#1565c0" />
          </Grid>

          {/* Circuit Breaker */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Circuit Breaker — paymentService</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box sx={{
                    width: 20, height: 20, borderRadius: '50%',
                    bgcolor: cbState === 'CLOSED' ? '#2e7d32' : cbState === 'HALF_OPEN' ? '#f57c00' : '#c62828',
                    boxShadow: `0 0 8px ${cbState === 'CLOSED' ? '#2e7d32' : cbState === 'HALF_OPEN' ? '#f57c00' : '#c62828'}`,
                  }} />
                  <Chip label={cbState} color={cbColor} sx={{ fontWeight: 700 }} />
                </Box>
                <Table size="small">
                  <TableBody>
                    {[
                      ['Sliding window', '10 calls'],
                      ['Failure threshold', '50%'],
                      ['Wait (open state)', '10s'],
                      ['Retry attempts', '3'],
                    ].map(([k, v]) => (
                      <TableRow key={k}>
                        <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem', border: 0 }}>{k}</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', border: 0 }}>{v}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Grid>

          {/* Latency chart */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Latency Percentiles (ms)</Typography>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="time" tick={{ fontSize: 10 }} interval={2} />
                    <YAxis tick={{ fontSize: 10 }} unit="ms" />
                    <Tooltip formatter={(v: number) => `${v}ms`} />
                    <Legend />
                    <Line type="monotone" dataKey="p50" stroke="#2e7d32" dot={false} name="p50" strokeWidth={2} />
                    <Line type="monotone" dataKey="p95" stroke="#f57c00" dot={false} name="p95" strokeWidth={2} />
                    <Line type="monotone" dataKey="p99" stroke="#c62828" dot={false} name="p99" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Request / Error rate */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Request vs Error Rate (req/s)</Typography>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={history.slice(-10)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="requestRate" fill="#1a237e" name="Requests/s" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="errorRate" fill="#c62828" name="Errors/s" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};
