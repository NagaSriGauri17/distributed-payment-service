import React, { useState, useEffect } from 'react';
import {
  Box, Card, Typography, Table, TableHead, TableRow, TableCell, TableBody,
  TableContainer, CircularProgress, Chip, TextField, InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { TopBar } from '../components/layout/TopBar';
import { auditApi } from '../api/paymentApi';
import { AuditLog } from '../types';

const TransitionChip: React.FC<{ from: string; to: string }> = ({ from, to }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
    <Chip label={from || 'START'} size="small" sx={{ fontSize: '0.7rem', bgcolor: '#e3f2fd', color: '#1565c0' }} />
    <Typography variant="caption">→</Typography>
    <Chip label={to} size="small" sx={{ fontSize: '0.7rem',
      bgcolor: to === 'COMPLETED' ? '#e8f5e9' : to === 'FAILED' ? '#ffebee' : '#fff8e1',
      color: to === 'COMPLETED' ? '#2e7d32' : to === 'FAILED' ? '#c62828' : '#f57c00',
    }} />
  </Box>
);

export const AuditPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await auditApi.getAll();
      setLogs(data);
    } catch { setLogs([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = logs.filter(l =>
    !search || l.paymentId?.includes(search) || l.eventType?.includes(search.toUpperCase())
  );

  return (
    <Box>
      <TopBar title="Audit Logs" onRefresh={load} />
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <TextField size="small" placeholder="Search by payment ID or event type..."
            value={search} onChange={e => setSearch(e.target.value)} sx={{ width: 360 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
        </Box>

        <Card>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                  {['Audit ID', 'Payment ID', 'Transition', 'Event Type', 'Amount', 'Timestamp', 'Correlation ID'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, color: '#1a237e', fontSize: '0.78rem' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    {logs.length === 0 ? 'No audit logs yet — make payments to generate logs' : 'No results match your search'}
                  </TableCell></TableRow>
                ) : filtered.map(log => (
                  <TableRow key={log.auditId} hover>
                    <TableCell><Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#666' }}>
                      {log.auditId?.slice(0, 8)}...
                    </Typography></TableCell>
                    <TableCell><Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#1a237e' }}>
                      {log.paymentId?.slice(0, 8)}...
                    </Typography></TableCell>
                    <TableCell><TransitionChip from={log.fromStatus} to={log.toStatus} /></TableCell>
                    <TableCell><Chip label={log.eventType} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} /></TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{log.amount} {log.currency}</TableCell>
                    <TableCell><Typography variant="caption">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString('en-GB') : '—'}
                    </Typography></TableCell>
                    <TableCell><Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#888' }}>
                      {log.correlationId?.slice(0, 8)}...
                    </Typography></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {filtered.length} log{filtered.length !== 1 ? 's' : ''} shown • Connected to audit-service on :8082
        </Typography>
      </Box>
    </Box>
  );
};
