// SeaMed Tracker - Inventory List Component
// Displays all inventory items with filtering and search

import React, { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Package,
  ChevronRight,
  Calendar,
  MapPin,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInventory } from '@/context/InventoryContext';
import { CATEGORY_INFO, LOCATION_INFO, ItemCategory, InventoryItem } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { format, differenceInDays } from 'date-fns';

type FilterType = 'all' | 'alerts' | ItemCategory;

export function InventoryList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { items, stats } = useInventory();
  const [searchQuery, setSearchQuery] = useState('');
  
  const activeFilter = (searchParams.get('category') || searchParams.get('filter') || 'all') as FilterType;

  const filteredItems = useMemo(() => {
    let result = [...items];

    // Apply category/filter
    if (activeFilter === 'alerts') {
      const now = new Date();
      const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      result = result.filter(item => {
        const isExpired = item.expirationDate && new Date(item.expirationDate) < now;
        const isExpiringSoon = item.expirationDate && 
          new Date(item.expirationDate) >= now && 
          new Date(item.expirationDate) <= thirtyDays;
        const isLowStock = item.quantity <= item.minQuantity;
        return isExpired || isExpiringSoon || isLowStock;
      });
    } else if (activeFilter !== 'all' && Object.keys(CATEGORY_INFO).includes(activeFilter)) {
      result = result.filter(item => item.category === activeFilter);
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.notes?.toLowerCase().includes(query) ||
        CATEGORY_INFO[item.category].label.toLowerCase().includes(query)
      );
    }

    // Sort by status (critical first), then name
    result.sort((a, b) => {
      const statusOrder = (item: InventoryItem): number => {
        const now = new Date();
        if (item.expirationDate && new Date(item.expirationDate) < now) return 0;
        if (item.quantity <= item.minQuantity) return 1;
        if (item.expirationDate) {
          const daysUntil = differenceInDays(new Date(item.expirationDate), now);
          if (daysUntil <= 30) return 2;
        }
        return 3;
      };
      
      const statusDiff = statusOrder(a) - statusOrder(b);
      if (statusDiff !== 0) return statusDiff;
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [items, activeFilter, searchQuery]);

  const filterOptions: { value: FilterType; label: string; count?: number }[] = [
    { value: 'all', label: 'All Items', count: items.length },
    { value: 'alerts', label: 'Needs Attention', count: stats.lowStockCount + stats.expiringSoonCount + stats.expiredCount },
    ...Object.entries(CATEGORY_INFO).map(([key, info]) => ({
      value: key as ItemCategory,
      label: info.label,
      count: stats.categoryCounts[key as ItemCategory],
    })),
  ];

  const clearFilters = () => {
    setSearchParams({});
    setSearchQuery('');
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search supplies..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-12 bg-card"
        />
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
        {filterOptions.map(({ value, label, count }) => (
          <button
            key={value}
            onClick={() => {
              if (value === 'all') {
                setSearchParams({});
              } else if (value === 'alerts') {
                setSearchParams({ filter: 'alerts' });
              } else {
                setSearchParams({ category: value });
              }
            }}
            className={cn(
              'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium',
              'transition-colors duration-200',
              activeFilter === value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {label}
            {count !== undefined && count > 0 && (
              <span className="ml-1.5 opacity-70">({count})</span>
            )}
          </button>
        ))}
      </div>

      {/* Active Filters Banner */}
      {(activeFilter !== 'all' || searchQuery) && (
        <div className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
          <span className="text-sm text-muted-foreground">
            Showing {filteredItems.length} of {items.length} items
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        </div>
      )}

      {/* Items List */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {filteredItems.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card-maritime p-8 text-center"
            >
              <Package className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">
                {items.length === 0
                  ? "No items in your inventory yet."
                  : "No items match your search."}
              </p>
              {items.length === 0 && (
                <Link 
                  to="/add" 
                  className="inline-block mt-4 text-secondary hover:underline"
                >
                  Add your first item →
                </Link>
              )}
            </motion.div>
          ) : (
            filteredItems.map((item, index) => (
              <InventoryItemCard key={item.id} item={item} index={index} />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface InventoryItemCardProps {
  item: InventoryItem;
  index: number;
}

function InventoryItemCard({ item, index }: InventoryItemCardProps) {
  const now = new Date();
  const isExpired = item.expirationDate && new Date(item.expirationDate) < now;
  const isLowStock = item.quantity <= item.minQuantity;
  
  let daysUntilExpiry: number | null = null;
  if (item.expirationDate && !isExpired) {
    daysUntilExpiry = differenceInDays(new Date(item.expirationDate), now);
  }
  
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 30;
  const hasAlert = isExpired || isLowStock || isExpiringSoon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.03 }}
      layout
    >
      <Link
        to={`/inventory/${item.id}`}
        className={cn(
          'card-maritime p-4 flex items-center gap-4',
          'hover:shadow-medium transition-all duration-200',
          hasAlert && 'border-l-4',
          isExpired && 'border-l-destructive',
          !isExpired && isLowStock && 'border-l-warning',
          !isExpired && !isLowStock && isExpiringSoon && 'border-l-secondary'
        )}
      >
        {/* Category indicator */}
        <div className={cn(
          'flex items-center justify-center w-10 h-10 rounded-lg bg-muted flex-shrink-0',
          CATEGORY_INFO[item.category].color
        )}>
          <Package className="h-5 w-5" />
        </div>

        {/* Item info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium truncate">{item.name}</h3>
            {hasAlert && (
              <span className={cn(
                'badge-status text-xs',
                isExpired ? 'badge-critical' : isLowStock ? 'badge-warning' : 'badge-ok'
              )}>
                {isExpired ? 'Expired' : isLowStock ? 'Low' : 'Expiring'}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Package className="h-3 w-3" />
              Qty: {item.quantity}
            </span>
            {item.expirationDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(item.expirationDate), 'MMM yyyy')}
              </span>
            )}
            <span className="flex items-center gap-1 truncate">
              <MapPin className="h-3 w-3" />
              {LOCATION_INFO[item.location].label}
            </span>
          </div>
        </div>

        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
      </Link>
    </motion.div>
  );
}
