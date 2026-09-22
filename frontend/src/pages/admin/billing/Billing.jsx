import React, { useContext, useEffect, useRef, useState } from 'react';
import { SalonAdminContext } from '../../../context/SalonAdminContext';
import { toast } from 'react-toastify';
import {
  ShoppingCart, Search, Plus, Minus, Trash2, Printer, CheckCircle,
  User, Package, Calendar, ChevronDown, X, IndianRupee,
} from 'lucide-react';

const PAYMENT_METHODS = ['cash', 'upi'];

const Billing = () => {
  const { billingApi, appointments, getAllAppointments, shopInfo } = useContext(SalonAdminContext);
  const serviceBilling = shopInfo?.serviceBillingEnabled;
  const productBilling = shopInfo?.productBillingEnabled;

  // ── State ────────────────────────────────────────────────────────────────────
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [aptSearch, setAptSearch] = useState('');
  const [cartServices, setCartServices] = useState([]);   // {name, price, quantity}
  const [cartProducts, setCartProducts] = useState([]);   // {productId, variantId, productName, variantSize, price, quantity}
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [linkedAppointment, setLinkedAppointment] = useState(null);
  const [discount, setDiscount] = useState('');
  const [discountType, setDiscountType] = useState('flat');
  const [taxPercent, setTaxPercent] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [utrNumber, setUtrNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastBill, setLastBill] = useState(null);
  const printRef = useRef(null);

  // ── Computed ─────────────────────────────────────────────────────────────────
  const serviceSubtotal = cartServices.reduce((s, i) => s + i.price * i.quantity, 0);
  const productSubtotal = cartProducts.reduce((s, i) => s + i.price * i.quantity, 0);
  const subtotal = serviceSubtotal + productSubtotal;
  const discountAmt = discountType === 'percent'
    ? Math.round(subtotal * (parseFloat(discount) || 0)) / 100
    : parseFloat(discount) || 0;
  const afterDiscount = subtotal - discountAmt;
  const taxAmt = Math.round(afterDiscount * (parseFloat(taxPercent) || 0)) / 100;
  const total = afterDiscount + taxAmt;

  // ── Data fetch ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (productBilling) fetchProducts();
    if (serviceBilling) getAllAppointments();
  }, []);

  useEffect(() => {
    if (!productBilling) return;
    const t = setTimeout(fetchProducts, 300);
    return () => clearTimeout(t);
  }, [productSearch]);

  const fetchProducts = async () => {
    try {
      const { data } = await billingApi.getProducts({ search: productSearch });
      if (data.success) setProducts(data.products);
    } catch {}
  };

  // ── Cart helpers ─────────────────────────────────────────────────────────────
  const addService = (service) => {
    setCartServices((prev) => {
      const existing = prev.find((s) => s.name === service.name);
      if (existing) return prev.map((s) => s.name === service.name ? { ...s, quantity: s.quantity + 1 } : s);
      return [...prev, { name: service.name, price: service.price, quantity: 1 }];
    });
  };

  const addProduct = (product, variant) => {
    const key = `${product._id}-${variant._id}`;
    setCartProducts((prev) => {
      const existing = prev.find((p) => `${p.productId}-${p.variantId}` === key);
      if (existing) return prev.map((p) => `${p.productId}-${p.variantId}` === key ? { ...p, quantity: p.quantity + 1 } : p);
      return [...prev, {
        productId: product._id,
        variantId: variant._id,
        productName: product.name,
        variantSize: variant.size,
        price: variant.price,
        quantity: 1,
      }];
    });
  };

  const linkAppointment = (apt) => {
    setLinkedAppointment(apt);
    setCustomerName(apt.userData?.name || '');
    setCustomerPhone(apt.userData?.phone || '');
    if (serviceBilling && apt.services?.length) {
      apt.services.forEach((s) => addService(s));
    } else if (serviceBilling && apt.service) {
      addService({ name: apt.service, price: apt.amount || 0 });
    }
    setAptSearch('');
  };

  const updateQty = (type, idx, delta) => {
    const setter = type === 'service' ? setCartServices : setCartProducts;
    setter((prev) => prev.map((i, n) => {
      if (n !== idx) return i;
      const newQty = i.quantity + delta;
      return newQty < 1 ? i : { ...i, quantity: newQty };
    }));
  };

  const removeItem = (type, idx) => {
    if (type === 'service') setCartServices((p) => p.filter((_, i) => i !== idx));
    else setCartProducts((p) => p.filter((_, i) => i !== idx));
  };

  // ── Submit bill ───────────────────────────────────────────────────────────────
  const handleComplete = async () => {
    if (cartServices.length === 0 && cartProducts.length === 0) {
      toast.error('Add at least one service or product');
      return;
    }
    if (paymentMethod === 'upi' && !utrNumber.trim()) {
      toast.error('Enter UTR number for UPI payment');
      return;
    }

    setSaving(true);
    try {
      const { data } = await billingApi.createBill({
        customerName,
        customerPhone,
        appointmentId: linkedAppointment?._id || null,
        services: JSON.stringify(cartServices),
        products: JSON.stringify(cartProducts),
        discount,
        discountType,
        taxPercent,
        paymentMethod,
        utrNumber,
      });
      if (data.success) {
        toast.success('Bill completed!');
        setLastBill(data.bill);
        resetCart();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Failed to create bill');
    } finally {
      setSaving(false);
    }
  };

  const resetCart = () => {
    setCartServices([]);
    setCartProducts([]);
    setCustomerName('');
    setCustomerPhone('');
    setLinkedAppointment(null);
    setDiscount('');
    setDiscountType('flat');
    setTaxPercent('');
    setPaymentMethod('cash');
    setUtrNumber('');
  };

  const handlePrint = () => window.print();

  // ── Filter appointments ───────────────────────────────────────────────────────
  const filteredApts = (appointments || []).filter((a) => {
    if (a.cancelled || a.isCompleted) return false;
    if (!aptSearch) return true;
    const q = aptSearch.toLowerCase();
    return (
      a.userData?.name?.toLowerCase().includes(q) ||
      a.userData?.phone?.includes(q) ||
      a.docData?.name?.toLowerCase().includes(q)
    );
  }).slice(0, 20);

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary bg-white';

  return (
    <>
      {/* Print styles */}
      <style>{`@media print { .no-print { display: none !important; } .print-only { display: block !important; } }`}</style>

      <div className="flex flex-col lg:flex-row gap-5 h-full no-print">
        {/* ── LEFT: Selection Panel ───────────────────────────────────────────── */}
        <div className="flex-1 space-y-4 min-w-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShoppingCart size={18} className="text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Billing / POS</h1>
              <p className="text-xs text-gray-400">Create a new bill</p>
            </div>
          </div>

          {/* Customer info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-700 flex items-center gap-2"><User size={14} /> Customer</p>
            <div className="grid grid-cols-2 gap-3">
              <input className={inputCls} placeholder="Customer name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
              <input className={inputCls} placeholder="Phone number" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
            </div>
          </div>

          {/* Appointments */}
          {serviceBilling && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
              <p className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Calendar size={14} /> Upcoming Appointments</p>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input className="w-full border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary bg-white" placeholder="Search by name or phone…" value={aptSearch} onChange={(e) => setAptSearch(e.target.value)} />
              </div>

              {linkedAppointment && (
                <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-xl px-3 py-2 text-sm">
                  <span className="text-primary font-medium">Linked: {linkedAppointment.userData?.name || 'Customer'}</span>
                  <button onClick={() => setLinkedAppointment(null)} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
                </div>
              )}

              {aptSearch && filteredApts.length > 0 && (
                <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50 max-h-52 overflow-y-auto">
                  {filteredApts.map((a) => (
                    <button key={a._id} onClick={() => linkAppointment(a)} className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-primary/5 text-left transition-colors">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{a.userData?.name || 'Customer'}</p>
                        <p className="text-xs text-gray-400">{a.slotDate} · {a.slotTime} · {a.docData?.name}</p>
                      </div>
                      <Plus size={14} className="text-primary flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Products */}
          {productBilling && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
              <p className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Package size={14} /> Products</p>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input className="w-full border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary bg-white" placeholder="Search products…" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} />
              </div>

              {products.length > 0 && (
                <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50 max-h-64 overflow-y-auto">
                  {products.map((p) => (
                    <div key={p._id}>
                      {p.variants.map((v) => (
                        <button key={v._id} onClick={() => addProduct(p, v)} disabled={v.stock === 0}
                          className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${v.stock === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-primary/5'}`}>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{p.name} <span className="text-gray-400 text-xs">({v.size})</span></p>
                            <p className="text-xs text-gray-400">₹{v.price} · {v.stock} in stock</p>
                          </div>
                          <Plus size={14} className="text-primary flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── RIGHT: Bill Panel ───────────────────────────────────────────────── */}
        <div className="lg:w-96 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4 lg:sticky lg:top-4">
            <div className="flex items-center justify-between">
              <p className="font-bold text-gray-800">Bill Summary</p>
              {(cartServices.length > 0 || cartProducts.length > 0) && (
                <button onClick={resetCart} className="text-xs text-red-400 hover:text-red-500 flex items-center gap-1"><X size={12} /> Clear</button>
              )}
            </div>

            {/* Cart items */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {cartServices.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{s.name}</p>
                    <p className="text-xs text-gray-400">₹{s.price} × {s.quantity}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQty('service', i, -1)} className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"><Minus size={10} /></button>
                    <span className="w-6 text-center text-xs font-medium">{s.quantity}</span>
                    <button onClick={() => updateQty('service', i, 1)} className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"><Plus size={10} /></button>
                    <button onClick={() => removeItem('service', i)} className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-50 text-gray-400 hover:text-red-500 ml-1"><Trash2 size={11} /></button>
                  </div>
                  <p className="text-sm font-medium text-gray-700 w-16 text-right">₹{s.price * s.quantity}</p>
                </div>
              ))}

              {cartProducts.map((p, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{p.productName}</p>
                    <p className="text-xs text-gray-400">{p.variantSize} · ₹{p.price} × {p.quantity}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQty('product', i, -1)} className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"><Minus size={10} /></button>
                    <span className="w-6 text-center text-xs font-medium">{p.quantity}</span>
                    <button onClick={() => updateQty('product', i, 1)} className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"><Plus size={10} /></button>
                    <button onClick={() => removeItem('product', i)} className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-50 text-gray-400 hover:text-red-500 ml-1"><Trash2 size={11} /></button>
                  </div>
                  <p className="text-sm font-medium text-gray-700 w-16 text-right">₹{p.price * p.quantity}</p>
                </div>
              ))}

              {cartServices.length === 0 && cartProducts.length === 0 && (
                <p className="text-center text-gray-400 text-xs py-6">No items added yet</p>
              )}
            </div>

            {/* Discount & tax */}
            <div className="border-t border-gray-100 pt-3 space-y-2">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Discount</label>
                  <input type="number" min="0" className={inputCls} placeholder="0" value={discount} onChange={(e) => setDiscount(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Type</label>
                  <select className={inputCls} value={discountType} onChange={(e) => setDiscountType(e.target.value)}>
                    <option value="flat">₹ Flat</option>
                    <option value="percent">% Off</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Tax %</label>
                  <input type="number" min="0" className={inputCls} placeholder="0" value={taxPercent} onChange={(e) => setTaxPercent(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Totals */}
            <div className="border-t border-gray-100 pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span>
              </div>
              {discountAmt > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span><span>-₹{discountAmt.toFixed(2)}</span>
                </div>
              )}
              {taxAmt > 0 && (
                <div className="flex justify-between text-gray-500">
                  <span>Tax ({taxPercent}%)</span><span>+₹{taxAmt.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-800 text-base pt-1 border-t border-gray-100">
                <span>Total</span><span>₹{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment method */}
            <div className="space-y-2">
              <label className="block text-xs text-gray-500">Payment Method</label>
              <div className="flex gap-2">
                {PAYMENT_METHODS.map((m) => (
                  <button key={m} onClick={() => setPaymentMethod(m)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all capitalize ${paymentMethod === m ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-primary/50'}`}>
                    {m === 'upi' ? 'UPI' : 'Cash'}
                  </button>
                ))}
              </div>
              {paymentMethod === 'upi' && (
                <input className={inputCls} placeholder="UTR / Transaction number" value={utrNumber} onChange={(e) => setUtrNumber(e.target.value)} />
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button onClick={handlePrint} className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-all">
                <Printer size={15} /> Print
              </button>
              <button onClick={handleComplete} disabled={saving} className="flex-1 flex items-center justify-center gap-1.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm">
                {saving ? 'Processing…' : <><CheckCircle size={15} /> Complete Bill</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Success toast with view bill ──────────────────────────────────────── */}
      {lastBill && (
        <div className="fixed bottom-6 right-6 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 max-w-xs z-50 no-print">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-emerald-50 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle size={18} className="text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800 text-sm">Bill Completed</p>
              <p className="text-xs text-gray-400">{lastBill.billNumber} · ₹{lastBill.total?.toFixed(2)}</p>
            </div>
            <button onClick={() => setLastBill(null)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
          </div>
        </div>
      )}

      {/* ── Print-only layout ─────────────────────────────────────────────────── */}
      <div ref={printRef} className="hidden print-only p-8 max-w-md mx-auto font-mono text-sm" style={{ display: 'none' }}>
        <div className="text-center mb-6">
          <h1 className="text-lg font-bold">{shopInfo?.shopName || 'Salon'}</h1>
          {shopInfo?.address && <p>{shopInfo.address}</p>}
          {shopInfo?.phone && <p>{shopInfo.phone}</p>}
          {shopInfo?.gstNumber && <p>GST: {shopInfo.gstNumber}</p>}
          <p className="mt-2 border-t border-b py-1 border-dashed">{new Date().toLocaleString('en-IN')}</p>
        </div>
        {customerName && <p>Customer: {customerName}{customerPhone ? ` | ${customerPhone}` : ''}</p>}
        <table className="w-full mt-3 text-xs">
          <thead><tr className="border-b border-dashed"><th className="text-left">Item</th><th className="text-right">Qty</th><th className="text-right">Price</th><th className="text-right">Total</th></tr></thead>
          <tbody>
            {cartServices.map((s, i) => <tr key={i}><td>{s.name}</td><td className="text-right">{s.quantity}</td><td className="text-right">₹{s.price}</td><td className="text-right">₹{s.price * s.quantity}</td></tr>)}
            {cartProducts.map((p, i) => <tr key={i}><td>{p.productName} ({p.variantSize})</td><td className="text-right">{p.quantity}</td><td className="text-right">₹{p.price}</td><td className="text-right">₹{p.price * p.quantity}</td></tr>)}
          </tbody>
        </table>
        <div className="border-t border-dashed mt-3 pt-3 space-y-1">
          <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
          {discountAmt > 0 && <div className="flex justify-between"><span>Discount</span><span>-₹{discountAmt.toFixed(2)}</span></div>}
          {taxAmt > 0 && <div className="flex justify-between"><span>Tax ({taxPercent}%)</span><span>+₹{taxAmt.toFixed(2)}</span></div>}
          <div className="flex justify-between font-bold border-t border-dashed pt-1"><span>TOTAL</span><span>₹{total.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Payment</span><span className="capitalize">{paymentMethod}</span></div>
          {utrNumber && <div className="flex justify-between"><span>UTR</span><span>{utrNumber}</span></div>}
        </div>
        <p className="text-center mt-6 border-t border-dashed pt-3">Thank you for visiting!</p>
      </div>
    </>
  );
};

export default Billing;
