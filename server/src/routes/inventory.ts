import { Router, Response, Request } from 'express';
import { PrismaClient } from '@prisma/client';
import { CustomRequest, verifyToken } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = Router();
// const prisma = new PrismaClient(); // Removed local instance

// Apply auth middleware to all inventory routes
router.use(verifyToken);

// Simple ping to verify auth handles correctly without DB
router.get('/ping', (req, res) => {
  const userId = (req as unknown as CustomRequest).userId;
  res.json({ status: 'ok', userId });
});

// Helper for safe parsing
const safeParse = (str: string | null | undefined): string[] => {
  if (!str) return [];
  if (str === '[]') return [];
  try {
    const parsed = JSON.parse(str);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

// GET all items for the logged-in user
router.get('/', async (req: Request, res: Response) => {
  const customReq = req as unknown as CustomRequest;
  try {
    const items = await prisma.inventoryItem.findMany({
      where: { userId: customReq.userId }
    });
    // Parse photos JSON string to array for frontend
    const parsedItems = items.map(item => ({
      ...item,
      photos: safeParse(item.photos)
    }));
    res.json(parsedItems);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// POST create new item
router.post('/', async (req: Request, res: Response) => {
  const customReq = req as unknown as CustomRequest;
  try {
    const { photos, ...rest } = req.body;
    const newItem = await prisma.inventoryItem.create({
      data: {
        ...rest,
        userId: customReq.userId!,
        photos: JSON.stringify(photos || []),
        // Ensure dates are parsed correctly if sent as strings
        expirationDate: req.body.expirationDate ? new Date(req.body.expirationDate) : null
      }
    });
    
    const responseItem = {
      ...newItem,
      photos: safeParse(newItem.photos)
    };
    
    res.status(201).json(responseItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// PUT update item
router.put('/:id', async (req: Request, res: Response) => {
  const customReq = req as unknown as CustomRequest;
  const { id } = req.params;
  
  if (!id || typeof id !== 'string') {
    res.status(400).json({ error: 'Invalid ID' });
    return;
  }

  try {
    // Ensure user owns the item before updating
    const existing = await prisma.inventoryItem.findUnique({ where: { id } });
    
    if (!existing || existing.userId !== customReq.userId) {
       res.status(403).json({ error: 'Not authorized' });
       return;
    }

    const { id: _, userId: __, createdAt: ___, updatedAt: ____, photos, ...updateData } = req.body;

    const updated = await prisma.inventoryItem.update({
      where: { id },
      data: {
        ...updateData,
        photos: photos ? JSON.stringify(photos) : undefined,
        expirationDate: req.body.expirationDate ? new Date(req.body.expirationDate) : null
      }
    });

    res.json({
        ...updated,
        photos: safeParse(updated.photos)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// DELETE item
router.delete('/:id', async (req: Request, res: Response) => {
  const customReq = req as unknown as CustomRequest;
  const { id } = req.params;
  
  if (!id || typeof id !== 'string') {
    res.status(400).json({ error: 'Invalid ID' });
    return;
  }

  try {
    const existing = await prisma.inventoryItem.findUnique({ where: { id } });
    
    if (!existing || existing.userId !== customReq.userId) {
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
