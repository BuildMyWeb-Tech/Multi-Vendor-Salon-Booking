import React, { useContext, useEffect, useState } from 'react';
import { SalonAdminContext } from '../../../context/SalonAdminContext';
import { toast } from 'react-toastify';
import { Receipt, Search, Eye, X, RefreshCw, AlertTriangle, Printer } from 'lucide-react';

const statusBadge = {
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-50 text-red-600 border-red-200',
};

const Bills = () => {
  const { billingApi, shopInfo } = useContext(SalonAdminContext);
  const [bills, setBills] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [viewBill, setViewBill] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchBills = async (p = page) => {
    setLoading(true);
    try {
      const { data } = await billingApi.getBills({ search, status: statusFilter, page: p, limit: 20 });
      if (data.success) { setBills(data.bills); setTotal(data.total); }
    } catch {
      toast.error('Failed to load bills');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBills(1); setPage(1); }, [search, statusFilter]);

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const { data } = await billingApi.cancelBill(cancelTarget._id);
      if (data.success) {
        toast.success('Bill cancelled and stock restored');
        setCancelTarget(null);
        fetchBills();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Failed to cancel');
    } finally {
      setCancelling(false);
    }
  };

  const handlePrintBill = (bill) => {
    const win = window.open('', '_blank', 'width=400,height=600');
    const shop = shopInfo;
    win.document.write(`
      <html><head><title>Bill ${bill.billNumber}</title>
      <style>body{font-family:monospace;font-size:12px;padding:20px;max-width:320px;margin:0 auto}
      table{width:100%}th{text-align:left}th.r,td.r{text-align:right}.divider{border-top:1px dashed #000;margin:8px 0}</style>
      </head><body>
      <div style="text-align:center"><h2 style="margin:0">${shop?.shopName || 'Salon'}</h2>
      ${shop?.address ? `<p style="margin:2px 0">${shop.address}</p>` : ''}
      ${shop?.phone ? `<p style="margin:2px 0">${shop.phone}</p>` : ''}
      ${shop?.gstNumber ? `<p style="margin:2px 0">GST: ${shop.gstNumber}</p>` : ''}
      <p style="margin:4px 0">${new Date(bill.createdAt).toLocaleString('en-IN')}</p>
      <p style="margin:2px 0">Bill: <strong>${bill.billNumber}</strong></p></div>
      <div class="divider"></div>
      ${bill.customerName ? `<p>Customer: ${bill.customerName}${bill.customerPhone ? ' | ' + bill.customerPhone : ''}</p>` : ''}
      <table>
        <tr><th>Item</th><th class="r">Qty</th><th class="r">Price</th><th class="r">Total</th></tr>
        ${bill.services?.map(s => `<tr><td>${s.name}</td><td class="r">${s.quantity}</td><td class="r">₹${s.price}</td><td class="r">₹${s.subtotal}</td></tr>`).join('') || ''}
        ${bill.products?.map(p => `<tr><td>${p.productName} (${p.variantSize})</td><td class="r">${p.quantity}</td><td class="r">₹${p.price}</td><td class="r">₹${p.subtotal}</td></tr>`).join('') || ''}
      </table>
      <div class="divider"></div>
      <table>
        <tr><td>Subtotal</td><td class="r">₹${bill.subtotal?.toFixed(2)}</td></tr>
        ${bill.discount > 0 ? `<tr><td>Discount</td><td class="r">-₹${bill.discount?.toFixed(2)}</td></tr>` : ''}
        ${bill.tax > 0 ? `<tr><td>Tax (${bill.taxPercent}%)</td><td class="r">+₹${bill.tax?.toFixed(2)}</td></tr>` : ''}
        <tr><td><strong>TOTAL</strong></td><td class="r"><strong>₹${bill.total?.toFixed(2)}</strong></td></tr>
        <tr><td>Payment</td><td class="r" style="text-transform:capitalize">${bill.paymentMethod}</td></tr>
        ${bill.utrNumber ? `<tr><td>UTR</td><td class="r">${bill.utrNumber}</td></tr>` : ''}
      </table>
      <div class="divider"></div>
      <p style="text-align:center;margin-top:12px">Thank you for visiting!</p>
      <script>window.onload=()=>{ window.print(); }</script>
      </body></html>
    `);
    win.document.close();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Receipt size={18} className="text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Bills</h1>
            <p className="text-xs text-gray-400">{total} bill{total !== 1 ? 's' : ''} total</p>
          </div>
        </div>
        <button onClick={() => fetchBills()} className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-xl border border-gray-100 transition-all">
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary bg-white" placeholder="Search by name, phone or bill no…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary bg-white" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Loading…</div>
      ) : bills.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <Receipt size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No bills found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <th className="text-left px-5 py-3">Bill #</th>
                <th className="text-left px-5 py-3 hidden sm:table-cell">Customer</th>
                <th className="text-left px-5 py-3 hidden md:table-cell">Date</th>
                <th className="text-right px-5 py-3">Total</th>
                <th className="text-left px-5 py-3 hidden sm:table-cell">Payment</th>
                <th className="text-right px-5 py-3">Status</th>
                <th className="text-right px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {bills.map((b) => (
                <tr key={b._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs text-gray-600">{b.billNumber}</td>
                  <td className="px-5 py-3.5 hidden sm:table-cell">
                    <p className="font-medium text-gray-800">{b.customerName || '—'}</p>
                    {b.customerPhone && <p className="text-xs text-gray-400">{b.customerPhone}</p>}
                  </td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs hidden md:table-cell">
                    {new Date(b.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold text-gray-800">₹{b.total?.toFixed(2)}</td>
                  <td className="px-5 py-3.5 hidden sm:table-cell capitalize text-gray-500 text-xs">{b.paymentMethod}</td>
                  <td className="px-5 py-3.5 text-right">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${statusBadge[b.status]}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-1.5">
                      <button onClick={() => setViewBill(b)} className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"><Eye size={14} /></button>
                      <button onClick={() => handlePrintBill(b)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"><Printer size={14} /></button>
                      {b.status === 'completed' && (
                        <button onClick={() => setCancelTarget(b)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><X size={14} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* View bill modal */}
      {viewBill && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-800">{viewBill.billNumber}</h3>
                <p className="text-xs text-gray-400">{new Date(viewBill.createdAt).toLocaleString('en-IN')}</p>
              </div>
              <button onClick={() => setViewBill(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>

            {viewBill.customerName && (
              <p className="text-sm text-gray-600 mb-3">Customer: <strong>{viewBill.customerName}</strong>{viewBill.customerPhone ? ` · ${viewBill.customerPhone}` : ''}</p>
            )}

            <div className="space-y-1 mb-3">
              {viewBill.services?.map((s, i) => (
                <div key={i} className="flex justify-between text-sm"><span>{s.name} × {s.quantity}</span><span>₹{s.subtotal}</span></div>
              ))}
              {viewBill.products?.map((p, i) => (
                <div key={i} className="flex justify-between text-sm"><span>{p.productName} ({p.variantSize}) × {p.quantity}</span><span>₹{p.subtotal}</span></div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-3 space-y-1 text-sm">
              <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>₹{viewBill.subtotal?.toFixed(2)}</span></div>
              {viewBill.discount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><span>-₹{viewBill.discount?.toFixed(2)}</span></div>}
              {viewBill.tax > 0 && <div className="flex justify-between text-gray-500"><span>Tax</span><span>+₹{viewBill.tax?.toFixed(2)}</span></div>}
              <div className="flex justify-between font-bold text-gray-800 border-t pt-1"><span>Total</span><span>₹{viewBill.total?.toFixed(2)}</span></div>
              <div className="flex justify-between text-gray-500 capitalize"><span>Payment</span><span>{viewBill.paymentMethod}{viewBill.utrNumber ? ` · ${viewBill.utrNumber}` : ''}</span></div>
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={() => handlePrintBill(viewBill)} className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50">
                <Printer size={14} /> Print
              </button>
              <button onClick={() => setViewBill(null)} className="flex-1 bg-primary hover:bg-primary/90 text-white py-2.5 rounded-xl text-sm font-medium">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel confirmation */}
      {cancelTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={22} className="text-red-500" />
            </div>
            <h3 className="text-base font-bold text-gray-800 text-center mb-1">Cancel Bill?</h3>
            <p className="text-sm text-gray-500 text-center mb-5">
              <strong>{cancelTarget.billNumber}</strong> will be cancelled and product stock will be restored.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setCancelTarget(null)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50">Keep</button>
              <button onClick={handleCancel} disabled={cancelling} className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium">
                {cancelling ? 'Cancelling…' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bills;
