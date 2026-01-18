// SailMed Tracker - Item Detail Page
// View and edit individual items

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useInventory } from '@/context/InventoryContext';
import { ItemForm } from '@/components/inventory/ItemForm';
import { BarcodeScanner } from '@/components/scanner/BarcodeScanner';
import { ObjectScanner, ObjectScanResult } from '@/components/scanner/ObjectScanner';
import { Button } from '@/components/ui/button';

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getItemById, isLoading } = useInventory();
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showObjectScanner, setShowObjectScanner] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | undefined>();
  const [identifiedObject, setIdentifiedObject] = useState<ObjectScanResult | null>(null);

  const item = id ? getItemById(id) : undefined;

  useEffect(() => {
    if (!isLoading && !item && id) {
      navigate('/inventory', { replace: true });
    }
  }, [item, isLoading, id, navigate]);

  const handleBarcodeScan = (barcode: string) => {
    setScannedBarcode(barcode);
    setShowBarcodeScanner(false);
  };

  const handleObjectIdentify = (result: ObjectScanResult) => {
    setIdentifiedObject(result);
    setShowObjectScanner(false);
  };

  if (isLoading) {
    return (
      <div className="container py-6 space-y-4">
        <div className="h-8 w-32 bg-muted rounded animate-pulse" />
        <div className="h-12 bg-muted rounded animate-pulse" />
        <div className="h-64 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  if (!item) {
    return null;
  }

  return (
    <div className="container py-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-4 -ml-2"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground">{item.name}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Edit item details
          </p>
        </div>

        <ItemForm
          existingItem={item}
          onScanBarcodeRequest={() => setShowBarcodeScanner(true)}
          onScanObjectRequest={() => setShowObjectScanner(true)}
          scannedBarcode={scannedBarcode}
          identifiedObject={identifiedObject}
        />
      </motion.div>

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
