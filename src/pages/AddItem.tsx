// SeaMed Tracker - Add Item Page
// Form for adding new inventory items

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ItemForm } from '@/components/inventory/ItemForm';
import { BarcodeScanner } from '@/components/scanner/BarcodeScanner';
import { ObjectScanner, ObjectScanResult } from '@/components/scanner/ObjectScanner';
import { Box, Typography } from '@mui/material';

export default function AddItemPage() {
  const [searchParams] = useSearchParams();
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showObjectScanner, setShowObjectScanner] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | undefined>(searchParams.get('barcode') || undefined);
  const [identifiedObject, setIdentifiedObject] = useState<ObjectScanResult | null>(null);

  // Clear URL params after reading
  useEffect(() => {
    if (searchParams.get('barcode')) {
      const url = new URL(window.location.href);
      url.searchParams.delete('barcode');
      window.history.replaceState({}, '', url);
    }
  }, [searchParams]);

  const handleBarcodeScan = (barcode: string) => {
    setScannedBarcode(barcode);
    setShowBarcodeScanner(false);
  };

  const handleObjectIdentify = (result: ObjectScanResult) => {
    setIdentifiedObject(result);
    setShowObjectScanner(false);
  };

  return (
    <Box sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">Add Item</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Add a new item to your medical kit
        </Typography>
      </Box>

      <ItemForm
        onScanBarcodeRequest={() => setShowBarcodeScanner(true)}
        onScanObjectRequest={() => setShowObjectScanner(true)}
        scannedBarcode={scannedBarcode}
        identifiedObject={identifiedObject}
      />

      <BarcodeScanner
        isOpen={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onScan={handleBarcodeScan}
      />

      <ObjectScanner
        isOpen={showObjectScanner}
        onClose={() => setShowObjectScanner(false)}
        onIdentify={handleObjectIdentify}
      />
    </Box>
  );
}
