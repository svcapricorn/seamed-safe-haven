// SeaMed Tracker - Inventory Page
// Full inventory list with filtering

import React, { useState } from 'react';
import { InventoryList } from '@/components/inventory/InventoryList';
import { ExcelImportDialog } from '@/components/inventory/ExcelImportDialog';
import { Box, Typography, Button, Stack } from '@mui/material';
import { FileSpreadsheet } from 'lucide-react';

export default function InventoryPage() {
  const [isImportOpen, setIsImportOpen] = useState(false);

  return (
    <Box sx={{ py: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
        <Box>
            <Typography variant="h5" fontWeight="bold">Inventory</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            All your medical supplies in one place
            </Typography>
        </Box>
        <Button 
            variant="outlined" 
            startIcon={<FileSpreadsheet size={18} />}
            onClick={() => setIsImportOpen(true)}
        >
            Import Excel
        </Button>
      </Stack>

      <InventoryList />

      <ExcelImportDialog 
        open={isImportOpen} 
        onClose={() => setIsImportOpen(false)} 
      />
    </Box>
  );
}
