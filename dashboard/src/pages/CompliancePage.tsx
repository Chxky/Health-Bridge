import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  TextField,
  MenuItem,
  Grid,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { getComplianceReport } from '../services/api';

export default function CompliancePage() {
  const [compliance, setCompliance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return d.toISOString().slice(0, 7);
  });

  useEffect(() => {
    loadReport();
  }, [selectedMonth]);

  async function loadReport() {
    setLoading(true);
    try {
      const result = await getComplianceReport(selectedMonth);
      setCompliance(result);
    } catch (error) {
      console.error('Failed to load compliance report:', error);
    } finally {
      setLoading(false);
    }
  }

  const getStatusChip = (status: string) => {
    const config: Record<string, { color: any; label: string }> = {
      compliant: { color: 'success', label: 'Compliant' },
      partial: { color: 'warning', label: 'Partial' },
      non_compliant: { color: 'error', label: 'Non-Compliant' },
      no_data: { color: 'default', label: 'No Data' },
    };
    const c = config[status] || { color: 'default', label: status };
    return <Chip size="small" label={c.label} color={c.color as any} variant="outlined" />;
  };

  const chartData = compliance
    ? [
        { name: 'Compliant', value: compliance.compliantCount, fill: '#38A169' },
        { name: 'Partial', value: compliance.partialCount, fill: '#D69E2E' },
        { name: 'Non-Compliant', value: compliance.nonCompliantCount, fill: '#E53E3E' },
        { name: 'No Data', value: compliance.noDataCount, fill: '#A0AEC0' },
      ]
    : [];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontSize: 16 }}>
                    e-GP Compliance Tracker
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#718096' }}>
                    Tracking QR scan compliance across all facilities
                  </Typography>
                </Box>
                <TextField
                  select
                  size="small"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  sx={{ minWidth: 160 }}
                >
                  {months.map((m) => (
                    <MenuItem key={m} value={m}>
                      {new Date(m + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#F0FFF4', borderRadius: 2 }}>
                    <Typography variant="h4" sx={{ color: '#38A169', fontWeight: 700 }}>
                      {compliance?.overallComplianceRate || 0}%
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#718096' }}>
                      Overall Compliance
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#EBF4FF', borderRadius: 2 }}>
                    <Typography variant="h4" sx={{ color: '#2B6CB0', fontWeight: 700 }}>
                      {compliance?.compliantCount || 0}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#718096' }}>
                      Compliant
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#FFF5F5', borderRadius: 2 }}>
                    <Typography variant="h4" sx={{ color: '#E53E3E', fontWeight: 700 }}>
                      {compliance?.nonCompliantCount || 0}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#718096' }}>
                      Non-Compliant
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#FFFFF0', borderRadius: 2 }}>
                    <Typography variant="h4" sx={{ color: '#D69E2E', fontWeight: 700 }}>
                      {compliance?.partialCount || 0}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#718096' }}>
                      Partial
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Box sx={{ height: 250, mb: 3 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" name="Facilities" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Facility</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="center">
                        Consignments Received
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="center">
                        Scanned
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="center">
                        Compliance Rate
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Last Scan</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {compliance?.facilities?.map((facility: any) => (
                      <TableRow key={facility.facilityId} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {facility.facilityName}
                          </Typography>
                        </TableCell>
                        <TableCell variant="body2">
                          {facility.facilityType?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                        </TableCell>
                        <TableCell align="center">{facility.consignmentsReceived}</TableCell>
                        <TableCell align="center">{facility.consignmentsScanned}</TableCell>
                        <TableCell align="center">
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              color:
                                facility.complianceRate >= 80
                                  ? '#38A169'
                                  : facility.complianceRate >= 50
                                    ? '#D69E2E'
                                    : '#E53E3E',
                            }}
                          >
                            {facility.complianceRate}%
                          </Typography>
                        </TableCell>
                        <TableCell>{getStatusChip(facility.status)}</TableCell>
                        <TableCell variant="body2">
                          {facility.lastScanDate
                            ? new Date(facility.lastScanDate).toLocaleDateString()
                            : 'Never'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
