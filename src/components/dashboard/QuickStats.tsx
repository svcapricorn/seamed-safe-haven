// SeaMed Tracker - Quick Stats Component
// Displays category breakdown and quick numbers

import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Cross, 
  Pill, 
  Stethoscope, 
  AlertTriangle, 
  Droplets,
  Package,
  Activity,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInventory } from '@/context/InventoryContext';
import { CATEGORY_INFO, ItemCategory } from '@/types';

const categoryIcons: Record<ItemCategory, React.ReactNode> = {
  'first-aid': <Cross className="h-5 w-5" />,
  'medications': <Pill className="h-5 w-5" />,
  'tools': <Stethoscope className="h-5 w-5" />,
  'emergency': <AlertTriangle className="h-5 w-5" />,
  'hygiene': <Droplets className="h-5 w-5" />,
  'diagnostic': <Activity className="h-5 w-5" />,
  'ppe': <Shield className="h-5 w-5" />,
  'other': <Package className="h-5 w-5" />,
};

export function QuickStats() {
  const { stats, items } = useInventory();

  if (items.length === 0) {
    return null;
  }

  const activeCategories = Object.entries(stats.categoryCounts)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground">By Category</h2>
        <Link 
          to="/inventory" 
          className="text-sm text-secondary hover:underline"
        >
          View all
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {activeCategories.map(([category, count], index) => (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link
              to={`/inventory?category=${category}`}
              className={cn(
                'card-maritime p-4 flex items-center gap-3',
                'hover:shadow-medium transition-shadow'
              )}
            >
              <div className={cn(
                'flex items-center justify-center w-10 h-10 rounded-lg',
                'bg-primary/10',
                CATEGORY_INFO[category as ItemCategory].color
              )}>
                {categoryIcons[category as ItemCategory]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {CATEGORY_INFO[category as ItemCategory].label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {count} item{count !== 1 ? 's' : ''}
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
