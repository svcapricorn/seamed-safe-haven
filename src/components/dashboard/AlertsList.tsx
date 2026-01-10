// SeaMed Tracker - Alerts List Component
// Displays actionable alerts in a calm, non-alarmist way

import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Package, 
  Calendar, 
  AlertTriangle,
  ChevronRight,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInventory } from '@/context/InventoryContext';
import { CATEGORY_INFO } from '@/types';
import { formatDistanceToNow, differenceInDays, format } from 'date-fns';

export function AlertsList() {
  const { getLowStockItems, getExpiringSoonItems, getExpiredItems } = useInventory();

  const lowStock = getLowStockItems();
  const expiringSoon = getExpiringSoonItems(30);
  const expired = getExpiredItems();

  const hasNoAlerts = lowStock.length === 0 && expiringSoon.length === 0 && expired.length === 0;

  if (hasNoAlerts) {
    return (
      <div className="card-maritime p-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-success/10 text-success mb-3">
          <Package className="h-6 w-6" />
        </div>
        <p className="text-muted-foreground">
          No alerts — your supplies are in good order.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Expired Items - Most urgent */}
      {expired.length > 0 && (
        <AlertSection
          title="Expired items"
          subtitle="Replace before departure"
          icon={<AlertTriangle className="h-5 w-5" />}
          variant="critical"
          items={expired.map(item => ({
            id: item.id,
            name: item.name,
            category: CATEGORY_INFO[item.category].label,
            detail: `Expired ${formatDistanceToNow(new Date(item.expirationDate!), { addSuffix: true })}`,
          }))}
        />
      )}

      {/* Low Stock Items */}
      {lowStock.length > 0 && (
        <AlertSection
          title="Low stock"
          subtitle="Better to restock before landfall"
          icon={<Package className="h-5 w-5" />}
          variant="warning"
          items={lowStock.map(item => ({
            id: item.id,
            name: item.name,
            category: CATEGORY_INFO[item.category].label,
            detail: `${item.quantity} of ${item.minQuantity} minimum`,
          }))}
        />
      )}

      {/* Expiring Soon */}
      {expiringSoon.length > 0 && (
        <AlertSection
          title="Expiring soon"
          subtitle="Plan to replace on next provisioning"
          icon={<Clock className="h-5 w-5" />}
          variant="info"
          items={expiringSoon.map(item => {
            const daysUntil = differenceInDays(new Date(item.expirationDate!), new Date());
            return {
              id: item.id,
              name: item.name,
              category: CATEGORY_INFO[item.category].label,
              detail: daysUntil <= 7 
                ? `Expires in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`
                : `Expires ${format(new Date(item.expirationDate!), 'MMM d, yyyy')}`,
            };
          })}
        />
      )}
    </div>
  );
}

interface AlertSectionProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  variant: 'critical' | 'warning' | 'info';
  items: Array<{
    id: string;
    name: string;
    category: string;
    detail: string;
  }>;
}

function AlertSection({ title, subtitle, icon, variant, items }: AlertSectionProps) {
  const variantStyles = {
    critical: 'border-l-destructive bg-destructive/5',
    warning: 'border-l-warning bg-warning/5',
    info: 'border-l-secondary bg-secondary/5',
  };

  const iconStyles = {
    critical: 'text-destructive',
    warning: 'text-warning',
    info: 'text-secondary',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        'card-maritime overflow-hidden border-l-4',
        variantStyles[variant]
      )}
    >
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className={iconStyles[variant]}>{icon}</div>
          <div>
            <h3 className="font-medium text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div className="ml-auto">
            <span className="badge-status badge-warning">
              {items.length}
            </span>
          </div>
        </div>
      </div>

      <div className="divide-y divide-border/50">
        {items.slice(0, 3).map(item => (
          <Link
            key={item.id}
            to={`/inventory/${item.id}`}
            className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{item.name}</p>
              <p className="text-xs text-muted-foreground">{item.category}</p>
            </div>
            <div className="text-xs text-muted-foreground">{item.detail}</div>
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </Link>
        ))}
        
        {items.length > 3 && (
          <Link
            to="/inventory?filter=alerts"
            className="block p-3 text-center text-sm text-secondary hover:bg-muted/50 transition-colors"
          >
            View all {items.length} items →
          </Link>
        )}
      </div>
    </motion.div>
  );
}
