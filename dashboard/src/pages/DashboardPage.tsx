import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
} from '@mui/material';
import {
  Inventory2Outlined,
  WarningAmberOutlined,
  LocalShippingOutlined,
  CheckCircleOutline,
  TrendingDown,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { getComplianceReport, getReorderAssessments } from '../services/api';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [compliance, setCompliance] = useState<any>(null);
  const [reorderData, setReorderData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [complianceResult, reorderResult] = await Promise.all([
        getComplianceReport(),
        getReorderAssessments(),
      ]);
      setCompliance(complianceResult);
      setReorderData(reorderResult);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  const pieData = compliance
    ? [
        { name: 'Compliant', value: compliance.compliantCount, color: '#38A169' },
        { name: 'Partial', value: compliance.partialCount, color: '#D69E2E' },
        { name: 'Non-Compliant', value: compliance.nonCompliantCount, color: '#E53E3E' },
        { name: 'No Data', value: compliance.noDataCount, color: '#A0AEC0' },
      ]
    : [];

  const urgencyColors: Record<string, string> = {
    critical: '#E53E3E',
    high: '#DD6B20',
    medium: '#D69E2E',
    low: '#38A169',
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#718096', fontWeight: 500 }}>
                    Total Stock Items
                  </Typography>
                  <Typography variant="h4" sx={{ mt: 0.5, fontWeight: 700 }}>
                    {loading ? '...' : '2,847'}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#EBF4FF' }}>
                  <Inventory2Outlined sx={{ color: '#2B6CB0' }} />
                </Avatar>
              </Box>
              <Typography variant="caption" sx={{ color: '#38A169', mt: 1, display: 'block' }}>
                +12% from last month
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#718096', fontWeight: 500 }}>
                    Low Stock Alerts
                  </Typography>
                  <Typography variant="h4" sx={{ mt: 0.5, fontWeight: 700, color: '#E53E3E' }}>
                    {loading ? '...' : reorderData?.summary?.critical || 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#FED7D7' }}>
                  <WarningAmberOutlined sx={{ color: '#E53E3E' }} />
                </Avatar>
              </Box>
              <Typography variant="caption" sx={{ color: '#E53E3E', mt: 1, display: 'block' }}>
                Critical items need immediate attention
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#718096', fontWeight: 500 }}>
                    Active Consignments
                  </Typography>
                  <Typography variant="h4" sx={{ mt: 0.5, fontWeight: 700 }}>
                    {loading ? '...' : '156'}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#EBF4FF' }}>
                  <LocalShippingOutlined sx={{ color: '#2B6CB0' }} />
                </Avatar>
              </Box>
              <Typography variant="caption" sx={{ color: '#718096', mt: 1, display: 'block' }}>
                23 in transit
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#718096', fontWeight: 500 }}>
                    e-GP Compliance
                  </Typography>
                  <Typography variant="h4" sx={{ mt: 0.5, fontWeight: 700 }}>
                    {loading ? '...' : `${compliance?.overallComplianceRate || 0}%`}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#F0FFF4' }}>
                  <CheckCircleOutline sx={{ color: '#38A169' }} />
                </Avatar>
              </Box>
              <Typography variant="caption" sx={{ color: '#718096', mt: 1, display: 'block' }}>
                Across {compliance?.totalFacilities || 0} facilities
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Charts */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontSize: 16 }}>
                Stock Levels by Facility Type
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sampleStockData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="inStock" name="In Stock" fill="#38A169" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="lowStock" name="Low Stock" fill="#E53E3E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontSize: 16 }}>
                e-GP Compliance Status
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Critical Reorder Items */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontSize: 16 }}>
                  Critical Reorder Items
                </Typography>
                <Button
                  size="small"
                  onClick={() => navigate('/reorder')}
                  sx={{ textTransform: 'none' }}
                >
                  View All
                </Button>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Medicine</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Facility</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Current Stock</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Reorder Point</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Urgency</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Suggested Qty</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sampleReorderItems.map((item, i) => (
                      <TableRow key={i} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {item.medicine}
                          </Typography>
                        </TableCell>
                        <TableCell variant="body2">{item.facility}</TableCell>
                        <TableCell>
                          <Chip
                            label={item.currentStock}
                            size="small"
                            color="error"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell variant="body2">{item.reorderPoint}</TableCell>
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
                        <TableCell variant="body2">{item.suggestedQty}</TableCell>
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

const sampleStockData = [
  { name: 'Central Hosps', inStock: 1200, lowStock: 45 },
  { name: 'Provincial', inStock: 890, lowStock: 32 },
  { name: 'District', inStock: 654, lowStock: 28 },
  { name: 'Clinics', inStock: 432, lowStock: 67 },
];

const sampleReorderItems = [
  { medicine: 'Artemether/Lumefantrine', facility: 'Harare Central', currentStock: 45, reorderPoint: 200, urgency: 'critical', suggestedQty: 500 },
  { medicine: 'ORS Sachets', facility: 'Parirenyatwa', currentStock: 120, reorderPoint: 300, urgency: 'critical', suggestedQty: 600 },
  { medicine: 'Amoxicillin 250mg', facility: 'Mpilo Central', currentStock: 78, reorderPoint: 250, urgency: 'high', suggestedQty: 400 },
  { medicine: 'Zinc Sulfate 20mg', facility: 'United Bulawayo', currentStock: 56, reorderPoint: 200, urgency: 'high', suggestedQty: 350 },
];

function Avatar({ children, sx }: { children: React.ReactNode; sx?: any }) {
  return (
    <Box
      sx={{
        width: 48,
        height: 48,
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
