import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  TextField,
  MenuItem,
  Chip,
  CircularProgress,
} from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import { Icon } from 'leaflet';
import { getNationalStockMap, getFacilities } from '../services/api';

const markerIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

export default function StockMapPage() {
  const [facilities, setFacilities] = useState<any[]>([]);
  const [stockData, setStockData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [selectedFacility, setSelectedFacility] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [stock, facs] = await Promise.all([
        getNationalStockMap(),
        getFacilities(),
      ]);
      setStockData(stock);
      setFacilities(facs);
    } catch (error) {
      console.error('Error loading map data:', error);
    } finally {
      setLoading(false);
    }
  }

  const getMarkerColor = (lowStockCount: number, totalCount: number) => {
    const ratio = totalCount > 0 ? lowStockCount / totalCount : 0;
    if (ratio > 0.3) return '#E53E3E';
    if (ratio > 0.1) return '#D69E2E';
    return '#38A169';
  };

  const filteredStock = filterType === 'all'
    ? stockData
    : stockData.filter((s) => s.facilityType === filterType);

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
              <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <TextField
                  select
                  size="small"
                  label="Facility Type"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  sx={{ minWidth: 200 }}
                >
                  <MenuItem value="all">All Facilities</MenuItem>
                  <MenuItem value="central_hospital">Central Hospitals</MenuItem>
                  <MenuItem value="provincial_hospital">Provincial Hospitals</MenuItem>
                  <MenuItem value="district_hospital">District Hospitals</MenuItem>
                  <MenuItem value="clinic">Clinics</MenuItem>
                </TextField>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', ml: 'auto' }}>
                  <Chip size="small" label={`${filteredStock.length} facilities`} />
                  <Chip
                    size="small"
                    label={`${filteredStock.reduce((s, f) => s + f.lowStockCount, 0)} low stock`}
                    color="error"
                    variant="outlined"
                  />
                </Box>
              </Box>

              <Box sx={{ height: 500, borderRadius: 2, overflow: 'hidden' }}>
                <MapContainer
                  center={[-19.0154, 29.1549]}
                  zoom={6}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {filteredStock
                    .filter((f) => f.location)
                    .map((facility) => (
                      <CircleMarker
                        key={facility.facilityId}
                        center={[facility.location.lat, facility.location.lng]}
                        radius={Math.max(8, Math.min(20, facility.stockCount / 10))}
                        fillColor={getMarkerColor(facility.lowStockCount, facility.stockCount)}
                        color={getMarkerColor(facility.lowStockCount, facility.stockCount)}
                        weight={2}
                        opacity={0.8}
                        fillOpacity={0.5}
                        eventHandlers={{
                          click: () => setSelectedFacility(facility),
                        }}
                      >
                        <Popup>
                          <Box sx={{ minWidth: 200 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                              {facility.facilityName}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#718096', display: 'block', mb: 1 }}>
                              {facility.facilityType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                            </Typography>
                            <Typography variant="body2">
                              Stock Items: <strong>{facility.stockCount}</strong>
                            </Typography>
                            <Typography variant="body2">
                              Low Stock: <strong style={{ color: '#E53E3E' }}>{facility.lowStockCount}</strong>
                            </Typography>
                          </Box>
                        </Popup>
                      </CircleMarker>
                    ))}
                </MapContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Facility List */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontSize: 16 }}>
                Facility Stock Summary
              </Typography>
              <Grid container spacing={2}>
                {filteredStock.slice(0, 12).map((facility) => (
                  <Grid item xs={12} sm={6} md={4} key={facility.facilityId}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: '1px solid #E2E8F0',
                        cursor: 'pointer',
                        '&:hover': { borderColor: '#2B6CB0', bgcolor: '#EBF4FF' },
                      }}
                      onClick={() => setSelectedFacility(facility)}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {facility.facilityName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#718096' }}>
                        {facility.facilityType.replace(/_/g, ' ')}
                      </Typography>
                      <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                        <Chip
                          size="small"
                          label={`${facility.stockCount} items`}
                          variant="outlined"
                        />
                        {facility.lowStockCount > 0 && (
                          <Chip
                            size="small"
                            label={`${facility.lowStockCount} low`}
                            color="error"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
