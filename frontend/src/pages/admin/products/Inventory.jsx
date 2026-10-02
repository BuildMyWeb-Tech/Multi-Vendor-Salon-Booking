import React, { useContext, useEffect, useState } from 'react';
import { SalonAdminContext } from '../../../context/SalonAdminContext';
import { toast } from 'react-toastify';
import { Boxes, CheckCircle, AlertTriangle, XCircle, RefreshCw, Plus, X } from 'lucide-react';

const statusConfig = {
  in_stock: { label: 'In Stock', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  low_stock: { label: 'Low Stock', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-400' },
  out_of_stock: { label: 'Out of Stock', color: 'bg-red-50 text-red-600 border-red-200', dot: 'bg-red-500' },
};

const Inventory = () => {
  const { billingApi } = useContext(SalonAdminContext);
  const [inventory, setInventory] = useState([]);
  const [stats, setStats] = useState({ inStock: 0, lowStock: 0, outOfStock: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [stockModal, setStockModal] = useState(null); // { productId, variantId, productName, variantSize }
  const [stockQty, setStockQty] = useState('');
  const [addingStock, setAddingStock] = useState(false);

  const handleAddStock = async () => {
    const qty = parseInt(stockQty, 10);
    if (!qty || qty < 1) { toast.error('Enter a valid quantity'); return; }
    setAddingStock(true);
    try {
      const { data } = await billingApi.addStock({
        productId: stockModal.productId,
        variantId: stockModal.variantId,
        quantity: qty,
      });
      if (data.success) {
        toast.success(`Added ${qty} units. New stock: ${data.newStock}`);
        setStockModal(null);
        setStockQty('');
        fetchInventory();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Failed to add stock');
    } finally {
      setAddingStock(false);
    }
  };

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const { data } = await billingApi.getInventory();
      if (data.success) {
        setInventory(data.inventory);
        setStats(data.stats);
      }
    } catch {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInventory(); }, []);

  const filtered = filter === 'all' ? inventory : inventory.filter((i) => i.stockStatus === filter);

  const lowStockItems = inventory.filter(i => i.stockStatus === 'low_stock' || i.stockStatus === 'out_of_stock');

  return (
    <div className="space-y-5">
      {/* Add Stock Modal */}
      {stockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-800">Add Stock</h3>
              <button onClick={() => setStockModal(null)}><X size={18} className="text-gray-400" /></button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              <span className="font-medium">{stockModal.productName}</span> · {stockModal.variantSize}
            </p>
            <input
              type="number" min="1" autoFocus
              placeholder="Quantity to add"
              value={stockQty}
              onChange={e => setStockQty(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddStock()}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-4 focus:outline-none focus:border-primary"
            />
            <div className="flex gap-3">
              <button
                onClick={handleAddStock}
                disabled={addingStock}
                className="flex-1 bg-primary text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
              >
                {addingStock ? 'Saving…' : 'Add Stock'}
              </button>
              <button onClick={() => setStockModal(null)} className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-200">Cancel</button>
            </div>
          </div>
        </div>
      )}


      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Boxes size={18} className="text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Inventory</h1>
            <p className="text-xs text-gray-400">Live stock levels per variant</p>
          </div>
        </div>
        <button onClick={fetchInventory} className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-xl border border-gray-100 transition-all">
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { key: 'all', label: 'Total Variants', value: inventory.length, icon: Boxes, color: 'text-gray-600 bg-gray-50' },
          { key: 'in_stock', label: 'In Stock', value: stats.inStock, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50' },
          { key: 'low_stock', label: 'Low Stock', value: stats.lowStock, icon: AlertTriangle, color: 'text-amber-600 bg-amber-50' },
          { key: 'out_of_stock', label: 'Out of Stock', value: stats.outOfStock, icon: XCircle, color: 'text-red-500 bg-red-50' },
        ].map(({ key, label, value, icon: Icon, color }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`bg-white rounded-2xl border p-4 text-left transition-all hover:shadow-md ${filter === key ? 'border-primary shadow-sm' : 'border-gray-100'}`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${color}`}>
              <Icon size={16} />
            </div>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <Boxes size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No inventory items</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <th className="text-left px-5 py-3">Product</th>
                <th className="text-left px-5 py-3">Variant</th>
                <th className="text-right px-5 py-3">Price</th>
                <th className="text-right px-5 py-3">Stock</th>
                <th className="text-right px-5 py-3">Low Alert</th>
                <th className="text-right px-5 py-3">Status</th>
                <th className="text-right px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((item) => {
                const cfg = statusConfig[item.stockStatus];
                return (
                  <tr key={`${item.productId}-${item.variantId}`} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-gray-800">{item.productName}</td>
                    <td className="px-5 py-3.5 text-gray-500">{item.variantSize}</td>
                    <td className="px-5 py-3.5 text-right text-gray-700">₹{item.price}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-gray-800">{item.stock}</td>
                    <td className="px-5 py-3.5 text-right text-gray-400">{item.lowStockThreshold}</td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setStockModal({ productId: item.productId, variantId: item.variantId, productName: item.productName, variantSize: item.variantSize })}
                        className="flex items-center gap-1 text-xs text-primary border border-primary/30 px-2.5 py-1 rounded-lg hover:bg-primary/5 transition-colors"
                      >
                        <Plus size={11} /> Add Stock
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Inventory;
