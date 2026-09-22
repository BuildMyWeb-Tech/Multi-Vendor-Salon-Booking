import React, { useContext, useEffect, useState } from 'react';
import { SalonAdminContext } from '../../../context/SalonAdminContext';
import { toast } from 'react-toastify';
import {
  ShoppingCart, Search, Plus, Minus, Trash2, CheckCircle,
  Package, Calendar, X, Pencil, Check, Tag, Receipt,
} from 'lucide-react';

const PAYMENT_METHODS = ['cash', 'upi'];

// Tax stored per-session in localStorage (one-time setting)
const TAX_KEY = 'billing_tax_percent';
const getSavedTax = () => {
  try { return parseFloat(localStorage.getItem(TAX_KEY) || '0') || 0; } catch { return 0; }
};

const Billing = () => {
  const { billingApi, appointments, getAllAppointments, shopInfo } = useContext(SalonAdminContext);
  const serviceBilling = shopInfo?.serviceBillingEnabled;
  const productBilling = shopInfo?.productBillingEnabled;

  // ── State ─────────────────────────────────────────────────────────────────────
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [aptSearch, setAptSearch] = useState('');
  const [cartServices, setCartServices] = useState([]);
  const [cartProducts, setCartProducts] = useState([]);
  const [linkedAppointment, setLinkedAppointment] = useState(null);
  const [discount, setDiscount] = useState('');
  const [taxPercent, setTaxPercent] = useState(getSavedTax());
  const [editingTax, setEditingTax] = useState(false);
  const [taxInput, setTaxInput] = useState(String(getSavedTax()));
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [utrNumber, setUtrNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastBill, setLastBill] = useState(null);

  // ── Computed ──────────────────────────────────────────────────────────────────
  const serviceSubtotal = cartServices.reduce((s, i) => s + i.price * i.quantity, 0);
  const productSubtotal = cartProducts.reduce((s, i) => s + i.price * i.quantity, 0);
  const subtotal = serviceSubtotal + productSubtotal;
  const discountAmt = parseFloat(discount) || 0;
  const afterDiscount = Math.max(0, subtotal - discountAmt);
  const taxAmt = Math.round(afterDiscount * taxPercent) / 100;
  const total = afterDiscount + taxAmt;

  // ── Data fetch ────────────────────────────────────────────────────────────────
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

  // ── Tax save ──────────────────────────────────────────────────────────────────
  const saveTax = () => {
    const val = parseFloat(taxInput) || 0;
    setTaxPercent(val);
    try { localStorage.setItem(TAX_KEY, String(val)); } catch {}
    setEditingTax(false);
  };

  // ── Appointments filter ───────────────────────────────────────────────────────
  const activeApts = (appointments || []).filter((a) => !a.cancelled && !a.isCompleted);
  const filteredApts = aptSearch.length < 1
    ? activeApts
    : activeApts.filter((a) => {
        const q = aptSearch.toLowerCase();
        return (
          a.userData?.name?.toLowerCase().includes(q) ||
          a.userData?.phone?.includes(q) ||
          a.docData?.name?.toLowerCase().includes(q)
        );
      });
  // When searching, exact matches / starts-with come first
  const sortedApts = aptSearch
    ? [
        ...filteredApts.filter((a) => a.userData?.name?.toLowerCase().startsWith(aptSearch.toLowerCase())),
        ...filteredApts.filter((a) => !a.userData?.name?.toLowerCase().startsWith(aptSearch.toLowerCase())),
      ]
    : filteredApts;

  // ── Cart helpers ──────────────────────────────────────────────────────────────
  const addService = (service) => {
    setCartServices((prev) => {
      const ex = prev.find((s) => s.name === service.name);
      if (ex) return prev.map((s) => s.name === service.name ? { ...s, quantity: s.quantity + 1 } : s);
      return [...prev, { name: service.name, price: service.price, quantity: 1 }];
    });
  };

  const addProduct = (product, variant) => {
    const key = `${product._id}-${variant._id}`;
    setCartProducts((prev) => {
      const ex = prev.find((p) => `${p.productId}-${p.variantId}` === key);
      if (ex) return prev.map((p) => `${p.productId}-${p.variantId}` === key ? { ...p, quantity: p.quantity + 1 } : p);
      return [...prev, {
        productId: product._id, variantId: variant._id,
        productName: product.name, variantSize: variant.size,
        price: variant.price, quantity: 1,
      }];
    });
  };

  const linkAppointment = (apt) => {
    setLinkedAppointment(apt);
    if (serviceBilling && apt.services?.length) {
      apt.services.forEach((s) => addService(s));
    } else if (serviceBilling && apt.service) {
      addService({ name: apt.service, price: apt.amount || 0 });
    }
  };

  const updateQty = (type, idx, delta) => {
    const setter = type === 'service' ? setCartServices : setCartProducts;
    setter((prev) => prev.map((i, n) => n !== idx ? i : { ...i, quantity: Math.max(1, i.quantity + delta) }));
  };

  const removeItem = (type, idx) => {
    if (type === 'service') setCartServices((p) => p.filter((_, i) => i !== idx));
    else setCartProducts((p) => p.filter((_, i) => i !== idx));
  };

  // ── Submit ────────────────────────────────────────────────────────────────────
  const handleComplete = async () => {
    if (cartServices.length === 0 && cartProducts.length === 0) {
      toast.error('Add at least one service or product'); return;
    }
    if (paymentMethod === 'upi' && !utrNumber.trim()) {
      toast.error('Enter UTR number for UPI payment'); return;
    }
    setSaving(true);
    try {
      const { data } = await billingApi.createBill({
        appointmentId: linkedAppointment?._id || null,
        services: JSON.stringify(cartServices),
        products: JSON.stringify(cartProducts),
        discount, discountType: 'flat',
        taxPercent, paymentMethod, utrNumber,
      });
      if (data.success) {
        toast.success('Bill completed!');
        setLastBill(data.bill);
        resetCart();
        getAllAppointments();
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
    setCartServices([]); setCartProducts([]);
    setLinkedAppointment(null);
    setDiscount(''); setPaymentMethod('cash'); setUtrNumber('');
  };

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary bg-white';

  return (
    <div className="flex flex-col xl:flex-row gap-5">
      {/* ── LEFT ──────────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <ShoppingCart size={18} className="text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Billing / POS</h1>
            <p className="text-xs text-gray-400">Create a new bill</p>
          </div>
        </div>

        {/* Upcoming Appointments */}
        {serviceBilling && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <Calendar size={15} className="text-primary" />
                <span className="text-sm font-semibold text-gray-700">Upcoming Appointments</span>
                <span className="bg-primary/10 text-primary text-xs font-medium px-2 py-0.5 rounded-full">{activeApts.length}</span>
              </div>
            </div>

            {/* Search */}
            <div className="px-4 py-3 border-b border-gray-50">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary bg-gray-50"
                  placeholder="Search by name, phone or stylist…"
                  value={aptSearch}
                  onChange={(e) => setAptSearch(e.target.value)}
                />
              </div>
            </div>

            {/* List */}
            <div className="max-h-60 overflow-y-auto divide-y divide-gray-50">
              {sortedApts.length === 0 ? (
                <p className="text-center text-gray-400 text-xs py-8">No upcoming appointments</p>
              ) : sortedApts.map((a) => {
                const isLinked = linkedAppointment?._id === a._id;
                return (
                  <button
                    key={a._id}
                    onClick={() => isLinked ? setLinkedAppointment(null) : linkAppointment(a)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isLinked ? 'bg-primary/5 border-l-2 border-primary' : 'hover:bg-gray-50/80'}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary">
                      {a.userData?.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{a.userData?.name || 'Customer'}</p>
                      <p className="text-xs text-gray-400 truncate">{a.slotDate} · {a.slotTime} · {a.docData?.name}</p>
                    </div>
                    {isLinked ? (
                      <span className="text-xs text-primary font-medium flex items-center gap-1"><Check size={12} /> Linked</span>
                    ) : (
                      <Plus size={15} className="text-gray-300 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Products */}
        {productBilling && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-50">
              <Package size={15} className="text-primary" />
              <span className="text-sm font-semibold text-gray-700">Products</span>
            </div>
            <div className="px-4 py-3 border-b border-gray-50">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary bg-gray-50"
                  placeholder="Search products…"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="max-h-56 overflow-y-auto divide-y divide-gray-50">
              {products.length === 0 ? (
                <p className="text-center text-gray-400 text-xs py-8">No products found</p>
              ) : products.map((p) =>
                p.variants.map((v) => (
                  <button
                    key={`${p._id}-${v._id}`}
                    onClick={() => addProduct(p, v)}
                    disabled={v.stock === 0}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${v.stock === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-50/80'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Package size={13} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{p.name} <span className="text-gray-400 text-xs">({v.size})</span></p>
                        <p className="text-xs text-gray-400">₹{v.price} · {v.stock} in stock</p>
                      </div>
                    </div>
                    <Plus size={14} className="text-primary flex-shrink-0" />
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── RIGHT: Bill Summary ───────────────────────────────────────────────── */}
      <div className="xl:w-[380px] flex-shrink-0">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm xl:sticky xl:top-4 overflow-hidden">
          {/* Bill header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <Receipt size={16} className="text-primary" />
              <span className="font-bold text-gray-800">Bill Summary</span>
            </div>
            {(cartServices.length > 0 || cartProducts.length > 0) && (
              <button onClick={resetCart} className="text-xs text-red-400 hover:text-red-500 flex items-center gap-1">
                <X size={11} /> Clear
              </button>
            )}
          </div>

          <div className="p-5 space-y-4">
            {/* Cart items */}
            <div className="space-y-2 min-h-[60px] max-h-72 overflow-y-auto">
              {cartServices.length === 0 && cartProducts.length === 0 ? (
                <p className="text-center text-gray-300 text-xs py-5">No items added yet</p>
              ) : null}

              {cartServices.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{s.name}</p>
                    <p className="text-xs text-gray-400">₹{s.price} × {s.quantity}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => updateQty('service', i, -1)} className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-500"><Minus size={10} /></button>
                    <span className="w-5 text-center text-xs font-semibold text-gray-700">{s.quantity}</span>
                    <button onClick={() => updateQty('service', i, 1)} className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-500"><Plus size={10} /></button>
                    <button onClick={() => removeItem('service', i)} className="w-6 h-6 ml-1 rounded-full flex items-center justify-center hover:bg-red-50 text-gray-300 hover:text-red-400"><Trash2 size={11} /></button>
                  </div>
                  <p className="text-sm font-semibold text-gray-700 w-14 text-right flex-shrink-0">₹{s.price * s.quantity}</p>
                </div>
              ))}

              {cartProducts.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{p.productName}</p>
                    <p className="text-xs text-gray-400">{p.variantSize} · ₹{p.price} × {p.quantity}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => updateQty('product', i, -1)} className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-500"><Minus size={10} /></button>
                    <span className="w-5 text-center text-xs font-semibold text-gray-700">{p.quantity}</span>
                    <button onClick={() => updateQty('product', i, 1)} className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-500"><Plus size={10} /></button>
                    <button onClick={() => removeItem('product', i)} className="w-6 h-6 ml-1 rounded-full flex items-center justify-center hover:bg-red-50 text-gray-300 hover:text-red-400"><Trash2 size={11} /></button>
                  </div>
                  <p className="text-sm font-semibold text-gray-700 w-14 text-right flex-shrink-0">₹{p.price * p.quantity}</p>
                </div>
              ))}
            </div>

            {/* Discount */}
            <div className="border-t border-gray-50 pt-3">
              <div className="flex items-center gap-2">
                <Tag size={13} className="text-gray-400" />
                <span className="text-xs text-gray-500 font-medium">Discount (₹)</span>
              </div>
              <input
                type="number" min="0"
                className={`${inputCls} mt-1.5`}
                placeholder="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
            </div>

            {/* Tax — one-time setting */}
            <div className="border border-gray-100 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-500 font-medium">Tax Rate (%)</span>
                </div>
                {!editingTax ? (
                  <button onClick={() => { setTaxInput(String(taxPercent)); setEditingTax(true); }}
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 border border-primary/20 px-2 py-0.5 rounded-lg hover:bg-primary/5">
                    <Pencil size={10} /> Edit
                  </button>
                ) : (
                  <button onClick={saveTax} className="flex items-center gap-1 text-xs text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-lg hover:bg-emerald-50">
                    <Check size={10} /> Save
                  </button>
                )}
              </div>
              {editingTax ? (
                <input
                  type="number" min="0" max="100" autoFocus
                  className={inputCls}
                  value={taxInput}
                  onChange={(e) => setTaxInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveTax()}
                />
              ) : (
                <p className="text-lg font-bold text-gray-800">{taxPercent}%
                  {taxPercent > 0 && <span className="text-xs font-normal text-gray-400 ml-1">(₹{taxAmt.toFixed(2)})</span>}
                </p>
              )}
            </div>

            {/* Totals */}
            <div className="border-t border-gray-100 pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
              {discountAmt > 0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><span>-₹{discountAmt.toFixed(2)}</span></div>}
              {taxAmt > 0 && <div className="flex justify-between text-gray-500"><span>Tax ({taxPercent}%)</span><span>+₹{taxAmt.toFixed(2)}</span></div>}
              <div className="flex justify-between font-bold text-gray-800 text-base border-t border-gray-100 pt-2 mt-1">
                <span>Total</span><span className="text-primary">₹{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment method */}
            <div className="space-y-2">
              <p className="text-xs text-gray-500 font-medium">Payment Method</p>
              <div className="flex gap-2">
                {PAYMENT_METHODS.map((m) => (
                  <button key={m} onClick={() => setPaymentMethod(m)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${paymentMethod === m ? 'bg-primary text-white border-primary shadow-sm shadow-primary/20' : 'bg-white text-gray-600 border-gray-200 hover:border-primary/40'}`}>
                    {m === 'upi' ? 'UPI' : 'Cash'}
                  </button>
                ))}
              </div>
              {paymentMethod === 'upi' && (
                <input className={inputCls} placeholder="UTR / Transaction number" value={utrNumber} onChange={(e) => setUtrNumber(e.target.value)} />
              )}
            </div>

            {/* Complete */}
            <button
              onClick={handleComplete}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-semibold transition-all shadow-sm shadow-primary/20"
            >
              {saving ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing…</>
              ) : (
                <><CheckCircle size={16} /> Complete Bill</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Success chip ──────────────────────────────────────────────────────── */}
      {lastBill && (
        <div className="fixed bottom-6 right-6 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 max-w-xs z-50">
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
    </div>
  );
};

export default Billing;
