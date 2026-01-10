// SeaMed Tracker - Add Item Page
// Form for adding new inventory items

import React, { useState } from 'react';
import { ItemForm } from '@/components/inventory/ItemForm';
import { BarcodeScanner } from '@/components/scanner/BarcodeScanner';

export default function AddItemPage() {
  const [showScanner, setShowScanner] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | undefined>();

  const handleScan = (barcode: string) => {
    setScannedBarcode(barcode);
    setShowScanner(false);
  };

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Add Item</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Add a new item to your medical kit
        </p>
      </div>

      <ItemForm
        onScanRequest={() => setShowScanner(true)}
        scannedBarcode={scannedBarcode}
      />

      <BarcodeScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleScan}
      />
    </div>
  );
}
