import { useState } from 'react';
import { Plus, AlertTriangle, Minus, Pencil, Trash2, RotateCcw, Archive } from 'lucide-react';
import { IProduct } from '../types/index.js';
import { AddProductModal } from './AddProductModal.js';
import { EditProductModal } from './EditProductModal.js';
import { api } from '../api/client.js';

interface Props {
  products: IProduct[];
  setProducts: React.Dispatch<React.SetStateAction<IProduct[]>>;
  onRefresh?: () => void;
}

export const InventoryView: React.FC<Props> = ({ products, setProducts, onRefresh }) => {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<IProduct | null>(null);
  const [viewTab, setViewTab] = useState<'active' | 'deleted'>('active');

  const activeProducts = products.filter((p) => !p.isDeleted);
  const deletedProducts = products.filter((p) => p.isDeleted);

  const handleAdjustStock = async (id: string, delta: number) => {
    try {
      const updated = await api.adjustStock(id, delta);
      setProducts((prev) => prev.map((p) => (p._id === id ? updated : p)));
    } catch (err) {
      console.error(err);
      if (onRefresh) onRefresh();
    }
  };

  const handleAddProduct = async (productData: Omit<IProduct, '_id'>) => {
    const created = await api.createProduct(productData);
    setProducts((prev) => {
      if (prev.some((p) => p._id === created._id)) return prev;
      return [created, ...prev];
    });
  };

  const handleUpdateProduct = async (id: string, updatedData: Partial<IProduct>) => {
    const updated = await api.updateProduct(id, updatedData);
    setProducts((prev) => prev.map((p) => (p._id === id ? updated : p)));
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      const deleted = await api.deleteProduct(id);
      setProducts((prev) => prev.map((p) => (p._id === id ? deleted : p)));
    } catch (err) {
      console.error(err);
      if (onRefresh) onRefresh();
    }
  };

  const handleRestoreProduct = async (id: string) => {
    try {
      const restored = await api.restoreProduct(id);
      setProducts((prev) => prev.map((p) => (p._id === id ? restored : p)));
    } catch (err) {
      console.error(err);
      if (onRefresh) onRefresh();
    }
  };

  return (
    <div>
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Inventory Management</h2>
          <p className="text-sm text-slate-500">Monitor live stock levels, edit details, and track deleted items</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Sub-tab view switch */}
          <div className="inline-flex bg-slate-200/80 p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setViewTab('active')}
              className={`px-3 py-1.5 rounded-md transition ${
                viewTab === 'active'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active ({activeProducts.length})
            </button>
            <button
              onClick={() => setViewTab('deleted')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
                viewTab === 'deleted'
                  ? 'bg-white text-rose-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Archive size={13} />
              Deleted ({deletedProducts.length})
            </button>
          </div>

          <button
            onClick={() => setAddModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition shadow-sm"
          >
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      {/* Active Table */}
      {viewTab === 'active' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          {activeProducts.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">No active inventory items found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3 font-medium">SKU / Item</th>
                    <th className="px-6 py-3 font-medium">Category</th>
                    <th className="px-6 py-3 font-medium">Price</th>
                    <th className="px-6 py-3 font-medium">Stock Level</th>
                    <th className="px-6 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeProducts.map((item) => {
                    const isLowStock = item.stockQuantity <= item.lowStockThreshold;
                    return (
                      <tr key={item._id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-800">{item.name}</div>
                          <div className="text-xs text-slate-400 font-mono">{item.sku}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{item.category}</td>
                        <td className="px-6 py-4 text-slate-800 font-semibold">${item.price.toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-700">{item.stockQuantity}</span>
                            {isLowStock && (
                              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs px-2 py-0.5 rounded-full font-medium">
                                <AlertTriangle size={12} /> Low Stock (&le;{item.lowStockThreshold})
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            {/* Stock increment/decrement */}
                            <div className="inline-flex items-center border border-slate-200 rounded-md bg-white shadow-sm">
                              <button
                                onClick={() => handleAdjustStock(item._id!, -1)}
                                className="p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                                disabled={item.stockQuantity <= 0}
                                title="Decrease stock"
                              >
                                <Minus size={14} />
                              </button>
                              <button
                                onClick={() => handleAdjustStock(item._id!, 1)}
                                className="p-1.5 text-slate-600 hover:bg-slate-100 border-l border-slate-200"
                                title="Increase stock"
                              >
                                <Plus size={14} />
                              </button>
                            </div>

                            {/* Edit Button */}
                            <button
                              onClick={() => setEditingProduct(item)}
                              className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition"
                              title="Edit item fields"
                            >
                              <Pencil size={14} />
                            </button>

                            {/* Soft Delete Button */}
                            <button
                              onClick={() => handleDeleteProduct(item._id!)}
                              className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition"
                              title="Soft delete item"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Deleted Section */}
      {viewTab === 'deleted' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-rose-50/50 border-b border-rose-100 px-6 py-3 flex items-center justify-between text-xs text-rose-800">
            <span className="font-semibold flex items-center gap-1.5">
              <Archive size={14} /> Deleted Products Archive (Soft Deleted)
            </span>
            <span>Items are archived here and can be restored anytime</span>
          </div>

          {deletedProducts.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">No deleted items in archive.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3 font-medium">SKU / Item</th>
                    <th className="px-6 py-3 font-medium">Category</th>
                    <th className="px-6 py-3 font-medium">Price</th>
                    <th className="px-6 py-3 font-medium">Stock Count</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {deletedProducts.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50/50 bg-slate-50/30">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-600 line-through">{item.name}</div>
                        <div className="text-xs text-slate-400 font-mono">{item.sku}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{item.category}</td>
                      <td className="px-6 py-4 text-slate-500">${item.price.toFixed(2)}</td>
                      <td className="px-6 py-4 text-slate-500">{item.stockQuantity}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center text-xs px-2.5 py-0.5 rounded-full font-medium bg-rose-100 text-rose-800 border border-rose-200">
                          Archived
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleRestoreProduct(item._id!)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-300 transition shadow-sm"
                          title="Restore product to active inventory"
                        >
                          <RotateCcw size={13} /> Restore
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <AddProductModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAdd={handleAddProduct}
      />

      <EditProductModal
        isOpen={!!editingProduct}
        product={editingProduct}
        onClose={() => setEditingProduct(null)}
        onUpdate={handleUpdateProduct}
      />
    </div>
  );
};
