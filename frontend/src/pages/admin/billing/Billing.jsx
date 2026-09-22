import React, { useContext, useEffect, useState } from 'react';
import { SalonAdminContext } from '../../../context/SalonAdminContext';
import { toast } from 'react-toastify';
import {
  ShoppingCart, Search, Plus, Minus, Trash2, CheckCircle,
  Package, Calendar, X, Pencil, Check, Tag, Receipt,
  Phone, User, Clock, Scissors, ChevronRight, BoxesIcon,
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
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [saving, setSaving] = useState(false);
  const [lastBill, setLastBill] = useState(null);

  // ── Computed ──────────────────────────────────────────────────────────────────
  const serviceSubtotal = cartServices.reduce((s, i) => s + i.price, 0);
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
    setCustomerName(apt.userData?.name || '');
    setCustomerPhone(apt.userData?.phone || '');
    // Replace services with those from the appointment (not accumulate)
    if (serviceBilling && apt.services?.length) {
      setCartServices(apt.services.map((s) => ({ name: s.name, price: s.price, quantity: 1 })));
    } else if (serviceBilling && apt.service) {
      setCartServices([{ name: apt.service, price: apt.amount || 0, quantity: 1 }]);
    }
  };

  const unlinkAppointment = () => {
    setLinkedAppointment(null);
    setCartServices([]);
    setCustomerName('');
    setCustomerPhone('');
  };

  const updateQty = (idx, delta) => {
    setCartProducts((prev) => prev.map((i, n) => n !== idx ? i : { ...i, quantity: Math.max(1, i.quantity + delta) }));
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
    setSaving(true);
    try {
      const { data } = await billingApi.createBill({
        appointmentId: linkedAppointment?._id || null,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        services: JSON.stringify(cartServices),
        products: JSON.stringify(cartProducts),
        discount, discountType: 'flat',
        taxPercent, paymentMethod, utrNumber: '',
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
    setCustomerName(''); setCustomerPhone('');
    setDiscount(''); setPaymentMethod('cash');
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
            <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
              {sortedApts.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-gray-400">
                  <Calendar size={28} className="opacity-40" />
                  <p className="text-xs">No upcoming appointments</p>
                </div>
              ) : sortedApts.map((a) => {
                const isLinked = linkedAppointment?._id === a._id;
                const initials = a.userData?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
                return (
                  <button
                    key={a._id}
                    onClick={() => isLinked ? unlinkAppointment() : linkAppointment(a)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all ${isLinked ? 'bg-primary/5 border-l-[3px] border-primary' : 'hover:bg-gray-50 border-l-[3px] border-transparent'}`}
                  >
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${isLinked ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}`}>
                      {initials}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      {/* Line 1: Customer name + phone */}
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-800 truncate">{a.userData?.name || 'Customer'}</p>
                        {a.userData?.phone && (
                          <span className="flex items-center gap-0.5 text-xs text-gray-400 shrink-0">
                            <Phone size={10} />
                            {a.userData.phone}
                          </span>
                        )}
                      </div>
                      {/* Line 2: Stylist · date · time */}
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                        <span className="flex items-center gap-0.5"><Scissors size={10} />{a.docData?.name || '—'}</span>
                        <span className="text-gray-200">·</span>
                        <span className="flex items-center gap-0.5"><Calendar size={10} />{a.slotDate}</span>
                        <span className="text-gray-200">·</span>
                        <span className="flex items-center gap-0.5"><Clock size={10} />{a.slotTime}</span>
                      </div>
                    </div>

                    {/* Action */}
                    {isLinked ? (
                      <span className="flex items-center gap-1 text-xs text-primary font-semibold bg-primary/10 px-2 py-1 rounded-lg shrink-0">
                        <Check size={11} /> Linked
                      </span>
                    ) : (
                      <div className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-300 hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors shrink-0">
                        <Plus size={13} />
                      </div>
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
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <Package size={15} className="text-primary" />
                <span className="text-sm font-semibold text-gray-700">Products</span>
                {products.length > 0 && (
                  <span className="bg-primary/10 text-primary text-xs font-medium px-2 py-0.5 rounded-full">{products.length}</span>
                )}
              </div>
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
            <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
              {products.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-gray-400">
                  <Package size={28} className="opacity-40" />
                  <p className="text-xs">No products found</p>
                </div>
              ) : products.map((p) =>
                p.variants.map((v) => {
                  const outOfStock = v.stock === 0;
                  const lowStock = v.stock > 0 && v.stock <= (v.lowStockThreshold || 5);
                  return (
                    <button
                      key={`${p._id}-${v._id}`}
                      onClick={() => addProduct(p, v)}
                      disabled={outOfStock}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${outOfStock ? 'opacity-40 cursor-not-allowed bg-gray-50/50' : 'hover:bg-gray-50'}`}
                    >
                      {/* Icon */}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${outOfStock ? 'bg-gray-100' : 'bg-primary/10'}`}>
                        <Package size={15} className={outOfStock ? 'text-gray-400' : 'text-primary'} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                          <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-md shrink-0">{v.size}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-semibold text-primary">₹{v.price}</span>
                          <span className="text-gray-200">·</span>
                          {outOfStock ? (
                            <span className="text-xs font-medium text-red-500">Out of stock</span>
                          ) : lowStock ? (
                            <span className="text-xs font-medium text-amber-500">Only {v.stock} left</span>
                          ) : (
                            <span className="text-xs text-gray-400">{v.stock} in stock</span>
                          )}
                        </div>
                      </div>

                      {/* Add button */}
                      {!outOfStock && (
                        <div className="w-7 h-7 rounded-full border border-primary/30 bg-primary/5 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors shrink-0">
                          <Plus size={13} />
                        </div>
                      )}
                    </button>
                  );
                })
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

              {/* Services — no qty controls, just name + price + delete */}
              {cartServices.map((s, i) => (
                <div key={i} className="flex items-center gap-2 py-1">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Scissors size={12} className="text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{s.name}</p>
                    <p className="text-xs text-gray-400">Service · ₹{s.price}</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-700 w-14 text-right flex-shrink-0">₹{s.price}</p>
                  <button onClick={() => removeItem('service', i)} className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-50 text-gray-300 hover:text-red-400 flex-shrink-0"><Trash2 size={11} /></button>
                </div>
              ))}

              {/* Products — keep qty +/- controls */}
              {cartProducts.map((p, i) => (
                <div key={i} className="flex items-center gap-2 py-1">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Package size={12} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{p.productName}</p>
                    <p className="text-xs text-gray-400">{p.variantSize} · ₹{p.price}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => updateQty(i, -1)} className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-500"><Minus size={10} /></button>
                    <span className="w-5 text-center text-xs font-semibold text-gray-700">{p.quantity}</span>
                    <button onClick={() => updateQty(i, 1)} className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-500"><Plus size={10} /></button>
                  </div>
                  <p className="text-sm font-semibold text-gray-700 w-14 text-right flex-shrink-0">₹{p.price * p.quantity}</p>
                  <button onClick={() => removeItem('product', i)} className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-50 text-gray-300 hover:text-red-400 flex-shrink-0"><Trash2 size={11} /></button>
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

            {/* Customer info */}
            <div className="space-y-2">
              <p className="text-xs text-gray-500 font-medium">Customer</p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <User size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    className="w-full border border-gray-200 rounded-xl pl-7 pr-3 py-2 text-sm focus:outline-none focus:border-primary bg-gray-50"
                    placeholder="Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <div className="relative flex-1">
                  <Phone size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    className="w-full border border-gray-200 rounded-xl pl-7 pr-3 py-2 text-sm focus:outline-none focus:border-primary bg-gray-50"
                    placeholder="Phone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </div>
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
