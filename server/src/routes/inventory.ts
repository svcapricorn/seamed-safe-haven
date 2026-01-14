import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { CustomRequest, verifyToken } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// Apply auth middleware to all inventory routes
router.use(verifyToken);

// GET all items for the logged-in user
router.get('/', async (req: CustomRequest, res: Response) => {
  try {
    const items = await prisma.inventoryItem.findMany({
      where: { userId: req.userId }
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// POST create new item
router.post('/', async (req: CustomRequest, res: Response) => {
  try {
    const newItem = await prisma.inventoryItem.create({
      data: {
        ...req.body,
        userId: req.userId!,
        // Ensure dates are parsed correctly if sent as strings
        expirationDate: req.body.expirationDate ? new Date(req.body.expirationDate) : null
      }
    });
    res.status(201).json(newItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// PUT update item
router.put('/:id', async (req: CustomRequest, res: Response) => {
  const { id } = req.params;
  try {
    // Ensure user owns the item before updating
    const existing = await prisma.inventoryItem.findUnique({ where: { id } });
    
    if (!existing || existing.userId !== req.userId) {
       res.status(403).json({ error: 'Not authorized' });
       return;
    }

    const { id: _, userId: __, createdAt: ___, updatedAt: ____, ...updateData } = req.body;

    const updated = await prisma.inventoryItem.update({
      where: { id },
      data: {
        ...updateData,
        expirationDate: req.body.expirationDate ? new Date(req.body.expirationDate) : null
      }
    });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// DELETE item
router.delete('/:id', async (req: CustomRequest, res: Response) => {
  const { id } = req.params;
  try {
    const existing = await prisma.inventoryItem.findUnique({ where: { id } });
    
    if (!existing || existing.userId !== req.userId) {
       res.status(403).json({ error: 'Not authorized' });
       return;
    }

    await prisma.inventoryItem.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

export default router;
