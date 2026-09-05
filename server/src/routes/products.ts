import { Router, Request, Response } from 'express';
import { Product } from '../models/Product.js';
import { emitEvent } from '../socket.js';

export const productsRouter = Router();

// GET all products
productsRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch products', error });
  }
});

// POST create new product
productsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { sku, name, category, price, stockQuantity, lowStockThreshold } = req.body;
    const senderSocketId = req.headers['x-socket-id'] as string;
    
    if (!sku || !name || !category || price === undefined) {
      return res.status(400).json({ message: 'Missing required product fields' });
    }

    const newProduct = new Product({
      sku,
      name,
      category,
      price: Number(price),
      stockQuantity: Number(stockQuantity) || 0,
      lowStockThreshold: Number(lowStockThreshold) || 5,
    });

    const saved = await newProduct.save();
    emitEvent('product:created', saved, senderSocketId);
    res.status(201).json(saved);
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Product SKU already exists' });
    }
    res.status(500).json({ message: 'Failed to create product', error });
  }
});

// PATCH update product fields
productsRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { sku, name, category, price, stockQuantity, lowStockThreshold } = req.body;
    const senderSocketId = req.headers['x-socket-id'] as string;

    const updateData: Record<string, any> = {};
    if (sku !== undefined) updateData.sku = sku.trim();
    if (name !== undefined) updateData.name = name.trim();
    if (category !== undefined) updateData.category = category.trim();
    if (price !== undefined) updateData.price = Number(price);
    if (stockQuantity !== undefined) updateData.stockQuantity = Math.max(0, Number(stockQuantity));
    if (lowStockThreshold !== undefined) updateData.lowStockThreshold = Math.max(0, Number(lowStockThreshold));

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    emitEvent('product:updated', updatedProduct, senderSocketId);
    res.json(updatedProduct);
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Product SKU already exists' });
    }
    res.status(500).json({ message: 'Failed to update product', error });
  }
});

// DELETE soft delete product
productsRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const senderSocketId = req.headers['x-socket-id'] as string;
    const product = await Product.findByIdAndUpdate(
      id,
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    emitEvent('product:deleted', product, senderSocketId);
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete product', error });
  }
});

// PATCH restore soft-deleted product
productsRouter.patch('/:id/restore', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const senderSocketId = req.headers['x-socket-id'] as string;
    const product = await Product.findByIdAndUpdate(
      id,
      { isDeleted: false, deletedAt: null },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    emitEvent('product:restored', product, senderSocketId);
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Failed to restore product', error });
  }
});

// PATCH quick stock adjust using atomic $inc to guarantee concurrency safety
productsRouter.patch('/:id/stock', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const delta = Number(req.body.delta ?? req.query.delta);
    const senderSocketId = req.headers['x-socket-id'] as string;

    if (isNaN(delta)) {
      return res.status(400).json({ message: 'Valid stock adjustment delta required' });
    }

    const filter: any = { _id: id };
    if (delta < 0) {
      filter.stockQuantity = { $gte: Math.abs(delta) };
    }

    let product = await Product.findOneAndUpdate(
      filter,
      { $inc: { stockQuantity: delta } },
      { new: true }
    );

    if (!product) {
      const exists = await Product.findById(id);
      if (!exists) {
        return res.status(404).json({ message: 'Product not found' });
      }
      return res.status(400).json({ message: 'Stock cannot be reduced below 0', product: exists });
    }

    emitEvent('product:stock_adjusted', { product, delta }, senderSocketId);
    emitEvent('product:updated', product, senderSocketId);
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Failed to adjust stock', error });
  }
});
