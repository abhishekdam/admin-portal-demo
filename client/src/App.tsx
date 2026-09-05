import { useEffect, useState, useRef } from 'react';
import { Package, ShoppingCart, CheckSquare, Zap } from 'lucide-react';
import { IProduct, IOrder, ITask } from './types/index.js';
import { api } from './api/client.js';
import { socket } from './api/socket.js';
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

  // Real-time synchronization state
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [syncToast, setSyncToast] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showSyncNotification = (message: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setSyncToast(message);
    toastTimeoutRef.current = setTimeout(() => {
      setSyncToast(null);
    }, 3500);
  };

  // Initial & Reconnect Data Fetch
  const loadData = async () => {
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
      console.error('Failed to load portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Socket.IO Real-Time Event Handlers
  useEffect(() => {
    const handleConnect = () => {
      setIsConnected(true);
      loadData(); // Ensure state is synchronized with server upon connect or reconnect
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    // Product events
    const handleProductCreated = (newProduct: IProduct) => {
      setProducts((prev) => {
        if (prev.some((p) => p._id === newProduct._id)) return prev;
        return [newProduct, ...prev];
      });
      showSyncNotification(`New product added: "${newProduct.name}"`);
    };

    const handleProductUpdated = (updatedProduct: IProduct) => {
      setProducts((prev) =>
        prev.map((p) => (p._id === updatedProduct._id ? updatedProduct : p))
      );
    };

    const handleStockAdjusted = ({ product, delta }: { product: IProduct; delta: number }) => {
      setProducts((prev) =>
        prev.map((p) => (p._id === product._id ? product : p))
      );
      const sign = delta > 0 ? `+${delta}` : `${delta}`;
      showSyncNotification(`Stock adjusted (${sign}): "${product.name}" is now ${product.stockQuantity}`);
    };

    const handleProductDeleted = (deletedProduct: IProduct) => {
      setProducts((prev) =>
        prev.map((p) => (p._id === deletedProduct._id ? deletedProduct : p))
      );
      showSyncNotification(`Product archived: "${deletedProduct.name}"`);
    };

    const handleProductRestored = (restoredProduct: IProduct) => {
      setProducts((prev) =>
        prev.map((p) => (p._id === restoredProduct._id ? restoredProduct : p))
      );
      showSyncNotification(`Product restored to active: "${restoredProduct.name}"`);
    };

    // Order events
    const handleOrderStatusUpdated = (updatedOrder: IOrder) => {
      setOrders((prev) =>
        prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o))
      );
      showSyncNotification(`Order ${updatedOrder.orderNumber} status changed to ${updatedOrder.status}`);
    };

    // Task events
    const handleTaskCreated = (newTask: ITask) => {
      setTasks((prev) => {
        if (prev.some((t) => t._id === newTask._id)) return prev;
        return [newTask, ...prev];
      });
      showSyncNotification(`New task assigned: "${newTask.title}"`);
    };

    const handleTaskUpdated = (updatedTask: ITask) => {
      setTasks((prev) =>
        prev.map((t) => (t._id === updatedTask._id ? updatedTask : t))
      );
      showSyncNotification(`Task updated: "${updatedTask.title}" (${updatedTask.status})`);
    };

    const handleTaskDeleted = (deletedTask: ITask) => {
      setTasks((prev) =>
        prev.map((t) => (t._id === deletedTask._id ? deletedTask : t))
      );
      showSyncNotification(`Task archived: "${deletedTask.title}"`);
    };

    const handleTaskRestored = (restoredTask: ITask) => {
      setTasks((prev) =>
        prev.map((t) => (t._id === restoredTask._id ? restoredTask : t))
      );
      showSyncNotification(`Task restored: "${restoredTask.title}"`);
    };

    // Attach listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('product:created', handleProductCreated);
    socket.on('product:updated', handleProductUpdated);
    socket.on('product:stock_adjusted', handleStockAdjusted);
    socket.on('product:deleted', handleProductDeleted);
    socket.on('product:restored', handleProductRestored);
    socket.on('order:status_updated', handleOrderStatusUpdated);
    socket.on('task:created', handleTaskCreated);
    socket.on('task:updated', handleTaskUpdated);
    socket.on('task:status_updated', handleTaskUpdated);
    socket.on('task:deleted', handleTaskDeleted);
    socket.on('task:restored', handleTaskRestored);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('product:created', handleProductCreated);
      socket.off('product:updated', handleProductUpdated);
      socket.off('product:stock_adjusted', handleStockAdjusted);
      socket.off('product:deleted', handleProductDeleted);
      socket.off('product:restored', handleProductRestored);
      socket.off('order:status_updated', handleOrderStatusUpdated);
      socket.off('task:created', handleTaskCreated);
      socket.off('task:updated', handleTaskUpdated);
      socket.off('task:status_updated', handleTaskUpdated);
      socket.off('task:deleted', handleTaskDeleted);
      socket.off('task:restored', handleTaskRestored);
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 relative">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-sm">
              A
            </div>
            <h1 className="font-bold text-slate-900 tracking-tight">Internal Admin Portal</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Live Sync Pulse Indicator */}
            <div
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border transition ${
                isConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
              title={
                isConnected
                  ? 'Connected to real-time sync server via WebSocket'
                  : 'Disconnected from sync server. Attempting reconnection...'
              }
            >
              <span className="relative flex h-2 w-2">
                {isConnected && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    isConnected ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                ></span>
              </span>
              <span>{isConnected ? 'Live Synced' : 'Reconnecting...'}</span>
            </div>

            <div className="hidden sm:block text-xs text-slate-400 font-medium">Operations Hub</div>
          </div>
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
              <InventoryView products={products} setProducts={setProducts} onRefresh={loadData} />
            )}
            {activeTab === 'orders' && (
              <OrdersView orders={orders} setOrders={setOrders} />
            )}
            {activeTab === 'tasks' && (
              <TasksView tasks={tasks} setTasks={setTasks} onRefresh={loadData} />
            )}
          </>
        )}
      </main>

      {/* Subtle Real-Time Toast Notification */}
      {syncToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900/95 text-white px-4 py-3 rounded-lg shadow-2xl border border-slate-700/60 backdrop-blur-md text-xs font-medium max-w-sm transition-all animate-bounce">
          <span className="p-1 rounded bg-indigo-500/20 text-indigo-300">
            <Zap size={14} />
          </span>
          <span className="leading-tight">{syncToast}</span>
        </div>
      )}
    </div>
  );
}

export default App;
