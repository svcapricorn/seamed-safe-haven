// SeaMed Tracker - Item Detail Page
// View and edit individual items

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useInventory } from '@/context/InventoryContext';
import { ItemForm } from '@/components/inventory/ItemForm';
import { BarcodeScanner } from '@/components/scanner/BarcodeScanner';
import { Button } from '@/components/ui/button';

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getItemById, isLoading } = useInventory();
  const [showScanner, setShowScanner] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | undefined>();

  const item = id ? getItemById(id) : undefined;

  useEffect(() => {
    if (!isLoading && !item && id) {
      navigate('/inventory', { replace: true });
    }
  }, [item, isLoading, id, navigate]);

  const handleScan = (barcode: string) => {
    setScannedBarcode(barcode);
    setShowScanner(false);
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
          onScanRequest={() => setShowScanner(true)}
          scannedBarcode={scannedBarcode}
        />
      </motion.div>

      <BarcodeScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleScan}
      />
    </div>
  );
}
