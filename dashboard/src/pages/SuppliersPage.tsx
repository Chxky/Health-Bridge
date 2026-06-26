import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Rating,
} from '@mui/material';
import { getSupplierPerformance } from '../services/api';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const data = await getSupplierPerformance();
      setSuppliers(data || []);
    } catch (error) {
      console.error('Failed to load supplier data:', error);
    } finally {
      setLoading(false);
    }
  }

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
        {suppliers.map((supplier) => (
          <Grid item xs={12} sm={6} md={4} key={supplier.supplierId}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontSize: 16, mb: 1 }}>
                  {supplier.name}
                </Typography>
                <Typography variant="caption" sx={{ color: '#718096', display: 'block', mb: 2 }}>
                  {supplier.contactEmail}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="body2" sx={{ color: '#718096' }}>
                    Rating:
                  </Typography>
                  <Rating
                    value={supplier.performanceRating}
                    readOnly
                    size="small"
                    precision={0.5}
                  />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {supplier.performanceRating?.toFixed(1)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                  <Chip
                    size="small"
                    label={`Avg Delivery: ${supplier.averageDeliveryDays} days`}
                    variant="outlined"
                    color={supplier.averageDeliveryDays <= 14 ? 'success' : 'warning'}
                  />
                  <Chip
                    size="small"
                    label={`On-Time: ${supplier.onTimeDeliveries || 0}/${supplier.totalOrders || 0}`}
                    variant="outlined"
                  />
                  <Chip
                    size="small"
                    label={`Disputes: ${supplier.disputedOrders || 0}`}
                    variant="outlined"
                    color={(supplier.disputedOrders || 0) > 0 ? 'error' : 'default'}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontSize: 16 }}>
                Supplier Performance Summary
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Supplier</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Rating</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="center">Total Orders</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="center">On-Time Deliveries</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="center">Avg Delivery Days</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="center">Disputes</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Performance</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {suppliers.map((supplier) => {
                      const onTimeRate =
                        supplier.totalOrders > 0
                          ? Math.round((supplier.onTimeDeliveries / supplier.totalOrders) * 100)
                          : 0;
                      return (
                        <TableRow key={supplier.supplierId} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {supplier.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Rating
                              value={supplier.performanceRating}
                              readOnly
                              size="small"
                              precision={0.5}
                            />
                          </TableCell>
                          <TableCell align="center">{supplier.totalOrders}</TableCell>
                          <TableCell align="center">{supplier.onTimeDeliveries}</TableCell>
                          <TableCell align="center">{supplier.averageDeliveryDays}</TableCell>
                          <TableCell align="center">{supplier.disputedOrders}</TableCell>
                          <TableCell>
                            <Chip
                              label={`${onTimeRate}%`}
                              size="small"
                              color={
                                onTimeRate >= 80
                                  ? 'success'
                                  : onTimeRate >= 50
                                    ? 'warning'
                                    : 'error'
                              }
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
