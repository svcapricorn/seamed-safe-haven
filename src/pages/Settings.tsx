// SeaMed Tracker - Settings Page
// App settings and preferences

import React from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Bell, 
  Download, 
  FileText, 
  Shield, 
  Info,
  ChevronRight,
  Anchor,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useInventory } from '@/context/InventoryContext';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getFeatures, FEATURE_INFO } from '@/config/featureFlags';

export default function SettingsPage() {
  const { settings, exportToCSV, items, stats } = useInventory();
  const features = getFeatures(settings.subscriptionTier);

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

  const tierLabels = {
    free: 'Free',
    pro: 'Pro',
    fleet: 'Fleet',
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your preferences
        </p>
      </div>

      {/* Vessel Info */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-maritime p-4"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground">
            <Anchor className="h-7 w-7" />
          </div>
          <div className="flex-1">
            <h2 className="font-medium">
              {settings.vesselName || 'Your Vessel'}
            </h2>
            <p className="text-sm text-muted-foreground capitalize">
              {settings.userRole} • {stats.totalItems} items tracked
            </p>
          </div>
        </div>
      </motion.section>

      {/* Subscription Status */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="card-maritime p-4 border-2 border-secondary/30 bg-secondary/5"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-secondary" />
            <span className="font-medium">{tierLabels[settings.subscriptionTier]} Plan</span>
          </div>
          <Button variant="outline" size="sm" className="text-secondary border-secondary">
            Upgrade
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          {settings.subscriptionTier === 'free' 
            ? 'Upgrade to Pro for advanced features like PDF export and cloud sync.'
            : 'You have access to all features in this plan.'}
        </p>
      </motion.section>

      {/* Settings List */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-2"
      >
        <h2 className="font-semibold text-foreground px-1 mb-3">Data & Export</h2>
        
        <SettingsItem
          icon={<Download className="h-5 w-5" />}
          label="Export to CSV"
          description="Download your inventory as a spreadsheet"
          onClick={handleExport}
          disabled={items.length === 0}
        />
        
        <SettingsItem
          icon={<FileText className="h-5 w-5" />}
          label="Print Checklist"
          description="Generate a printable checklist"
          onClick={() => {
            toast({
              title: 'Coming soon',
              description: 'Printable checklists will be available in a future update.',
            });
          }}
          badge={!features.pdfExport ? 'Pro' : undefined}
        />
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="space-y-2"
      >
        <h2 className="font-semibold text-foreground px-1 mb-3">Notifications</h2>
        
        <SettingsItem
          icon={<Bell className="h-5 w-5" />}
          label="Alert Settings"
          description="Configure expiration and low-stock alerts"
          onClick={() => {
            toast({
              title: 'Coming soon',
              description: 'Custom alert settings will be available soon.',
            });
          }}
        />
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-2"
      >
        <h2 className="font-semibold text-foreground px-1 mb-3">About</h2>
        
        <SettingsItem
          icon={<Shield className="h-5 w-5" />}
          label="Privacy & Security"
          description="All data stored locally on your device"
          disabled
        />
        
        <SettingsItem
          icon={<Info className="h-5 w-5" />}
          label="About SeaMed Tracker"
          description="Version 1.0.0"
          disabled
        />
      </motion.section>

      {/* Disclaimer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="text-center py-6"
      >
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          SeaMed Tracker is an organizational tool only. It does not provide 
          medical advice, diagnosis, or treatment recommendations. Always 
          consult qualified medical professionals for health-related decisions.
        </p>
      </motion.div>
    </div>
  );
}

interface SettingsItemProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick?: () => void;
  disabled?: boolean;
  badge?: string;
}

function SettingsItem({ icon, label, description, onClick, disabled, badge }: SettingsItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'card-maritime w-full p-4 flex items-center gap-4 text-left',
        'transition-all duration-200',
        !disabled && 'hover:shadow-medium active:scale-[0.99]',
        disabled && 'opacity-70'
      )}
    >
      <div className="text-muted-foreground">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium">{label}</span>
          {badge && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
              {badge}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">{description}</p>
      </div>
      {!disabled && onClick && (
        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
      )}
    </button>
  );
}
