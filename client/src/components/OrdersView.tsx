import type { FC } from 'react';
import { IOrder, OrderStatus } from '../types/index.js';
import { api } from '../api/client.js';

interface Props {
  orders: IOrder[];
  setOrders: React.Dispatch<React.SetStateAction<IOrder[]>>;
}

const statusColors: Record<OrderStatus, string> = {
  Pending: 'bg-amber-100 text-amber-800 border-amber-200',
  Processing: 'bg-blue-100 text-blue-800 border-blue-200',
  Completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Cancelled: 'bg-slate-100 text-slate-600 border-slate-200',
};

export const OrdersView: FC<Props> = ({ orders, setOrders }) => {
  const handleStatusChange = async (id: string, newStatus: OrderStatus) => {
    try {
      const updated = await api.updateOrderStatus(id, newStatus);
      setOrders((prev) => prev.map((o) => (o._id === id ? updated : o)));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800">Customer Orders</h2>
        <p className="text-sm text-slate-500">View customer purchases and track fulfillment status</p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-xs">
            <tr>
              <th className="px-6 py-3 font-medium">Order #</th>
              <th className="px-6 py-3 font-medium">Customer</th>
              <th className="px-6 py-3 font-medium">Items</th>
              <th className="px-6 py-3 font-medium">Total</th>
              <th className="px-6 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((order) => (
              <tr key={order._id} className="hover:bg-slate-50/50">
                <td className="px-6 py-4 font-mono font-medium text-slate-900">{order.orderNumber}</td>
                <td className="px-6 py-4 text-slate-700">{order.customerName}</td>
                <td className="px-6 py-4 text-slate-600">
                  {order.items.map((i, idx) => (
                    <div key={idx} className="text-xs">
                      {i.quantity}x {i.productName}
                    </div>
                  ))}
                </td>
                <td className="px-6 py-4 font-semibold text-slate-900">${order.totalAmount.toFixed(2)}</td>
                <td className="px-6 py-4">
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order._id!, e.target.value as OrderStatus)}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusColors[order.status]} focus:outline-none cursor-pointer`}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
