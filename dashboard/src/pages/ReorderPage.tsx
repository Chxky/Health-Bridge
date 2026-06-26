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
  Button,
  CircularProgress,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from '@mui/material';
import { WarningAmberOutlined } from '@mui/icons-material';
import { getReorderAssessments, getPurchaseRequests } from '../services/api';

const urgencyColors: Record<string, string> = {
  critical: '#E53E3E',
  high: '#DD6B20',
  medium: '#D69E2E',
  low: '#38A169',
};

const statusColors: Record<string, string> = {
  pending_review: '#D69E2E',
  approved: '#38A169',
  rejected: '#E53E3E',
  ordered: '#2B6CB0',
  fulfilled: '#805AD5',
};

export default function ReorderPage() {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [purchaseRequests, setPurchaseRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'assessments' | 'requests'>('assessments');
  const [filterUrgency, setFilterUrgency] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [reorderResult, requestsResult] = await Promise.all([
        getReorderAssessments(),
        getPurchaseRequests(),
      ]);
      setAssessments(reorderResult.assessments || []);
      setSummary(reorderResult.summary);
      setPurchaseRequests(requestsResult || []);
    } catch (error) {
      console.error('Failed to load reorder data:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredAssessments =
    filterUrgency === 'all'
      ? assessments
      : assessments.filter((a) => a.urgency === filterUrgency);

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
        {/* Summary Cards */}
        {summary && (
          <>
            <Grid item xs={6} sm={3}>
              <Card
                sx={{
                  borderLeft: '4px solid #E53E3E',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: '#FFF5F5' },
                }}
                onClick={() => { setTab('assessments'); setFilterUrgency('critical'); }}
              >
                <CardContent>
                  <Typography variant="h4" sx={{ color: '#E53E3E', fontWeight: 700 }}>
                    {summary.critical}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#718096' }}>
                    Critical Items
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card
                sx={{
                  borderLeft: '4px solid #DD6B20',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: '#FFFAF0' },
                }}
                onClick={() => { setTab('assessments'); setFilterUrgency('high'); }}
              >
                <CardContent>
                  <Typography variant="h4" sx={{ color: '#DD6B20', fontWeight: 700 }}>
                    {summary.high}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#718096' }}>
                    High Priority
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card sx={{ borderLeft: '4px solid #D69E2E' }}>
                <CardContent>
                  <Typography variant="h4" sx={{ color: '#D69E2E', fontWeight: 700 }}>
                    {summary.medium}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#718096' }}>
                    Medium Priority
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card sx={{ borderLeft: '4px solid #2B6CB0' }}>
                <CardContent>
                  <Typography variant="h4" sx={{ color: '#2B6CB0', fontWeight: 700 }}>
                    {purchaseRequests.filter((r) => r.status === 'pending_review').length}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#718096' }}>
                    Pending Review
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </>
        )}

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant={tab === 'assessments' ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => setTab('assessments')}
                    sx={{ textTransform: 'none' }}
                  >
                    Reorder Assessments
                  </Button>
                  <Button
                    variant={tab === 'requests' ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => setTab('requests')}
                    sx={{ textTransform: 'none' }}
                  >
                    Purchase Requests
                  </Button>
                </Box>
                <Button
                  variant="contained"
                  size="small"
                  onClick={loadData}
                  sx={{ textTransform: 'none' }}
                >
                  Run Reorder Check
                </Button>
              </Box>

              {tab === 'assessments' ? (
                <>
                  <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
                    {['all', 'critical', 'high', 'medium'].map((u) => (
                      <Chip
                        key={u}
                        label={u === 'all' ? 'All' : u.charAt(0).toUpperCase() + u.slice(1)}
                        variant={filterUrgency === u ? 'filled' : 'outlined'}
                        color={u === 'critical' ? 'error' : u === 'high' ? 'warning' : 'default'}
                        onClick={() => setFilterUrgency(u)}
                        size="small"
                      />
                    ))}
                  </Box>

                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Medicine</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Facility</TableCell>
                          <TableCell sx={{ fontWeight: 600 }} align="center">Current Stock</TableCell>
                          <TableCell sx={{ fontWeight: 600 }} align="center">Reorder Point</TableCell>
                          <TableCell sx={{ fontWeight: 600 }} align="center">Days Until Stockout</TableCell>
                          <TableCell sx={{ fontWeight: 600 }} align="center">Suggested Order</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Urgency</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredAssessments.map((item, i) => (
                          <TableRow key={i} hover>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {item.medicineName}
                              </Typography>
                            </TableCell>
                            <TableCell variant="body">{item.facilityId}</TableCell>
                            <TableCell align="center">
                              <Chip
                                label={item.currentQuantity}
                                size="small"
                                color={item.currentQuantity <= item.minimumThreshold ? 'error' : 'warning'}
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell align="center">{item.reorderPoint}</TableCell>
                            <TableCell align="center">
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 600,
                                  color: item.estimatedDaysUntilStockout <= 7 ? '#E53E3E' : '#D69E2E',
                                }}
                              >
                                {item.estimatedDaysUntilStockout > 0
                                  ? `${item.estimatedDaysUntilStockout} days`
                                  : 'STOCKOUT'}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {item.suggestedOrderQuantity}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={item.urgency.toUpperCase()}
                                size="small"
                                sx={{
                                  bgcolor: `${urgencyColors[item.urgency]}20`,
                                  color: urgencyColors[item.urgency],
                                  fontWeight: 600,
                                  fontSize: 11,
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                        {filteredAssessments.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} align="center">
                              <Typography variant="body2" sx={{ color: '#A0AEC0', py: 4 }}>
                                No items need reordering at this time
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Medicine</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Facility</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="center">Suggested Qty</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Urgency</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Generated</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {purchaseRequests.map((req: any) => (
                        <TableRow key={req.id} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {req.medicineName}
                            </Typography>
                          </TableCell>
                          <TableCell variant="body">{req.facilityName || req.facilityId}</TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {req.suggestedQuantity}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={req.urgency?.toUpperCase()}
                              size="small"
                              sx={{
                                bgcolor: `${urgencyColors[req.urgency] || '#718096'}20`,
                                color: urgencyColors[req.urgency] || '#718096',
                                fontWeight: 600,
                                fontSize: 11,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={(req.status || 'pending_review').replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                              size="small"
                              sx={{
                                bgcolor: `${statusColors[req.status] || '#718096'}20`,
                                color: statusColors[req.status] || '#718096',
                                fontWeight: 600,
                                fontSize: 11,
                              }}
                            />
                          </TableCell>
                          <TableCell variant="body">
                            {req.generatedAt
                              ? new Date(req.generatedAt).toLocaleDateString()
                              : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                      {purchaseRequests.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            <Typography variant="body2" sx={{ color: '#A0AEC0', py: 4 }}>
                              No purchase requests found
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
