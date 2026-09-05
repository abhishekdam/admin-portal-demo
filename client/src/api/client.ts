import { socket } from './socket.js';

const BASE_URL = 'http://localhost:5001/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(socket.id ? { 'x-socket-id': socket.id } : {}),
    ...((options?.headers as Record<string, string>) || {}),
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export const api = {
  getProducts: () => request<any[]>('/products'),
  createProduct: (data: any) => request<any>('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: string, data: any) =>
    request<any>(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteProduct: (id: string) =>
    request<any>(`/products/${id}`, { method: 'DELETE' }),
  restoreProduct: (id: string) =>
    request<any>(`/products/${id}/restore`, { method: 'PATCH' }),
  adjustStock: (id: string, delta: number) =>
    request<any>(`/products/${id}/stock`, { method: 'PATCH', body: JSON.stringify({ delta }) }),

  getOrders: () => request<any[]>('/orders'),
  updateOrderStatus: (id: string, status: string) =>
    request<any>(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  getTasks: () => request<any[]>('/tasks'),
  createTask: (data: any) => request<any>('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (id: string, data: any) =>
    request<any>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTask: (id: string) =>
    request<any>(`/tasks/${id}`, { method: 'DELETE' }),
  restoreTask: (id: string) =>
    request<any>(`/tasks/${id}/restore`, { method: 'PATCH' }),
  updateTaskStatus: (id: string, status: string) =>
    request<any>(`/tasks/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};
