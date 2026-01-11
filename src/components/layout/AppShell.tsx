// SeaMed Tracker - App Shell Layout
// Mobile-first responsive layout with bottom navigation

import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Plus, 
  Settings,
  Anchor
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useInventory } from '@/context/InventoryContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/inventory', icon: Package, label: 'Inventory' },
  { to: '/add', icon: Plus, label: 'Add Item' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function AppShell() {
  const location = useLocation();
  const { stats, isLoading } = useInventory();

  // Calculate if there are alerts to show badge
  const hasAlerts = !isLoading && (stats.lowStockCount > 0 || stats.expiringSoonCount > 0 || stats.expiredCount > 0);
  const alertCount = stats.lowStockCount + stats.expiringSoonCount + stats.expiredCount;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-primary text-primary-foreground">
        <div className="container flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <Anchor className="h-6 w-6" />
            <span className="font-semibold text-lg">SeaMed</span>
          </div>
          {hasAlerts && (
            <div className="flex items-center gap-1 text-sm bg-primary-foreground/20 px-3 py-1 rounded-full">
              <span className="h-2 w-2 rounded-full bg-warning animate-gentle-pulse" />
              <span>{alertCount} alert{alertCount !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <div className="flex items-center justify-around h-16">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center min-w-[64px] h-full px-3',
                  'transition-colors duration-200',
                  isActive
                    ? 'text-secondary'
                    : 'text-muted-foreground hover:text-foreground'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <Icon className={cn('h-6 w-6', isActive && 'scale-110')} />
                    {to === '/' && hasAlerts && (
                      <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-destructive" />
                    )}
                  </div>
                  <span className="text-xs mt-1 font-medium">{label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute bottom-0 h-0.5 w-12 bg-secondary rounded-full"
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Legal Disclaimer */}
      <div className="fixed bottom-20 left-0 right-0 pointer-events-none">
        <p className="text-center text-[10px] text-muted-foreground/50 px-4">
          Organizational tool only • Not medical advice
        </p>
      </div>
    </div>
  );
}
