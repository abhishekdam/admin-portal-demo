import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { productsRouter } from './routes/products.js';
import { ordersRouter } from './routes/orders.js';
import { tasksRouter } from './routes/tasks.js';
import { Product } from './models/Product.js';
import { Order } from './models/Order.js';
import { Task } from './models/Task.js';

const app = express();
const PORT = process.env.PORT || 5001;
let MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/admin-portal';

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/tasks', tasksRouter);

async function seedData() {
  const count = await Product.countDocuments();
  if (count === 0) {
    console.log('Seeding initial demo data...');
    await Product.insertMany([
      {
        sku: 'KB-MEC-01',
        name: 'Wireless Mechanical Keyboard',
        category: 'Electronics',
        price: 89.99,
        stockQuantity: 18,
        lowStockThreshold: 5,
      },
      {
        sku: 'MS-ERG-02',
        name: 'Ergonomic Optical Mouse',
        category: 'Electronics',
        price: 34.50,
        stockQuantity: 3,
        lowStockThreshold: 6,
      },
      {
        sku: 'DK-MAT-03',
        name: 'Large Desk Pad (Wool Felt)',
        category: 'Accessories',
        price: 24.00,
        stockQuantity: 42,
        lowStockThreshold: 10,
      },
      {
        sku: 'CB-USC-04',
        name: 'Braided USB-C Cable (2m)',
        category: 'Accessories',
        price: 12.99,
        stockQuantity: 4,
        lowStockThreshold: 15,
      },
      {
        sku: 'HD-STN-05',
        name: 'Aluminum Headphone Stand',
        category: 'Office',
        price: 29.99,
        stockQuantity: 12,
        lowStockThreshold: 5,
      },
    ]);

    await Order.insertMany([
      {
        orderNumber: 'ORD-1001',
        customerName: 'Sarah Connor',
        items: [{ productName: 'Wireless Mechanical Keyboard', quantity: 1, price: 89.99 }],
        totalAmount: 89.99,
        status: 'Processing',
      },
      {
        orderNumber: 'ORD-1002',
        customerName: 'John Doe',
        items: [
          { productName: 'Ergonomic Optical Mouse', quantity: 1, price: 34.50 },
          { productName: 'Braided USB-C Cable (2m)', quantity: 2, price: 12.99 },
        ],
        totalAmount: 60.48,
        status: 'Pending',
      },
    ]);

    await Task.insertMany([
      {
        title: 'Pick & Pack Order #ORD-1001',
        description: 'Priority shipping request from customer',
        assignedTo: 'Alex M.',
        priority: 'High',
        status: 'Pending',
      },
      {
        title: 'Restock Shelf B (USB-C Cables)',
        description: 'Incoming batch from supplier arriving today',
        assignedTo: 'Sam K.',
        priority: 'Medium',
        status: 'Pending',
      },
    ]);
    console.log('Demo data seeded successfully.');
  }
}

async function startServer() {
  try {
    try {
      await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 2000 });
      console.log('Connected to local MongoDB');
    } catch {
      console.log('Local MongoDB not found. Starting embedded MongoDB server...');
      const mongod = await MongoMemoryServer.create();
      MONGODB_URI = mongod.getUri();
      await mongoose.connect(MONGODB_URI);
      console.log(`Connected to Embedded MongoDB at ${MONGODB_URI}`);
    }

    await seedData();

    app.listen(PORT, () => {
      console.log(`Server listening at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
  }
}

startServer();

