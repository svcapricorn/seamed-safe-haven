// SeaMed Tracker - Item Form Component
// Add or edit inventory items

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Package, 
  Calendar, 
  MapPin, 
  Hash, 
  FileText,
  Scan,
  Save,
  Trash2,
  AlertCircle,
  Camera,
  QrCode
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInventory } from '@/context/InventoryContext';
import { CATEGORY_INFO, LOCATION_INFO, ItemCategory, StorageLocation, InventoryItem } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from '@/hooks/use-toast';
import { ObjectScanResult } from '@/components/scanner/ObjectScanner';

interface ItemFormProps {
  existingItem?: InventoryItem;
  onScanBarcodeRequest?: () => void;
  onScanObjectRequest?: () => void;
  scannedBarcode?: string;
  identifiedObject?: ObjectScanResult | null;
}

export function ItemForm({ existingItem, onScanBarcodeRequest, onScanObjectRequest, scannedBarcode, identifiedObject }: ItemFormProps) {
  const navigate = useNavigate();
  const { addItem, updateItem, deleteItem } = useInventory();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [formData, setFormData] = useState({
    name: existingItem?.name || '',
    category: existingItem?.category || 'first-aid' as ItemCategory,
    quantity: existingItem?.quantity?.toString() || '1',
    minQuantity: existingItem?.minQuantity?.toString() || '1',
    expirationDate: existingItem?.expirationDate?.split('T')[0] || '',
    location: existingItem?.location || 'main-cabin' as StorageLocation,
    barcode: existingItem?.barcode || scannedBarcode || '',
    notes: existingItem?.notes || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update barcode when scanned
  useEffect(() => {
    if (scannedBarcode) {
      setFormData(prev => ({ ...prev, barcode: scannedBarcode }));
    }
  }, [scannedBarcode]);

  // Update form when object is identified
  useEffect(() => {
    if (identifiedObject) {
      setFormData(prev => ({
        ...prev,
        name: identifiedObject.name,
        category: identifiedObject.category,
      }));
      toast({
        title: 'Item identified',
        description: `Recognized as "${identifiedObject.name}" (${Math.round(identifiedObject.confidence * 100)}% confidence)`,
      });
    }
  }, [identifiedObject]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Item name is required';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Name must be less than 100 characters';
    }

    const qty = parseInt(formData.quantity);
    if (isNaN(qty) || qty < 0) {
      newErrors.quantity = 'Quantity must be 0 or more';
    }

    const minQty = parseInt(formData.minQuantity);
    if (isNaN(minQty) || minQty < 0) {
      newErrors.minQuantity = 'Minimum quantity must be 0 or more';
    }

    if (formData.expirationDate) {
      const expDate = new Date(formData.expirationDate);
      if (isNaN(expDate.getTime())) {
        newErrors.expirationDate = 'Invalid date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const itemData = {
        name: formData.name.trim(),
        category: formData.category,
        quantity: parseInt(formData.quantity) || 0,
        minQuantity: parseInt(formData.minQuantity) || 1,
        expirationDate: formData.expirationDate || undefined,
        location: formData.location,
        barcode: formData.barcode.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      };

      if (existingItem) {
        await updateItem(existingItem.id, itemData);
        toast({
          title: 'Item updated',
          description: `${itemData.name} has been updated.`,
        });
      } else {
        await addItem(itemData);
        toast({
          title: 'Item added',
          description: `${itemData.name} has been added to your inventory.`,
        });
      }

      navigate('/inventory');
    } catch (err) {
      console.error('Failed to save item:', err);
      toast({
        title: 'Error',
        description: 'Failed to save item. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!existingItem) return;

    setIsSubmitting(true);
    try {
      await deleteItem(existingItem.id);
      toast({
        title: 'Item removed',
        description: `${existingItem.name} has been removed.`,
      });
      navigate('/inventory');
    } catch (err) {
      console.error('Failed to delete item:', err);
      toast({
        title: 'Error',
        description: 'Failed to remove item. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Scan Options */}
      <div className="card-maritime p-4 space-y-3">
        <p className="text-sm text-muted-foreground font-medium">Quick Add Options</p>
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onScanObjectRequest}
            className="h-16 flex-col gap-1 border-dashed border-2"
          >
            <Camera className="h-5 w-5" />
            <span className="text-xs">Identify Item</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onScanBarcodeRequest}
            className="h-16 flex-col gap-1 border-dashed border-2"
          >
            <QrCode className="h-5 w-5" />
            <span className="text-xs">Scan Barcode</span>
          </Button>
        </div>
        {formData.barcode && (
          <p className="text-xs text-muted-foreground text-center">
            Barcode: {formData.barcode}
          </p>
        )}
      </div>

      {/* Main Form */}
      <div className="card-maritime p-4 space-y-4">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Item Name *
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Bandages, Ibuprofen, Thermometer"
            className={cn('h-12', errors.name && 'border-destructive')}
          />
          {errors.name && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.name}
            </p>
          )}
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value as ItemCategory })}
          >
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CATEGORY_INFO).map(([key, info]) => (
                <SelectItem key={key} value={key}>
                  {info.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quantity Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="quantity" className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Quantity
            </Label>
            <Input
              id="quantity"
              type="number"
              min="0"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              className={cn('h-12', errors.quantity && 'border-destructive')}
            />
            {errors.quantity && (
              <p className="text-xs text-destructive">{errors.quantity}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="minQuantity">Min. Stock</Label>
            <Input
              id="minQuantity"
              type="number"
              min="0"
              value={formData.minQuantity}
              onChange={(e) => setFormData({ ...formData, minQuantity: e.target.value })}
              className={cn('h-12', errors.minQuantity && 'border-destructive')}
            />
            {errors.minQuantity && (
              <p className="text-xs text-destructive">{errors.minQuantity}</p>
            )}
          </div>
        </div>

        {/* Expiration Date */}
        <div className="space-y-2">
          <Label htmlFor="expirationDate" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Expiration Date
          </Label>
          <Input
            id="expirationDate"
            type="date"
            value={formData.expirationDate}
            onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
            className={cn('h-12', errors.expirationDate && 'border-destructive')}
          />
          {errors.expirationDate && (
            <p className="text-xs text-destructive">{errors.expirationDate}</p>
          )}
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="location" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Storage Location
          </Label>
          <Select
            value={formData.location}
            onValueChange={(value) => setFormData({ ...formData, location: value as StorageLocation })}
          >
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(LOCATION_INFO).map(([key, info]) => (
                <SelectItem key={key} value={key}>
                  {info.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Notes (Optional)
          </Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Any additional notes..."
            rows={3}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {existingItem && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowDeleteConfirm(true)}
            className="flex-1 h-12 text-destructive hover:text-destructive hover:bg-destructive/10"
            disabled={isSubmitting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Remove
          </Button>
        )}
        <Button
          type="submit"
          className="flex-1 h-12 bg-secondary text-secondary-foreground hover:bg-secondary/90"
          disabled={isSubmitting}
        >
          <Save className="h-4 w-4 mr-2" />
          {isSubmitting ? 'Saving...' : existingItem ? 'Update Item' : 'Add Item'}
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="card-maritime p-6 max-w-sm w-full space-y-4"
          >
            <h3 className="font-semibold text-lg">Remove this item?</h3>
            <p className="text-muted-foreground">
              "{existingItem?.name}" will be permanently removed from your inventory.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleDelete}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Removing...' : 'Remove'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.form>
  );
}
