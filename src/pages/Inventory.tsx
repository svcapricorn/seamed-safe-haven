// SeaMed Tracker - Inventory Page
// Full inventory list with filtering

import React from 'react';
import { InventoryList } from '@/components/inventory/InventoryList';

export default function InventoryPage() {
  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Inventory</h1>
        <p className="text-muted-foreground text-sm mt-1">
          All your medical supplies in one place
        </p>
      </div>

      <InventoryList />
    </div>
  );
}
