import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar as MuiAvatar,
  CircularProgress,
  Stack,
  Divider,
  Fade,
} from '@mui/material';
import {
  PrecisionManufacturing,
  Bolt,
  Inventory2Outlined,
  WarningAmberOutlined,
  LocalShippingOutlined,
  CheckCircleOutline,
  AutoGraph,
  InfoOutlined,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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
      {/* Hero Section */}
      <Fade in={true} timeout={600}>
        <Card 
          sx={{ 
            mb: 4, 
            borderRadius: 4, 
            background: 'linear-gradient(135deg, #1A365D 0%, #2B6CB0 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
        <Box 
          sx={{ 
            position: 'absolute', 
            right: -20, 
            top: -20, 
            opacity: 0.1, 
            fontSize: 200, 
            transform: 'rotate(-15deg)' 
          }}
        >
          <PrecisionManufacturing fontSize="inherit" />
        </Box>
        <CardContent sx={{ p: 4, position: 'relative', zIndex: 1 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
                System Overview: Healthy
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: 600 }}>
                Traceability engine is active across all 10 provinces. 
                AI reorder suggestions have reduced stockouts by 34% this quarter.
              </Typography>
              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button 
                  variant="contained" 
                  startIcon={<Bolt />}
                  sx={{ bgcolor: '#48BB78', '&:hover': { bgcolor: '#38A169' }, borderRadius: 2 }}
                  onClick={() => navigate('/reorder')}
                >
                  Review AI Alerts
                </Button>
                <Button 
                  variant="outlined" 
                  sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)', borderRadius: 2 }}
                  onClick={() => navigate('/impact')}
                >
                  View Impact ROI
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
              <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <CircularProgress 
                  variant="determinate" 
                  value={88} 
                  size={120} 
                  thickness={5} 
                  sx={{ color: '#48BB78' }} 
                />
                <Box
                  sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="h4" component="div" sx={{ fontWeight: 800 }}>
                    88%
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" sx={{ display: 'block', mt: 1, fontWeight: 600 }}>
                NATIONAL HEALTH SCORE
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card></Fade>

      <Fade in={true} timeout={800}>
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
                Predictive Analytics
              </Typography>
              <Stack spacing={2}>
                <Box sx={{ p: 2, bgcolor: '#F7FAFC', borderRadius: 2, borderLeft: '4px solid #805AD5' }}>
                  <Typography variant="caption" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <AutoGraph fontSize="small" /> AI PROJECTION
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                    High risk of stockout for Insulin in Manicaland Province (ETA: 12 Days)
                  </Typography>
                </Box>
                <Box sx={{ p: 2, bgcolor: '#F7FAFC', borderRadius: 2, borderLeft: '4px solid #38A169' }}>
                  <Typography variant="caption" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <InfoOutlined fontSize="small" /> OPTIMIZATION TIP
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                    Re-routing surplus Paracetamol from Bulawayo could save $4k in logistics.
                  </Typography>
                </Box>
              </Stack>
              
              <Divider sx={{ my: 3 }} />
              
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ color: '#2B6CB0', fontWeight: 800 }}>+ Zimbabwe 2030</Typography>
                <Typography variant="caption" color="textSecondary">Towards a Digitized National Supply Chain</Typography>
              </Box>
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
                        <TableCell variant="body">{item.facility}</TableCell>
                        <TableCell>
                          <Chip
                            label={item.currentStock}
                            size="small"
                            color="error"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell variant="body">{item.reorderPoint}</TableCell>
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
                        <TableCell variant="body">{item.suggestedQty}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid></Fade>
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
