// SeaMed Tracker - Dashboard Page
// Main overview page with status and alerts

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Download, FileText } from 'lucide-react';
import { useInventory } from '@/context/InventoryContext';
import { StatusCard } from '@/components/dashboard/StatusCard';
import { AlertsList } from '@/components/dashboard/AlertsList';
import { QuickStats } from '@/components/dashboard/QuickStats';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

export default function Dashboard() {
  const { items, exportToCSV, isLoading } = useInventory();

  const handleExport = () => {
    if (items.length === 0) {
      toast({
        title: 'No items to export',
        description: 'Add some items to your inventory first.',
      });
      return;
    }

    const csv = exportToCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `seamed-inventory-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Export complete',
      description: 'Your inventory has been exported to CSV.',
    });
  };

  if (isLoading) {
    return (
      <div className="container py-6 space-y-6">
        <div className="h-40 bg-muted rounded-xl animate-pulse" />
        <div className="h-32 bg-muted rounded-xl animate-pulse" />
        <div className="h-48 bg-muted rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      {/* Status Overview */}
      <StatusCard />

      {/* Quick Actions */}
      <div className="flex gap-3">
        <Link to="/add" className="flex-1">
          <Button className="w-full h-12 bg-secondary text-secondary-foreground hover:bg-secondary/90">
            <Plus className="h-5 w-5 mr-2" />
            Add Item
          </Button>
        </Link>
        <Button
          variant="outline"
          className="h-12 px-4"
          onClick={handleExport}
          disabled={items.length === 0}
        >
          <Download className="h-5 w-5" />
        </Button>
      </div>

      {/* Alerts Section */}
      <section>
        <h2 className="font-semibold text-foreground mb-3">Alerts</h2>
        <AlertsList />
      </section>

      {/* Category Stats */}
      <section>
        <QuickStats />
      </section>

      {/* Regulatory Templates Link */}
      {items.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Link
            to="/templates"
            className="card-maritime p-4 flex items-center gap-4 hover:shadow-medium transition-shadow"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-accent">
              <FileText className="h-6 w-6 text-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium">Regulatory Templates</h3>
              <p className="text-sm text-muted-foreground">
                Compare with USCG, RYA, and WHO guidelines
              </p>
            </div>
          </Link>
        </motion.section>
      )}

      {/* Disclaimer */}
      <div className="text-center py-4">
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          SeaMed Tracker is an organizational tool only. It does not provide medical advice, 
          diagnosis, or treatment recommendations.
        </p>
      </div>
    </div>
  );
}
