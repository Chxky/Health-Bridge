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
  TextField,
  CircularProgress,
  MenuItem,
} from '@mui/material';
import { getFacilities, getNationalStockMap } from '../services/api';

export default function StockPage() {
  const [facilities, setFacilities] = useState<any[]>([]);
  const [stockData, setStockData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFacility, setSelectedFacility] = useState('all');
  const [filterLowStock, setFilterLowStock] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [facs] = await Promise.all([
        getFacilities(),
      ]);
      setFacilities(facs);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStockData();
  }, [selectedFacility, filterLowStock]);

  async function loadStockData() {
    try {
      const data = await getNationalStockMap(
        undefined,
        filterLowStock ? true : undefined
      );
      setStockData(data);
    } catch (error) {
      console.error('Error loading stock data:', error);
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
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <TextField
                  select
                  size="small"
                  label="Facility"
                  value={selectedFacility}
                  onChange={(e) => setSelectedFacility(e.target.value)}
                  sx={{ minWidth: 220 }}
                >
                  <MenuItem value="all">All Facilities</MenuItem>
                  {facilities.map((f) => (
                    <MenuItem key={f.id} value={f.name}>
                      {f.name}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  size="small"
                  label="Filter"
                  value={filterLowStock ? 'low' : 'all'}
                  onChange={(e) => setFilterLowStock(e.target.value === 'low')}
                  sx={{ minWidth: 150 }}
                >
                  <MenuItem value="all">All Stock</MenuItem>
                  <MenuItem value="low">Low Stock Only</MenuItem>
                </TextField>
              </Box>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Facility</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Medicine</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Batch</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="center">Current Qty</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="center">Min Threshold</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="center">Status</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Expiry</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stockData.flatMap((facility) =>
                      facility.stock.map((item: any, idx: number) => (
                        <TableRow key={`${facility.facilityId}-${idx}`} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {facility.facilityName}
                            </Typography>
                          </TableCell>
                          <TableCell variant="body2">{item.medicineName}</TableCell>
                          <TableCell variant="body2">{item.batchNumber}</TableCell>
                          <TableCell align="center">
                            <Chip
                              label={item.currentQuantity}
                              size="small"
                              color={item.isLowStock ? 'error' : 'success'}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="center">{item.minimumThreshold}</TableCell>
                          <TableCell align="center">
                            <Chip
                              label={item.isLowStock ? 'Low Stock' : 'In Stock'}
                              size="small"
                              color={item.isLowStock ? 'error' : 'success'}
                            />
                          </TableCell>
                          <TableCell variant="body2">
                            {item.expiryDate
                              ? new Date(item.expiryDate).toLocaleDateString()
                              : '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
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
