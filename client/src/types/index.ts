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
