# Admin Portal - Backend Service

A lightweight, robust REST API built with Node.js, Express, TypeScript, Mongoose, and Socket.IO for the internal Admin Portal operations dashboard.

---

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Multi-Location Real-Time Sync (Socket.IO)](#multi-location-real-time-sync-socketio)
- [Project Structure](#project-structure)
- [Key Features](#key-features)
- [Database Models & Schemas](#database-models--schemas)
- [API Endpoints Reference](#api-endpoints-reference)
- [WebSocket Events Catalog](#websocket-events-catalog)
- [Concurrency & Race Condition Handling](#concurrency--race-condition-handling)
- [Core Logic & Functions](#core-logic--functions)
- [Environment & Running](#environment--running)

---

## Architecture Overview

The backend is built following clean, pragmatic principles:
- **Express 4.x + Node HTTP Server** with TypeScript for routing, middleware, and request validation.
- **Socket.IO 4.x** attached to the HTTP server for bidirectional, instant real-time event broadcasting to all connected admin clients across different locations.
- **Mongoose 8.x** with strong TypeScript interfaces.
- **Embedded MongoDB Auto-Fallback**: Automatically uses `mongodb-memory-server` if an external MongoDB instance is not detected, enabling instant plug-and-play development without local database setup friction.
- **Soft Delete Architecture**: Products and Tasks implement a non-destructive delete pattern with `isDeleted: boolean` and `deletedAt: Date`. Records are moved to an archived state rather than dropped from the database, allowing full auditability and one-click restoration.

---

## Multi-Location Real-Time Sync (Socket.IO)

When staff across different locations (e.g., warehouse floor, fulfillment line, front office) use the portal simultaneously:
1. Any mutation performed at Location A (stock change, order status change, task edit/completion) immediately commits to MongoDB.
2. The server broadcasts a targeted Socket.IO event to all other connected instances.
3. Connected clients receive the payload and update their local React state without requiring manual page refreshes.

---

## Project Structure

```text
server/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts              # Express & HTTP server entrypoint, Socket.IO binding & DB lifecycle
    ├── socket.ts             # Socket.IO initialization and broadcast helper (emitEvent)
    ├── seed.ts               # Standalone database seed script
    ├── models/               # Mongoose schema definitions & interfaces
    │   ├── Order.ts          # Customer order schema
    │   ├── Product.ts        # Inventory item schema (with soft delete support)
    │   └── Task.ts           # Staff operational task schema (with soft delete support)
    └── routes/               # API route handlers
        ├── orders.ts         # Orders endpoints (status transitions, real-time broadcasts)
        ├── products.ts       # Products endpoints (CRUD, atomic stock adjustments, restore)
        └── tasks.ts          # Operational tasks endpoints (CRUD, status, restore)
```

---

## Key Features

1. **Live Synchronization Across Locations**:
   - Sub-100ms updates via WebSockets.
   - Immediate feedback to all active staff terminals.

2. **Inventory Management & Race Condition Safety**:
   - Product catalog retrieval with automatic sorting.
   - New product registration with unique SKU validation.
   - Field editing (SKU, name, category, price, stock quantity, low stock threshold).
   - **Atomic MongoDB `$inc` stock adjustments** preventing double-decrements or negative stock under concurrent multi-location clicks.
   - Non-destructive soft deletion (`isDeleted = true`) and restoration (`isDeleted = false`).

3. **Order Lifecycle Tracking**:
   - Order retrieval with nested item listings.
   - Real-time status transitions (`Pending` ➔ `Processing` ➔ `Completed` / `Cancelled`) broadcasted to all staff.

4. **Operational Task Assignment**:
   - Create warehouse and fulfillment tasks assigned to specific staff members.
   - Edit task details (title, description, assignee, priority, status).
   - Task prioritization (`Low`, `Medium`, `High`).
   - One-click completion status toggling synced to all views.
   - Soft deletion and restoration to the active tasks queue.

5. **Self-Healing & Auto-Seeding**:
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
  - **Description**: Creates a new product item and emits `product:created`.
  - **Response**: `201 Created` or `409 Conflict` (if duplicate SKU).

- **`PATCH /api/products/:id`**
  - **Description**: Updates specific fields of an existing product and emits `product:updated`.
  - **Response**: `200 OK` with updated `IProduct`.

- **`DELETE /api/products/:id`**
  - **Description**: Soft deletes product (`isDeleted: true`) and emits `product:deleted`.
  - **Response**: `200 OK` with archived `IProduct`.

- **`PATCH /api/products/:id/restore`**
  - **Description**: Restores an archived product back to active inventory (`isDeleted: false`) and emits `product:restored`.
  - **Response**: `200 OK` with restored `IProduct`.

- **`PATCH /api/products/:id/stock`**
  - **Description**: Atomically increments or decrements item stock by delta amount. Emits `product:stock_adjusted` and `product:updated`.
  - **Body**: `{ "delta": 1 }` or `{ "delta": -1 }` (also accepts query parameter `?delta=1`).
  - **Response**: `200 OK` with updated `IProduct` or `400` if stock would fall below 0.

---

### Orders (`/api/orders`)

- **`GET /api/orders`**
  - **Description**: Fetches all orders with itemized breakdowns.
  - **Response**: `200 OK` with `Array<IOrder>`.

- **`PATCH /api/orders/:id/status`**
  - **Description**: Updates order fulfillment state and emits `order:status_updated`.
  - **Body**: `{ "status": "Processing" }`
  - **Response**: `200 OK` with updated `IOrder`.

---

### Tasks (`/api/tasks`)

- **`GET /api/tasks`**
  - **Description**: Fetches all operational tasks (both active and deleted).
  - **Response**: `200 OK` with `Array<ITask>`.

- **`POST /api/tasks`**
  - **Description**: Assigns a new task to staff and emits `task:created`.
  - **Response**: `201 Created` with saved `ITask`.

- **`PATCH /api/tasks/:id`**
  - **Description**: Updates fields of an operational task and emits `task:updated`.
  - **Response**: `200 OK` with updated `ITask`.

- **`DELETE /api/tasks/:id`**
  - **Description**: Soft deletes task (`isDeleted: true`) and emits `task:deleted`.
  - **Response**: `200 OK` with archived `ITask`.

- **`PATCH /api/tasks/:id/restore`**
  - **Description**: Restores an archived task back to active queue and emits `task:restored`.
  - **Response**: `200 OK` with restored `ITask`.

- **`PATCH /api/tasks/:id/status`**
  - **Description**: Toggles completion state and emits `task:status_updated` & `task:updated`.
  - **Response**: `200 OK` with updated `ITask`.

---

## WebSocket Events Catalog

| Event Name | Trigger | Payload |
| :--- | :--- | :--- |
| `product:created` | New product added via modal | Full `IProduct` document |
| `product:updated` | Product details edited | Full updated `IProduct` |
| `product:stock_adjusted` | Stock count incremented or decremented | `{ product: IProduct, delta: number }` |
| `product:deleted` | Product soft deleted to archive | Updated `IProduct` (`isDeleted: true`) |
| `product:restored` | Product restored to active | Updated `IProduct` (`isDeleted: false`) |
| `order:status_updated` | Order status dropdown changed | Full updated `IOrder` |
| `task:created` | New operational task created | Full `ITask` document |
| `task:updated` | Task details edited | Full updated `ITask` |
| `task:status_updated` | Task completion checkbox clicked | Full updated `ITask` |
| `task:deleted` | Task soft deleted to archive | Updated `ITask` (`isDeleted: true`) |
| `task:restored` | Task restored to active | Updated `ITask` (`isDeleted: false`) |

---

## Concurrency & Race Condition Handling

When multiple locations attempt stock decrements on the same SKU concurrently:
```typescript
const filter: any = { _id: id };
if (delta < 0) {
  filter.stockQuantity = { $gte: Math.abs(delta) };
}

const product = await Product.findOneAndUpdate(
  filter,
  { $inc: { stockQuantity: delta } },
  { new: true }
);
```
- MongoDB evaluates the query and `$inc` modification atomically at the document level.
- If two staff members click `-1` when `stockQuantity: 1`, only the first request matches `$gte: 1`. The second request fails with `400 Stock cannot be reduced below 0`, completely preventing negative stock or ghost inventory.

---

## Core Logic & Functions

### `initSocket(httpServer)` (`src/socket.ts`)
Initializes the Socket.IO instance attached to the Express HTTP listener with cross-origin support (`cors: { origin: '*' }`).

### `emitEvent(event, payload)` (`src/socket.ts`)
Safe broadcaster that pushes events to all connected clients if Socket.IO is initialized.

### `startServer()` (`src/index.ts`)
Connects to MongoDB (or starts the in-memory fallback), seeds starter data, and launches the HTTP/Socket.IO server on port `5001`.

---

## Environment & Running

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
