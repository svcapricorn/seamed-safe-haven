// SeaMed Tracker - Status Card Component
// Displays overall kit status with maritime-themed messaging

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, AlertCircle, Anchor, Ship } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInventory } from '@/context/InventoryContext';

type KitStatus = 'shipshape' | 'attention' | 'critical';

interface StatusInfo {
  status: KitStatus;
  icon: React.ReactNode;
  title: string;
  message: string;
  className: string;
}

export function StatusCard() {
  const { stats, items } = useInventory();

  const getStatusInfo = (): StatusInfo => {
    const criticalCount = stats.expiredCount + stats.lowStockCount;
    
    if (criticalCount === 0 && stats.expiringSoonCount === 0) {
      return {
        status: 'shipshape',
        icon: <CheckCircle2 className="h-8 w-8" />,
        title: 'Your medical kit is shipshape',
        message: items.length > 0 
          ? `All ${items.length} items are stocked and ready for sea.`
          : 'Add items to start tracking your medical supplies.',
        className: 'bg-success/10 border-success/30 text-success',
      };
    }

    if (stats.expiredCount > 0 || (stats.lowStockCount > 0 && stats.lowStockCount > 2)) {
      return {
        status: 'critical',
        icon: <AlertCircle className="h-8 w-8" />,
        title: 'Attention needed before departure',
        message: `${criticalCount} item${criticalCount > 1 ? 's' : ''} need${criticalCount === 1 ? 's' : ''} restocking or replacement.`,
        className: 'bg-destructive/10 border-destructive/30 text-destructive',
      };
    }

    return {
      status: 'attention',
      icon: <AlertTriangle className="h-8 w-8" />,
      title: 'A few items to review',
      message: `${stats.expiringSoonCount + stats.lowStockCount} item${stats.expiringSoonCount + stats.lowStockCount > 1 ? 's' : ''} to check before your next passage.`,
      className: 'bg-warning/10 border-warning/30 text-warning',
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        'card-maritime p-6 border-2',
        statusInfo.className
      )}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          {statusInfo.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-lg mb-1 text-foreground">
            {statusInfo.title}
          </h2>
          <p className="text-sm text-muted-foreground">
            {statusInfo.message}
          </p>
        </div>
        <div className="flex-shrink-0 opacity-20">
          <Ship className="h-12 w-12" />
        </div>
      </div>

      {/* Quick stats bar */}
      <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between text-sm">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-foreground">{items.length}</span>
          <span className="text-muted-foreground">items tracked</span>
        </div>
        {stats.expiringSoonCount > 0 && (
          <div className="flex items-center gap-1.5 text-warning">
            <span className="font-medium">{stats.expiringSoonCount}</span>
            <span>expiring soon</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
