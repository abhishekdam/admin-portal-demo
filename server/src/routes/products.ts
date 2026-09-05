import { Router, Request, Response } from 'express';
import { Product } from '../models/Product.js';

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
    const product = await Product.findByIdAndUpdate(
      id,
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete product', error });
  }
});

// PATCH restore soft-deleted product
productsRouter.patch('/:id/restore', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndUpdate(
      id,
      { isDeleted: false, deletedAt: null },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Failed to restore product', error });
  }
});

// PATCH quick stock adjust
productsRouter.patch('/:id/stock', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const delta = Number(req.body.delta ?? req.query.delta);

    if (isNaN(delta)) {
      return res.status(400).json({ message: 'Valid stock adjustment delta required' });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.stockQuantity = Math.max(0, product.stockQuantity + delta);
    await product.save();

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Failed to adjust stock', error });
  }
});
