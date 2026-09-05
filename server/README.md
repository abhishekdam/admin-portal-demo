# Admin Portal - Backend Service

A lightweight, robust REST API built with Node.js, Express, TypeScript, and Mongoose for the internal Admin Portal operations dashboard.

---

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Key Features](#key-features)
- [Database Models & Schemas](#database-models--schemas)
- [API Endpoints Reference](#api-endpoints-reference)
- [Core Logic & Functions](#core-logic--functions)
- [Environment & Running](#environment--running)

---

## Architecture Overview

The backend is built following clean, pragmatic RESTful principles:
- **Express 4.x** with TypeScript for routing, JSON serialization, and middleware.
- **Mongoose 8.x** with strong TypeScript interfaces.
- **Embedded MongoDB Auto-Fallback**: Automatically uses `mongodb-memory-server` if an external MongoDB instance is not detected, enabling instant plug-and-play development without local database setup friction.
- **Soft Delete Architecture**: Products and Tasks implement a non-destructive delete pattern with `isDeleted: boolean` and `deletedAt: Date`. Records are moved to an archived state rather than dropped from the database, allowing full auditability and one-click restoration.

---

## Project Structure

```text
server/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts              # Express application entrypoint & DB lifecycle
    ├── seed.ts               # Standalone database seed script
    ├── models/               # Mongoose schema definitions & interfaces
    │   ├── Order.ts          # Customer order schema
    │   ├── Product.ts        # Inventory item schema (with soft delete support)
    │   └── Task.ts           # Staff operational task schema (with soft delete support)
    └── routes/               # API route handlers
        ├── orders.ts         # Orders endpoints
        ├── products.ts       # Products endpoints (CRUD, stock adjustments, restore)
        └── tasks.ts          # Operational tasks endpoints (CRUD, status, restore)
```

---

## Key Features

1. **Inventory Management**:
   - Product catalog retrieval with automatic sorting.
   - New product registration with unique SKU validation.
   - Field editing (SKU, name, category, price, stock quantity, low stock threshold).
   - Atomically bounded stock level adjustment (`stockQuantity` clamped at 0).
   - Non-destructive soft deletion (`isDeleted = true`) and restoration (`isDeleted = false`).

2. **Order Lifecycle Tracking**:
   - Order retrieval with nested item listings.
   - Real-time status transitions (`Pending` ➔ `Processing` ➔ `Completed` / `Cancelled`).

3. **Operational Task Assignment**:
   - Create warehouse and fulfillment tasks assigned to specific staff members.
   - Edit task details (title, description, assignee, priority, status).
   - Task prioritization (`Low`, `Medium`, `High`).
   - One-click completion status toggling.
   - Soft deletion and restoration to the active tasks queue.

4. **Self-Healing & Auto-Seeding**:
   - Automatic demo data initialization when empty.

---

## Database Models & Schemas

### 1. `Product` (`src/models/Product.ts`)
| Field | Type | Description |
| :--- | :--- | :--- |
| `sku` | `String` (Unique, Required) | Stock Keeping Unit code (e.g., `KB-MEC-01`) |
| `name` | `String` (Required) | Product display name |
| `category` | `String` (Required) | Department or category |
| `price` | `Number` (Required, min: 0) | Unit retail price in USD |
| `stockQuantity` | `Number` (Default: 0) | Live on-hand quantity |
| `lowStockThreshold` | `Number` (Default: 5) | Quantity trigger for low-stock warning |
| `isDeleted` | `Boolean` (Default: false) | Soft delete flag |
| `deletedAt` | `Date` (Default: null) | Timestamp when item was soft deleted |

### 2. `Order` (`src/models/Order.ts`)
| Field | Type | Description |
| :--- | :--- | :--- |
| `orderNumber` | `String` (Unique, Required) | Human-readable identifier (e.g., `ORD-1001`) |
| `customerName` | `String` (Required) | Customer full name |
| `items` | `Array<OrderItem>` | Sub-documents: `{ productName, quantity, price }` |
| `totalAmount` | `Number` (Required) | Computed order grand total |
| `status` | `String` (Enum) | `Pending` \| `Processing` \| `Completed` \| `Cancelled` |

### 3. `Task` (`src/models/Task.ts`)
| Field | Type | Description |
| :--- | :--- | :--- |
| `title` | `String` (Required) | Brief task summary |
| `description` | `String` (Optional) | Detailed operational notes |
| `assignedTo` | `String` (Required) | Assigned staff member name |
| `priority` | `String` (Enum) | `Low` \| `Medium` \| `High` |
| `status` | `String` (Enum) | `Pending` \| `Completed` |
| `isDeleted` | `Boolean` (Default: false) | Soft delete flag |
| `deletedAt` | `Date` (Default: null) | Timestamp when task was soft deleted |

---

## API Endpoints Reference

### Products (`/api/products`)

- **`GET /api/products`**
  - **Description**: Returns all inventory items sorted newest first (including soft-delete status).
  - **Response**: `200 OK` with `Array<IProduct>`.

- **`POST /api/products`**
  - **Description**: Creates a new product item.
  - **Body**:
    ```json
    {
      "sku": "DK-PAD-09",
      "name": "Leather Desk Mat",
      "category": "Accessories",
      "price": 39.99,
      "stockQuantity": 15,
      "lowStockThreshold": 5
    }
    ```
  - **Response**: `201 Created` or `409 Conflict` (if duplicate SKU).

- **`PATCH /api/products/:id`**
  - **Description**: Updates specific fields of an existing product (name, SKU, price, stock, category, threshold).
  - **Body**: Partial product payload.
  - **Response**: `200 OK` with updated `IProduct`.

- **`DELETE /api/products/:id`**
  - **Description**: Soft deletes product (marks `isDeleted: true` and sets `deletedAt`).
  - **Response**: `200 OK` with archived `IProduct`.

- **`PATCH /api/products/:id/restore`**
  - **Description**: Restores an archived product back to active inventory (`isDeleted: false`).
  - **Response**: `200 OK` with restored `IProduct`.

- **`PATCH /api/products/:id/stock`**
  - **Description**: Increments or decrements item stock by delta amount.
  - **Body**: `{ "delta": 1 }` or `{ "delta": -1 }` (also accepts query parameter `?delta=1`).
  - **Response**: `200 OK` with updated `IProduct`.

---

### Orders (`/api/orders`)

- **`GET /api/orders`**
  - **Description**: Fetches all orders with itemized breakdowns.
  - **Response**: `200 OK` with `Array<IOrder>`.

- **`PATCH /api/orders/:id/status`**
  - **Description**: Updates order fulfillment state (`Pending`, `Processing`, `Completed`, `Cancelled`).
  - **Body**: `{ "status": "Processing" }`
  - **Response**: `200 OK` with updated `IOrder`.

---

### Tasks (`/api/tasks`)

- **`GET /api/tasks`**
  - **Description**: Fetches all operational tasks (both active and deleted).
  - **Response**: `200 OK` with `Array<ITask>`.

- **`POST /api/tasks`**
  - **Description**: Assigns a new task to staff.
  - **Body**:
    ```json
    {
      "title": "Pick & Pack Order #ORD-1002",
      "description": "Express overnight delivery",
      "assignedTo": "Alex M.",
      "priority": "High"
    }
    ```
  - **Response**: `201 Created` with saved `ITask`.

- **`PATCH /api/tasks/:id`**
  - **Description**: Updates fields of an operational task (title, description, assignee, priority, status).
  - **Body**: Partial task payload.
  - **Response**: `200 OK` with updated `ITask`.

- **`DELETE /api/tasks/:id`**
  - **Description**: Soft deletes task (marks `isDeleted: true` and sets `deletedAt`).
  - **Response**: `200 OK` with archived `ITask`.

- **`PATCH /api/tasks/:id/restore`**
  - **Description**: Restores an archived task back to the active queue (`isDeleted: false`).
  - **Response**: `200 OK` with restored `ITask`.

- **`PATCH /api/tasks/:id/status`**
  - **Description**: Toggles or updates task completion state (`Pending` or `Completed`).
  - **Body**: `{ "status": "Completed" }`
  - **Response**: `200 OK` with updated `ITask`.

---

## Core Logic & Functions

### `startServer()` (`src/index.ts`)
1. Attempts connection to MongoDB via `process.env.MONGODB_URI` (default `mongodb://127.0.0.1:27017/admin-portal`).
2. If connection fails or times out (e.g. no local daemon), spins up an in-memory instance using `MongoMemoryServer.create()`.
3. Runs `seedData()` to verify demo records exist.
4. Starts Express HTTP listener on port `5001`.

### `seedData()` (`src/index.ts` / `src/seed.ts`)
Populates the database with initial demo products (including low-stock scenarios), orders, and sample tasks.

---

## Environment & Running

### Commands
```bash
# Install dependencies
npm install

# Run in Development mode (with live reload via tsx)
npm run dev

# Run standalone database seed
npm run seed

# Build TypeScript to JavaScript
npm run build

# Start production server
npm run start
```
