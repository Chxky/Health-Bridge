import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Avatar,
  Stack,
  Divider,
  Chip,
  Fade,
} from '@mui/material';
import {
  Favorite,
  TrendingUp,
  Public,
  AccountBalance,
  HealthAndSafety,
  PrecisionManufacturing,
} from '@mui/icons-material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';

const data = [
  { month: 'Jan', lives: 4500, savings: 12000 },
  { month: 'Feb', lives: 5200, savings: 15000 },
  { month: 'Mar', lives: 6100, savings: 18000 },
  { month: 'Apr', lives: 5800, savings: 22000 },
  { month: 'May', lives: 7200, savings: 28000 },
];

export default function ImpactAnalyticsPage() {
  return (
    <Box>
      <Fade in={true} timeout={500}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1A365D' }}>
            Community Impact & ROI
          </Typography>
          <Typography variant="body1" sx={{ color: '#718096' }}>
            Real-time measurement of public health outcomes and operational efficiency.
          </Typography>
        </Box>
      </Fade>

      <Grid container spacing={3}>
        {/* Hero Metrics */}
        <Grid item xs={12} md={4}>
          <Fade in={true} timeout={700}>
            <Card sx={{ bgcolor: '#2B6CB0', color: 'white' }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                  <Favorite />
                </Avatar>
                <Typography variant="h6">Lives Impacted</Typography>
              </Stack>
              <Typography variant="h3" sx={{ fontWeight: 800 }}>28,800+</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                Estimated patients treated with traceable medicine.
              </Typography>
              <Box sx={{ mt: 3 }}>
                <Typography variant="caption">Goal: 50,000</Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={58} 
                  sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.2)', '& .MuiLinearProgress-bar': { bgcolor: 'white' } }} 
                />
              </Box>
            </CardContent>
          </Card></Fade>
        </Grid>

        <Grid item xs={12} md={4}>
          <Fade in={true} timeout={900}>
            <Card sx={{ bgcolor: '#2D3748', color: 'white' }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                  <AccountBalance />
                </Avatar>
                <Typography variant="h6">Operational Savings</Typography>
              </Stack>
              <Typography variant="h3" sx={{ fontWeight: 800 }}>$142,500</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                Saved through waste reduction & e-GP compliance.
              </Typography>
              <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp sx={{ color: '#48BB78' }} />
                <Typography variant="body2" sx={{ color: '#48BB78' }}>24% improvement vs Q1</Typography>
              </Box>
            </CardContent>
          </Card></Fade>
        </Grid>

        <Grid item xs={12} md={4}>
          <Fade in={true} timeout={1100}>
            <Card sx={{ bgcolor: '#38A169', color: 'white' }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                  <HealthAndSafety />
                </Avatar>
                <Typography variant="h6">Facility Efficiency</Typography>
              </Stack>
              <Typography variant="h3" sx={{ fontWeight: 800 }}>92%</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                Average stock availability across 42 hospitals.
              </Typography>
              <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
                <Chip size="small" label="Target: 95%" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
              </Box>
            </CardContent>
          </Card></Fade>
        </Grid>

        {/* Impact Growth Chart */}
        <Grid item xs={12} md={8}>
          <Fade in={true} timeout={1300}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>Social Impact Velocity</Typography>
              <Box sx={{ height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data}>
                    <defs>
                      <linearGradient id="colorLives" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2B6CB0" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#2B6CB0" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="lives" stroke="#2B6CB0" fillOpacity={1} fill="url(#colorLives)" />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card></Fade>
        </Grid>

        <Grid item xs={12} md={4}>
          <Fade in={true} timeout={1500}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>Resource Optimization</Typography>
              <Stack spacing={3}>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" fontWeight={600}>Reduced Expiry Waste</Typography>
                    <Typography variant="body2" color="primary">85%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={85} sx={{ height: 8, borderRadius: 4 }} />
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" fontWeight={600}>Procurement Speed</Typography>
                    <Typography variant="body2" color="primary">42%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={42} sx={{ height: 8, borderRadius: 4, bgcolor: '#E2E8F0', '& .MuiLinearProgress-bar': { bgcolor: '#805AD5' } }} />
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" fontWeight={600}>Staff Productivity</Typography>
                    <Typography variant="body2" color="primary">68%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={68} sx={{ height: 8, borderRadius: 4, bgcolor: '#E2E8F0', '& .MuiLinearProgress-bar': { bgcolor: '#38A169' } }} />
                </Box>
              </Stack>

              <Divider sx={{ my: 4 }} />

              <Box sx={{ textAlign: 'center' }}>
                <Avatar sx={{ bgcolor: '#EBF4FF', mx: 'auto', mb: 2 }}>
                  <Public sx={{ color: '#2B6CB0' }} />
                </Avatar>
                <Typography variant="subtitle2" fontWeight={700}>e-GP Network</Typography>
                <Typography variant="caption" color="textSecondary">
                  Integrated with Zimbabwe Government Procurement Portal
                </Typography>
              </Box>
            </CardContent>
          </Card></Fade>
        </Grid>
      </Grid>
    </Box>
  );
}
