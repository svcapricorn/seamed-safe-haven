// SeaMed Tracker - Inventory Page
// Full inventory list with filtering

import React, { useState } from 'react';
import { InventoryList } from '@/components/inventory/InventoryList';
import { ExcelImportDialog } from '@/components/inventory/ExcelImportDialog';
import { QuickAddDialog } from '@/components/inventory/QuickAddDialog';
import { BarcodeScanner } from '@/components/scanner/BarcodeScanner';
import { Box, Typography, Button, Stack } from '@mui/material';
import { FileSpreadsheet, Scan } from 'lucide-react';
import { useInventory } from '@/context/InventoryContext';
import { InventoryItem } from '@/types';
import { toast } from '@/hooks/use-toast';

export default function InventoryPage() {
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [quickAddState, setQuickAddState] = useState<{ open: boolean; item?: InventoryItem; barcode?: string }>({ open: false });
  
  const { items, updateItem } = useInventory();

  const handleScan = (barcode: string) => {
    const found = items.find(i => i.barcode === barcode);
    setQuickAddState({
      open: true,
      item: found,
      barcode
    });
    // BarcodeScanner closes automatically on scan usually, but we need to ensure state sync if not
  };

  const handleConfirmAdd = async (id: string, amount: number) => {
    const item = items.find(i => i.id === id);
    if (item) {
       await updateItem(id, { quantity: item.quantity + amount });
       toast({ title: 'Stock Updated', description: `Added ${amount} to ${item.name}` });
    }
  };

  return (
    <Box sx={{ py: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
        <Box>
            <Typography variant="h5" fontWeight="bold">Inventory</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            All your medical supplies in one place
            </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
           <Button 
                variant="contained" 
                color="secondary"
                startIcon={<Scan size={18} />}
                onClick={() => setIsScannerOpen(true)}
            >
                Scan to Add
            </Button>
            <Button 
                variant="outlined" 
                startIcon={<FileSpreadsheet size={18} />}
                onClick={() => setIsImportOpen(true)}
            >
                Import Excel
            </Button>
        </Stack>
      </Stack>

      <InventoryList />

      <ExcelImportDialog 
        open={isImportOpen} 
        onClose={() => setIsImportOpen(false)} 
      />
      
      <BarcodeScanner 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onScan={handleScan} 
      />
      
      <QuickAddDialog 
        open={quickAddState.open} 
        onClose={() => setQuickAddState({ ...quickAddState, open: false })}
        item={quickAddState.item}
        scannedBarcode={quickAddState.barcode}
        onConfirmAdd={handleConfirmAdd}
      />
    </Box>
  );
}
