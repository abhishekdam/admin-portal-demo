import { Router, Request, Response } from 'express';
import { Order } from '../models/Order.js';
import { emitEvent } from '../socket.js';

export const ordersRouter = Router();

// GET all orders
ordersRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch orders', error });
  }
});

// PATCH update order status
ordersRouter.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const senderSocketId = req.headers['x-socket-id'] as string;
    const allowed = ['Pending', 'Processing', 'Completed', 'Cancelled'];

    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid order status' });
    }

    const order = await Order.findByIdAndUpdate(id, { status }, { new: true });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    emitEvent('order:status_updated', order, senderSocketId);
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update order status', error });
  }
});
