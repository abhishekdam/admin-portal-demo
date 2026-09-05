import mongoose from 'mongoose';
import { Product } from './models/Product.js';
import { Order } from './models/Order.js';
import { Task } from './models/Task.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/admin-portal';

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB. Seeding database...');

    // Clear existing collections
    await Product.deleteMany({});
    await Order.deleteMany({});
    await Task.deleteMany({});

    // Demo Products
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
        lowStockThreshold: 6, // Low stock demo
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
        lowStockThreshold: 15, // Low stock demo
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

    // Demo Orders
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

    // Demo Tasks
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

    console.log('Database seeded successfully with starter data.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seed();
