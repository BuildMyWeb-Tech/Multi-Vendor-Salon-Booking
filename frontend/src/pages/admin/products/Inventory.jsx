import React, { useContext, useEffect, useState } from 'react';
import { SalonAdminContext } from '../../../context/SalonAdminContext';
import { toast } from 'react-toastify';
import { Boxes, CheckCircle, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';

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

  return (
    <div className="space-y-5">
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
      <div className="grid grid-cols-3 gap-3">
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
