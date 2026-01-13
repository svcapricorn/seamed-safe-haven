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
  QrCode,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInventory } from '@/context/InventoryContext';
import { CATEGORY_INFO, LOCATION_INFO, ItemCategory, StorageLocation, InventoryItem } from '@/types';
import { 
  TextField, 
  Button, 
  MenuItem, 
  Paper, 
  Typography,
  InputAdornment,
  Grid,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress
} from '@mui/material';
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
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // ... (rest of the component logic remains similar, just the render changes)
  const [formData, setFormData] = useState({
    name: existingItem?.name || '',
    category: existingItem?.category || 'first-aid' as ItemCategory,
    quantity: existingItem?.quantity?.toString() || '1',
    minQuantity: existingItem?.minQuantity?.toString() || '1',
    expirationDate: existingItem?.expirationDate?.split('T')[0] || '',
    location: existingItem?.location || 'galley' as StorageLocation,
    barcode: existingItem?.barcode || scannedBarcode || '',
    remaining: existingItem?.remaining || '',
    notes: existingItem?.notes || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update barcode when scanned and lookup product
  useEffect(() => {
    if (scannedBarcode) {
      setFormData(prev => ({ ...prev, barcode: scannedBarcode }));
      
      const fetchProductData = async () => {
        setIsLookingUp(true);
        try {
          // OpenFoodFacts API (Free, no key required)
          const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${scannedBarcode}.json`);
          const data = await response.json();
          
          if (data.status === 1 && data.product) {
            const productName = data.product.product_name || data.product.generic_name;
            if (productName) {
               setFormData(prev => ({ ...prev, name: productName }));
               toast({
                 title: "Product Found",
                 description: `Identified as: ${productName}`,
               });
            }
          }
        } catch (error) {
          console.error("Barcode lookup failed", error);
        } finally {
          setIsLookingUp(false);
        }
      };
      
      fetchProductData();
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
        remaining: formData.remaining.trim() || undefined,
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
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Scan Options */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>Quick Add Options</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={onScanObjectRequest}
            sx={{ height: 64, flexDirection: 'column', gap: 1 }}
          >
            <Camera size={20} />
            <Typography variant="caption">Identify Item</Typography>
          </Button>
          <Button
            variant="outlined"
            onClick={onScanBarcodeRequest}
            sx={{ height: 64, flexDirection: 'column', gap: 1 }}
          >
            <QrCode size={20} />
            <Typography variant="caption">Scan Barcode</Typography>
          </Button>
        </Box>
        {formData.barcode && (
           <Typography variant="caption" color="text.secondary" align="center" display="block" sx={{ mt: 1 }}>
            Barcode: {formData.barcode}
           </Typography>
        )}
      </Paper>

      {/* Main Form */}
      <Paper variant="outlined" sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Name */}
        <TextField
          id="name"
          label="Item Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Bandages, Ibuprofen"
          fullWidth
          required
          error={!!errors.name}
          helperText={errors.name}
          InputProps={{
             startAdornment: <InputAdornment position="start"><Package size={18} /></InputAdornment>,
             endAdornment: isLookingUp ? <InputAdornment position="end"><CircularProgress size={18} /></InputAdornment> : null
          }}
        />

        {/* Category */}
        <TextField
          select
          label="Category"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value as ItemCategory })}
          fullWidth
        >
          {Object.entries(CATEGORY_INFO).map(([key, info]) => (
            <MenuItem key={key} value={key}>
              {info.label}
            </MenuItem>
          ))}
        </TextField>

        {/* Quantity Row */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              id="quantity"
              label="Quantity"
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              error={!!errors.quantity}
              helperText={errors.quantity}
              InputProps={{
                 startAdornment: <InputAdornment position="start"><Hash size={18} /></InputAdornment>,
              }}
            />
            <TextField
              id="minQuantity"
              label="Min. Stock"
              type="number"
              value={formData.minQuantity}
              onChange={(e) => setFormData({ ...formData, minQuantity: e.target.value })}
              error={!!errors.minQuantity}
              helperText={errors.minQuantity}
            />
        </Box>

        {/* Remaining in Open Unit */}
        <TextField
            id="remaining"
            label="Amount Left (e.g. 50%, ~10 pills)"
            value={formData.remaining}
            onChange={(e) => setFormData({ ...formData, remaining: e.target.value })}
            fullWidth
            helperText="Track usage of the current open unit"
        />

        {/* Expiration Date */}
        <TextField
            id="expirationDate"
            label="Expiration Date"
            type="date"
            fullWidth
            value={formData.expirationDate}
            onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
            error={!!errors.expirationDate}
            helperText={errors.expirationDate}
            InputLabelProps={{ shrink: true }}
            InputProps={{
                 startAdornment: <InputAdornment position="start"><Calendar size={18} /></InputAdornment>,
            }}
        />

        {/* Location */}
        <TextField
          select
          label="Storage Location"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value as StorageLocation })}
          fullWidth
          InputProps={{
             startAdornment: <InputAdornment position="start"><MapPin size={18} /></InputAdornment>,
          }}
        >
          {Object.entries(LOCATION_INFO).map(([key, info]) => (
            <MenuItem key={key} value={key}>
              {info.label}
            </MenuItem>
          ))}
        </TextField>

        {/* Notes */}
        <TextField
            id="notes"
            label="Notes (Optional)"
            multiline
            rows={3}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            fullWidth
             InputProps={{
                 startAdornment: <InputAdornment position="start" sx={{alignSelf: 'flex-start', mt: 1}}><FileText size={18} /></InputAdornment>,
            }}
        />
      </Paper>

      {/* Actions */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => navigate(-1)}
            fullWidth
            disabled={isSubmitting}
            sx={{ height: 48 }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="secondary"
            fullWidth
            disabled={isSubmitting}
            startIcon={<Save />}
            sx={{ height: 48 }}
          >
            {isSubmitting ? 'Saving...' : existingItem ? 'Update Item' : 'Add Item'}
          </Button>
        </Box>

        {existingItem && (
          <Button
            variant="text"
            color="error"
            onClick={() => setShowDeleteConfirm(true)}
            fullWidth
            startIcon={<Trash2 />}
            disabled={isSubmitting}
          >
            Remove Item
          </Button>
        )}
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
      >
        <DialogTitle>Remove this item?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            "{existingItem?.name}" will be permanently removed from your inventory.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteConfirm(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" autoFocus disabled={isSubmitting}>
            {isSubmitting ? 'Removing...' : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
