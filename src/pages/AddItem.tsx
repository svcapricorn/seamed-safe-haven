// SeaMed Tracker - Add Item Page
// Form for adding new inventory items

import React, { useState } from 'react';
import { ItemForm } from '@/components/inventory/ItemForm';
import { BarcodeScanner } from '@/components/scanner/BarcodeScanner';
import { ObjectScanner, ObjectScanResult } from '@/components/scanner/ObjectScanner';

export default function AddItemPage() {
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showObjectScanner, setShowObjectScanner] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | undefined>();
  const [identifiedObject, setIdentifiedObject] = useState<ObjectScanResult | null>(null);

  const handleBarcodeScan = (barcode: string) => {
    setScannedBarcode(barcode);
    setShowBarcodeScanner(false);
  };

  const handleObjectIdentify = (result: ObjectScanResult) => {
    setIdentifiedObject(result);
    setShowObjectScanner(false);
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
    </div>
  );
}
