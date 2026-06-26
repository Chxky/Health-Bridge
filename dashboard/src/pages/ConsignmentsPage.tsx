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
} from '@mui/material';
import { getConsignments } from '../services/api';

export default function ConsignmentsPage() {
  const [consignments, setConsignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const data = await getConsignments();
      setConsignments(data || []);
    } catch (error) {
      console.error('Error loading consignments:', error);
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
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3 }}>Medicine Consignments</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Medicine</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Source</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Dispatched</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Received</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {consignments.map((c) => (
                  <TableRow key={c.id} hover>
                    <TableCell variant="body">{c.id}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{c.medicineName}</Typography>
                      <Typography variant="caption" sx={{ color: '#718096' }}>Batch: {c.batchNumber}</Typography>
                    </TableCell>
                    <TableCell variant="body">{c.sourceWarehouse}</TableCell>
                    <TableCell>
                      <Chip 
                        label={c.status.toUpperCase()} 
                        size="small" 
                        color={c.status === 'delivered' ? 'success' : 'primary'} 
                      />
                    </TableCell>
                    <TableCell variant="body">{new Date(c.dispatchedTimestamp).toLocaleDateString()}</TableCell>
                    <TableCell variant="body">
                      {c.receivedTimestamp ? new Date(c.receivedTimestamp).toLocaleDateString() : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
