# Admin Portal - Frontend Application

A responsive, lightweight Single Page Application (SPA) built with React 18, TypeScript, Vite, Tailwind CSS, and Socket.IO for the internal Admin Portal operations dashboard.

---

## Table of Contents
- [Architecture & Tech Stack](#architecture--tech-stack)
- [Multi-Location Real-Time Sync (Socket.IO)](#multi-location-real-time-sync-socketio)
- [Project Structure](#project-structure)
- [Features & Views](#features--views)
- [Component Breakdown & Modals](#component-breakdown--modals)
- [API Client & Socket Helpers](#api-client--socket-helpers)
- [TypeScript Types](#typescript-types)
- [Development & Build Commands](#development--build-commands)

---

## Architecture & Tech Stack

- **React 18** with functional components and native hooks (`useState`, `useEffect`, `useRef`).
- **Socket.IO Client 4.x** for instantaneous, bi-directional real-time data sync with other active terminals.
- **Vite 5** for fast HMR and optimized production bundles.
- **Tailwind CSS 3** for minimal, utility-first styling.
- **Lucide React** for iconography (`Package`, `ShoppingCart`, `CheckSquare`, `Plus`, `Minus`, `Pencil`, `Trash2`, `RotateCcw`, `Archive`, `AlertTriangle`, `Zap`).
- **Non-Destructive Soft Delete Pattern**: Both inventory items and tasks support soft-delete with dedicated archived views and one-click restoration.
- **Type-Safe API Layer**: Centralized API utility with standardized error handling and REST methods.

---

## Multi-Location Real-Time Sync (Socket.IO)

When staff across different locations (warehouse, fulfillment, management) have the portal open simultaneously:
1. **Live Connection Indicator in Header**:
   - Displays a pulsing green badge (`● Live Synced`) when connected.
   - Automatically switches to an amber badge (`○ Reconnecting...`) if the connection is interrupted and retries reconnecting in the background.
2. **Subtle Sync Toast Notifications**:
   - A floating toast in the bottom-right corner alerts staff when another location updates stock, reassigns tasks, changes order statuses, or archives items.
3. **Zero-Refresh State Sync**:
   - Changes made by other users reflect immediately in the live tables and counter badges without page reloads.

---

## Project Structure

```text
client/
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── App.tsx                     # Main layout, tab navigation, Socket.IO sync & toasts
    ├── index.css                   # Tailwind CSS imports & global resets
    ├── main.tsx                    # React DOM root mounting entrypoint
    ├── api/
    │   ├── client.ts               # Type-safe REST API helper
    │   └── socket.ts               # Socket.IO client connection instance
    ├── components/
    │   ├── AddProductModal.tsx     # Modal form for registering new products
    │   ├── EditProductModal.tsx    # Modal form for updating product fields
    │   ├── EditTaskModal.tsx       # Modal form for editing operational tasks
    │   ├── InventoryView.tsx       # Stock table, threshold alerts, edit, delete & archive
    │   ├── OrdersView.tsx          # Orders table with status transition dropdowns
    │   └── TasksView.tsx           # Task queue, assignment, edit, delete & archive
    └── types/
        └── index.ts                # Shared TypeScript models and enums
```

---

## Features & Views

### 1. Unified Dashboard Navigation (`App.tsx`)
- Navigation tab bar with dynamic counter badges:
  - **Inventory**: Live count of active non-deleted products.
  - **Orders**: Active orders count.
  - **Tasks**: Count of pending non-deleted tasks.
- Concurrent initial data hydration via `Promise.all([api.getProducts(), api.getOrders(), api.getTasks()])`.
- Real-time event listeners for product, order, and task modifications.

---

### 2. Inventory Management View (`InventoryView.tsx`)
- **Active vs. Deleted Sub-Tabs**:
  - `Active (N)`: Live catalog view.
  - `Deleted (N)`: Soft-deleted items archive with an archived badge.
- **Stock Threshold Alert**: Automatic amber badge when `stockQuantity <= lowStockThreshold`.
- **Quick Stock Counter**: Inline `+` and `-` buttons for instant stock updates (backed by atomic database increments).
- **Edit Product**: Clicking the pencil icon opens `EditProductModal` with pre-filled fields.
- **Soft Delete**: Clicking the trash icon moves the product into the Deleted Items archive.
- **Restore**: In the Deleted view, clicking the "Restore" button instantly reactivates the product back into the live inventory.

---

### 3. Modals for Products
- **`AddProductModal.tsx`**: Creates a new product with input validation and instant list refresh.
- **`EditProductModal.tsx`**: Updates an existing item's fields via `PATCH /api/products/:id`.

---

### 4. Orders Fulfillment View (`OrdersView.tsx`)
- Displays customer names, order numbers, purchased items, and total amounts.
- **Interactive Status Select**: Color-coded badges for order progression:
  - `Pending` (Amber)
  - `Processing` (Blue)
  - `Completed` (Emerald)
  - `Cancelled` (Slate)
- Instant state updates sent via `PATCH /api/orders/:id/status` and broadcasted via Socket.IO.

---

### 5. Staff Tasks & Operations View (`TasksView.tsx`)
- **Active vs. Deleted Sub-Tabs**:
  - `Active (N)`: Current operational tasks queue.
  - `Deleted (N)`: Soft-deleted tasks archive.
- **Task Card Interactions**:
  - Checkbox click: Toggles between `Pending` and `Completed` (with strikethrough styling).
  - Edit button: Opens `EditTaskModal` to update title, description, assignee, priority, or status.
  - Trash button: Soft-deletes the task without deleting permanently.
  - Restore button: Located in the Deleted archive to reactivate the task.
- **Right Column**: Quick task assignment form with priority setting (`Low`, `Medium`, `High`).

---

## API Client & Socket Helpers

### REST API Helper (`src/api/client.ts`)
```typescript
export const api = {
  // Products
  getProducts: () => Promise<IProduct[]>
  createProduct: (data: Omit<IProduct, '_id'>) => Promise<IProduct>
  updateProduct: (id: string, data: Partial<IProduct>) => Promise<IProduct>
  deleteProduct: (id: string) => Promise<IProduct>
  restoreProduct: (id: string) => Promise<IProduct>
  adjustStock: (id: string, delta: number) => Promise<IProduct>

  // Orders
  getOrders: () => Promise<IOrder[]>
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<IOrder>

  // Tasks
  getTasks: () => Promise<ITask[]>
  createTask: (data: Partial<ITask>) => Promise<ITask>
  updateTask: (id: string, data: Partial<ITask>) => Promise<ITask>
  deleteTask: (id: string) => Promise<ITask>
  restoreTask: (id: string) => Promise<ITask>
  updateTaskStatus: (id: string, status: TaskStatus) => Promise<ITask>
}
```

### Socket.IO Client (`src/api/socket.ts`)
```typescript
import { io, Socket } from 'socket.io-client';

export const socket: Socket = io('http://localhost:5001', {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
});
```

---

## TypeScript Types (`src/types/index.ts`)

```typescript
export interface IProduct {
  _id?: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  stockQuantity: number;
  lowStockThreshold: number;
  isDeleted?: boolean;
  deletedAt?: string | null;
}

export type OrderStatus = 'Pending' | 'Processing' | 'Completed' | 'Cancelled';

export interface IOrderItem {
  productName: string;
  quantity: number;
  price: number;
}

export interface IOrder {
  _id?: string;
  orderNumber: string;
  customerName: string;
  items: IOrderItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt?: string;
}

export type TaskPriority = 'Low' | 'Medium' | 'High';
export type TaskStatus = 'Pending' | 'Completed';

export interface ITask {
  _id?: string;
  title: string;
  description?: string;
  assignedTo: string;
  priority: TaskPriority;
  status: TaskStatus;
  isDeleted?: boolean;
  deletedAt?: string | null;
  createdAt?: string;
}
```

---

## Development & Build Commands

```bash
# Install dependencies
npm install

# Start Vite development server (http://localhost:5173)
npm run dev

# Type check & build for production
npm run build

# Preview production build locally
npm run preview
```
