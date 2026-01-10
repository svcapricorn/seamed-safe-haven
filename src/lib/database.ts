// SeaMed Tracker - IndexedDB Database using Dexie
// Offline-first local storage

import Dexie, { type EntityTable } from 'dexie';
import type { InventoryItem, Alert, AppSettings } from '@/types';

// Database schema
interface SeaMedDB extends Dexie {
  inventory: EntityTable<InventoryItem, 'id'>;
  alerts: EntityTable<Alert, 'id'>;
  settings: EntityTable<AppSettings & { id: string }, 'id'>;
}

const db = new Dexie('SeaMedTracker') as SeaMedDB;

// Define tables and indexes
db.version(1).stores({
  inventory: 'id, name, category, expirationDate, location, barcode, updatedAt',
  alerts: 'id, itemId, type, severity, acknowledged, createdAt',
  settings: 'id',
});

export { db };

// Inventory operations
export const inventoryDB = {
  async getAll(): Promise<InventoryItem[]> {
    return db.inventory.toArray();
  },

  async getById(id: string): Promise<InventoryItem | undefined> {
    return db.inventory.get(id);
  },

  async getByBarcode(barcode: string): Promise<InventoryItem | undefined> {
    return db.inventory.where('barcode').equals(barcode).first();
  },

  async getByCategory(category: string): Promise<InventoryItem[]> {
    return db.inventory.where('category').equals(category).toArray();
  },

  async add(item: InventoryItem): Promise<string> {
    return db.inventory.add(item);
  },

  async update(id: string, changes: Partial<InventoryItem>): Promise<number> {
    return db.inventory.update(id, { ...changes, updatedAt: new Date().toISOString() });
  },

  async delete(id: string): Promise<void> {
    await db.inventory.delete(id);
    // Also delete related alerts
    await db.alerts.where('itemId').equals(id).delete();
  },

  async bulkAdd(items: InventoryItem[]): Promise<void> {
    await db.inventory.bulkAdd(items);
  },

  async clear(): Promise<void> {
    await db.inventory.clear();
    await db.alerts.clear();
  },

  // Get items expiring within N days
  async getExpiringSoon(days: number): Promise<InventoryItem[]> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    
    const items = await db.inventory
      .filter(item => {
        if (!item.expirationDate) return false;
        const expDate = new Date(item.expirationDate);
        return expDate > now && expDate <= futureDate;
      })
      .toArray();
    
    return items;
  },

  // Get expired items
  async getExpired(): Promise<InventoryItem[]> {
    const now = new Date().toISOString();
    
    return db.inventory
      .filter(item => {
        if (!item.expirationDate) return false;
        return item.expirationDate < now;
      })
      .toArray();
  },

  // Get low stock items
  async getLowStock(): Promise<InventoryItem[]> {
    return db.inventory
      .filter(item => item.quantity <= item.minQuantity)
      .toArray();
  },
};

// Alert operations
export const alertsDB = {
  async getAll(): Promise<Alert[]> {
    return db.alerts.orderBy('createdAt').reverse().toArray();
  },

  async getUnacknowledged(): Promise<Alert[]> {
    return db.alerts.where('acknowledged').equals(0).toArray();
  },

  async add(alert: Alert): Promise<string> {
    return db.alerts.add(alert);
  },

  async acknowledge(id: string): Promise<void> {
    await db.alerts.update(id, { acknowledged: true });
  },

  async delete(id: string): Promise<void> {
    await db.alerts.delete(id);
  },

  async clearOld(daysOld: number): Promise<void> {
    const cutoff = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString();
    await db.alerts.where('createdAt').below(cutoff).delete();
  },
};

// Settings operations
export const settingsDB = {
  async get(): Promise<AppSettings | undefined> {
    const settings = await db.settings.get('app-settings');
    if (settings) {
      const { id, ...rest } = settings;
      return rest as AppSettings;
    }
    return undefined;
  },

  async save(settings: AppSettings): Promise<void> {
    await db.settings.put({ ...settings, id: 'app-settings' });
  },

  getDefaults(): AppSettings {
    return {
      lowStockThreshold: 25,
      expirationWarningDays: [30, 60, 90],
      theme: 'system',
      userRole: 'captain',
      subscriptionTier: 'free',
    };
  },
};

// Export for debugging/development
export default db;
