// SeaMed Tracker - Inventory Page
// Full inventory list with filtering

import React from 'react';
import { InventoryList } from '@/components/inventory/InventoryList';
import { Box, Typography } from '@mui/material';

export default function InventoryPage() {
  return (
    <Box sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">Inventory</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          All your medical supplies in one place
        </Typography>
      </Box>

      <InventoryList />
    </Box>
  );
}
