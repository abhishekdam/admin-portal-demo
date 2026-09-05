import { useEffect, useState } from 'react';
import { Package, ShoppingCart, CheckSquare } from 'lucide-react';
import { IProduct, IOrder, ITask } from './types/index.js';
import { api } from './api/client.js';
import { InventoryView } from './components/InventoryView.js';
import { OrdersView } from './components/OrdersView.js';
import { TasksView } from './components/TasksView.js';

type Tab = 'inventory' | 'orders' | 'tasks';

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>('inventory');
  const [products, setProducts] = useState<IProduct[]>([]);
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [p, o, t] = await Promise.all([
          api.getProducts(),
          api.getOrders(),
          api.getTasks(),
        ]);
        setProducts(p);
        setOrders(o);
        setTasks(t);
      } catch (err) {
        console.error('Failed to load initial data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
              A
            </div>
            <h1 className="font-bold text-slate-900 tracking-tight">Internal Admin Portal</h1>
          </div>
          <div className="text-xs text-slate-400 font-medium">Operations Dashboard</div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-2 border-b border-slate-200 mb-6">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-2 px-4 py-2.5 font-medium text-sm border-b-2 transition ${
              activeTab === 'inventory'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Package size={16} /> Inventory
            <span className="ml-1 text-xs bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded-full">
              {products.filter((p) => !p.isDeleted).length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-4 py-2.5 font-medium text-sm border-b-2 transition ${
              activeTab === 'orders'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShoppingCart size={16} /> Orders
            <span className="ml-1 text-xs bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded-full">
              {orders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-2 px-4 py-2.5 font-medium text-sm border-b-2 transition ${
              activeTab === 'tasks'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckSquare size={16} /> Tasks
            <span className="ml-1 text-xs bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded-full">
              {tasks.filter((t) => !t.isDeleted && t.status === 'Pending').length}
            </span>
          </button>
        </div>

        {/* Tab Contents */}
        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading portal data...</div>
        ) : (
          <>
            {activeTab === 'inventory' && (
              <InventoryView products={products} setProducts={setProducts} />
            )}
            {activeTab === 'orders' && (
              <OrdersView orders={orders} setOrders={setOrders} />
            )}
            {activeTab === 'tasks' && (
              <TasksView tasks={tasks} setTasks={setTasks} />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
