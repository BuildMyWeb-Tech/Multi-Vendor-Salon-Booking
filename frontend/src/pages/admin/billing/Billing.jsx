import React, { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SalonAdminContext } from '../../../context/SalonAdminContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  ShoppingCart, Search, Plus, Minus, Trash2, CheckCircle,
  Package, Calendar, X, Check, Tag, Receipt,
  Phone, User, Clock, Scissors,
  Maximize2, Minimize2, Gift,
} from 'lucide-react';

const PAYMENT_METHODS = ['cash', 'upi'];

const Billing = () => {
  const { billingApi, appointments, getAllAppointments, shopInfo, backendUrl, saAdminToken } = useContext(SalonAdminContext);
  const navigate = useNavigate();
  const location = useLocation();
  const serviceBilling = shopInfo?.serviceBillingEnabled;
  const productBilling = shopInfo?.productBillingEnabled;

  useEffect(() => {
    if (shopInfo && !serviceBilling && !productBilling) navigate('/admin/dashboard');
  }, [shopInfo]);

  // ── State ─────────────────────────────────────────────────────────────────────
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [aptSearch, setAptSearch] = useState('');
  const [cartServices, setCartServices] = useState([]);
  const [cartProducts, setCartProducts] = useState([]);
  const [linkedAppointment, setLinkedAppointment] = useState(null);
  const [discount, setDiscount] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [generateBill, setGenerateBill] = useState(true); // Yes/No toggle
  const [saving, setSaving] = useState(false);
  const [lastBill, setLastBill] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showServicePicker, setShowServicePicker] = useState(false);
  const [allServices, setAllServices] = useState([]);
  const [allPackages, setAllPackages] = useState([]);
  const [serviceSearch, setServiceSearch] = useState('');

  // Active taxes fetched from API
  const [activeTaxes, setActiveTaxes] = useState([]);

  const containerRef = useRef(null);
  const servicePickerRef = useRef(null);

  // Fetch active taxes for this salon
  useEffect(() => {
    if (!saAdminToken) return;
    axios.get(`${backendUrl}/api/salon-admin/taxes`, { headers: { satoken: saAdminToken } })
      .then(({ data }) => { if (data.success) setActiveTaxes(data.taxes.filter(t => t.isActive)); })
      .catch(() => {});
  }, [saAdminToken]);

  // Fetch services + packages for picker
  useEffect(() => {
    const slug = shopInfo?.slug;
    if (!slug) return;
    axios.get(`${backendUrl}/api/user/services?shopSlug=${slug}`)
      .then(({ data }) => {
        if (data.success) setAllServices(data.services.filter(s => s.isActive !== false));
      }).catch(() => {});
    axios.get(`${backendUrl}/api/user/packages?shopSlug=${slug}`)
      .then(({ data }) => {
        if (data.success) setAllPackages((data.packages || []).filter(p => p.isActive));
      }).catch(() => {});
  }, [shopInfo?.slug]);

  // Close service picker on outside click
  useEffect(() => {
    if (!showServicePicker) return;
    const handler = (e) => {
      if (servicePickerRef.current && !servicePickerRef.current.contains(e.target)) {
        setShowServicePicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showServicePicker]);

  // Auto-load appointment from navigation state
  useEffect(() => {
    const incomingAppt = location.state?.appointment;
    if (!incomingAppt) return;
    setLinkedAppointment(incomingAppt);
    setCustomerName(incomingAppt.userData?.name || '');
    setCustomerPhone(incomingAppt.userData?.phone || '');
    if (incomingAppt.packages?.length > 0) {
      const combo = incomingAppt.packages[0];
      const comboServiceNames = new Set((combo.includedServices || []).map((s) => s.name));
      const comboItem = { name: combo.name || 'Combo Package', price: combo.finalAmount || 0, quantity: 1 };
      const extraItems = (incomingAppt.services || [])
        .filter((s) => !comboServiceNames.has(s.name))
        .map((s) => ({ name: s.name, price: s.price, quantity: 1 }));
      setCartServices([comboItem, ...extraItems]);
    } else if (incomingAppt.services?.length > 0) {
      setCartServices(incomingAppt.services.map((s) => ({ name: s.name, price: s.price, quantity: 1 })));
    } else if (incomingAppt.service) {
      setCartServices([{ name: incomingAppt.service, price: incomingAppt.amount || 0, quantity: 1 }]);
    }
    window.history.replaceState({}, '', window.location.pathname);
  }, []);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // ── Computed ──────────────────────────────────────────────────────────────────
  // Build a map of qty-in-cart for each product variant for real-time stock filtering
  const cartQtyMap = cartProducts.reduce((m, p) => {
    m[`${p.productId}-${p.variantId}`] = p.quantity;
    return m;
  }, {});

  const serviceSubtotal = cartServices.reduce((s, i) => s + i.price * (i.quantity || 1), 0);
  const productSubtotal = cartProducts.reduce((s, i) => s + i.price * i.quantity, 0);
  const subtotal = serviceSubtotal + productSubtotal;
  const discountAmt = parseFloat(discount) || 0;
  const afterDiscount = Math.max(0, subtotal - discountAmt);
  const taxBreakdownCalc = activeTaxes.map(t => ({
    name: t.name,
    percent: t.percent,
    amount: Math.round(afterDiscount * t.percent) / 100,
  }));
  const taxAmt = taxBreakdownCalc.reduce((s, t) => s + t.amount, 0);
  const taxPercent = taxBreakdownCalc.reduce((s, t) => s + t.percent, 0);
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
  const sortedApts = aptSearch
    ? [
        ...filteredApts.filter((a) => a.userData?.name?.toLowerCase().startsWith(aptSearch.toLowerCase())),
        ...filteredApts.filter((a) => !a.userData?.name?.toLowerCase().startsWith(aptSearch.toLowerCase())),
      ]
    : filteredApts;

  // ── Cart helpers ──────────────────────────────────────────────────────────────
  const addServiceToCart = (name, price) => {
    setCartServices((prev) => {
      const inCombo = prev.find((s) => s.isCombo && (s.includedServiceNames || []).includes(name));
      if (inCombo) {
        toast.info(`"${name}" is already included in "${inCombo.name}"`);
        return prev;
      }
      const ex = prev.find((s) => s.name === name && !s.isCombo);
      if (ex) return prev.map((s) => (s.name === name && !s.isCombo) ? { ...s, quantity: (s.quantity || 1) + 1 } : s);
      return [...prev, { name, price, quantity: 1 }];
    });
    setShowServicePicker(false);
    setServiceSearch('');
  };

  const addPackageToCart = (pkg) => {
    const pkgSvcs = allServices.filter(s =>
      (pkg.serviceIds || []).some(id => String(id) === String(s._id))
    );
    const origTotal = pkgSvcs.reduce((sum, s) => sum + (s.basePrice || s.price || 0), 0);
    const comboPrice = pkg.discountPercent
      ? Math.round(origTotal * (1 - pkg.discountPercent / 100))
      : origTotal;
    const includedServiceNames = pkgSvcs.map(s => s.name);

    setCartServices((prev) => {
      if (prev.find((s) => s.isCombo && s.name === pkg.name)) {
        toast.info('Combo already in cart');
        return prev;
      }
      // Remove individual services that are now covered by this combo
      const filtered = prev.filter(s => !(!s.isCombo && includedServiceNames.includes(s.name)));
      return [...filtered, {
        name: pkg.name,
        price: comboPrice,
        quantity: 1,
        isCombo: true,
        includedServiceNames,
        discountPercent: pkg.discountPercent,
        originalAmount: origTotal,
      }];
    });
    setShowServicePicker(false);
    setServiceSearch('');
  };

  const addProduct = (product, variant) => {
    const key = `${product._id}-${variant._id}`;
    setCartProducts((prev) => {
      const ex = prev.find((p) => `${p.productId}-${p.variantId}` === key);
      if (ex) {
        if (ex.quantity >= variant.stock) { toast.error('Not enough stock'); return prev; }
        return prev.map((p) => `${p.productId}-${p.variantId}` === key ? { ...p, quantity: p.quantity + 1 } : p);
      }
      return [...prev, {
        productId: product._id, variantId: variant._id,
        productName: product.name, variantSize: variant.size,
        price: variant.price, quantity: 1, maxStock: variant.stock,
      }];
    });
  };

  const linkAppointment = (apt) => {
    setLinkedAppointment(apt);
    setCustomerName(apt.userData?.name || '');
    setCustomerPhone(apt.userData?.phone || '');
    if (serviceBilling) {
      if (apt.packages?.length > 0) {
        const combo = apt.packages[0];
        const comboServiceNames = new Set(
          (combo.includedServices || []).map((s) => s.name)
        );
        const comboItem = {
          name: combo.name || 'Combo Package',
          price: combo.finalAmount || 0,
          quantity: 1,
        };
        const extraItems = (apt.services || [])
          .filter((s) => !comboServiceNames.has(s.name))
          .map((s) => ({ name: s.name, price: s.price, quantity: 1 }));
        setCartServices([comboItem, ...extraItems]);
      } else if (apt.services?.length) {
        setCartServices(apt.services.map((s) => ({ name: s.name, price: s.price, quantity: 1 })));
      } else if (apt.service) {
        setCartServices([{ name: apt.service, price: apt.amount || 0, quantity: 1 }]);
      }
    }
  };

  const unlinkAppointment = () => {
    setLinkedAppointment(null);
    setCartServices([]);
    setCustomerName('');
    setCustomerPhone('');
  };

  const updateQty = (idx, delta) => {
    setCartProducts((prev) => prev.map((i, n) => {
      if (n !== idx) return i;
      const next = i.quantity + delta;
      if (delta > 0 && i.maxStock != null && next > i.maxStock) { toast.error('Not enough stock'); return i; }
      return { ...i, quantity: Math.max(1, next) };
    }));
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
        taxes: JSON.stringify(taxBreakdownCalc),
        taxPercent, paymentMethod, utrNumber: '',
      });
      if (data.success) {
        setLastBill(data.bill);
        if (generateBill) {
          toast.success('Bill generated!');
          printBill(data.bill);
        } else {
          toast.success('Bill saved (no printout)');
        }
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

  const printBill = (bill) => {
    // Check if linked appointment had a combo package for detailed breakdown
    const combo = linkedAppointment?.packages?.[0];
    const comboServiceNames = combo ? new Set((combo.includedServices || []).map((s) => s.name)) : null;

    const serviceLines = (bill.services || []).map((s) => {
      if (combo && s.name === (combo.name || 'Combo Package')) {
        // Expand combo line with full breakdown
        const includedRows = (combo.includedServices || [])
          .map((is) => `<tr><td style="padding-left:16px;color:#6b7280;font-size:11px">${is.name}</td><td style="text-align:right;color:#6b7280;font-size:11px">₹${is.price?.toFixed(2)}</td></tr>`)
          .join('');
        return `<tr><td><strong>${combo.name}</strong> <span style="font-size:10px;color:#059669">${combo.discountPercent}% off</span></td><td></td></tr>${includedRows}<tr><td style="color:#6b7280;font-size:11px">Original price</td><td style="text-align:right;color:#6b7280;font-size:11px;text-decoration:line-through">₹${combo.originalAmount?.toFixed(2)}</td></tr><tr><td style="color:#059669;font-size:11px">Combo discount</td><td style="text-align:right;color:#059669;font-size:11px">-₹${combo.discountAmount?.toFixed(2)}</td></tr><tr><td style="font-weight:600">Combo price</td><td style="text-align:right;font-weight:600">₹${(s.price * (s.quantity || 1)).toFixed(2)}</td></tr>`;
      }
      return `<tr><td>${s.name}</td><td style="text-align:right">₹${(s.price * (s.quantity || 1)).toFixed(2)}</td></tr>`;
    });
    const lines = [
      ...serviceLines,
      ...(bill.products || []).map(p => `<tr><td>${p.productName} (${p.variantSize}) x${p.quantity}</td><td style="text-align:right">₹${(p.price * p.quantity).toFixed(2)}</td></tr>`),
    ].join('');
    const taxLines = (bill.taxBreakdown && bill.taxBreakdown.length > 0
      ? bill.taxBreakdown
      : bill.tax > 0 ? [{ name: 'Tax', percent: bill.taxPercent, amount: bill.tax }] : []
    ).map(t => `<tr><td>${t.name} (${t.percent}%)</td><td style="text-align:right">+₹${t.amount?.toFixed(2)}</td></tr>`).join('');
    const taxLine = taxLines;
    const discLine = bill.discountAmount > 0
      ? `<tr><td>Discount</td><td style="text-align:right">-₹${bill.discountAmount?.toFixed(2)}</td></tr>` : '';
    const html = `<html><head><style>
      body{font-family:monospace;max-width:320px;margin:auto;padding:16px}
      h2{text-align:center;margin-bottom:4px}p{text-align:center;margin:2px 0;font-size:13px}
      table{width:100%;border-collapse:collapse;margin-top:12px}
      td{padding:4px 2px;font-size:13px}hr{border:none;border-top:1px dashed #999;margin:8px 0}
    </style></head><body>
      <h2>${shopInfo?.shopName || 'Salon'}</h2>
      <p>${bill.billNumber}</p>
      <p>${new Date(bill.createdAt).toLocaleString('en-IN')}</p>
      ${bill.customerName ? `<p>Customer: ${bill.customerName}${bill.customerPhone ? ' · ' + bill.customerPhone : ''}</p>` : ''}
      <hr/><table>${lines}</table><hr/>
      <table>${discLine}${taxLine}
        <tr><td><strong>Total</strong></td><td style="text-align:right"><strong>₹${bill.total?.toFixed(2)}</strong></td></tr>
      </table>
      <hr/><p>Payment: ${bill.paymentMethod?.toUpperCase()}</p>
      <p style="margin-top:12px">Thank you!</p>
    </body></html>`;
    const w = window.open('', '_blank', 'width=400,height=600');
    w.document.write(html); w.document.close();
    setTimeout(() => { w.print(); w.close(); }, 400);
  };

  const resetCart = () => {
    setCartServices([]); setCartProducts([]);
    setLinkedAppointment(null);
    setCustomerName(''); setCustomerPhone('');
    setDiscount(''); setPaymentMethod('cash');
    setGenerateBill(true);
  };

  // ── Filtered service/package picker ──────────────────────────────────────────
  const q = serviceSearch.toLowerCase();
  const filteredServices = allServices.filter(s =>
    !q || s.name.toLowerCase().includes(q) || s.category?.toLowerCase().includes(q)
  );
  const filteredPackages = allPackages.filter(p =>
    !q || p.name.toLowerCase().includes(q)
  );

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary bg-white';

  return (
    <div
      ref={containerRef}
      className={`flex flex-col xl:flex-row gap-5 ${isFullscreen ? 'bg-white p-6 overflow-auto' : ''}`}
    >
      {/* ── LEFT ──────────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <ShoppingCart size={18} className="text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-800">Billing / POS</h1>
            <p className="text-xs text-gray-400">Create a new bill</p>
          </div>
          <button
            onClick={toggleFullscreen}
            className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-500 transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>

        {/* Upcoming Appointments */}
        {serviceBilling && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <Calendar size={15} className="text-primary" />
                <span className="text-sm font-semibold text-gray-700">Upcoming Appointments</span>
                <span className="bg-primary/10 text-primary text-xs font-medium px-2 py-0.5 rounded-full">
                  {activeApts.length}
                </span>
              </div>
            </div>
            <div className="px-4 py-3 border-b border-gray-50">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary bg-gray-50"
                  placeholder="Search by name, phone or stylist…"
                  value={aptSearch}
                  onChange={(e) => setAptSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
              {sortedApts.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-gray-400">
                  <Calendar size={28} className="opacity-40" />
                  <p className="text-xs">No upcoming appointments</p>
                </div>
              ) : (
                sortedApts.map((a) => {
                  const isLinked = linkedAppointment?._id === a._id;
                  const initials =
                    a.userData?.name
                      ?.split(' ')
                      .map((w) => w[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2) || '?';
                  return (
                    <button
                      key={a._id}
                      onClick={() => (isLinked ? unlinkAppointment() : linkAppointment(a))}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all ${isLinked ? 'bg-primary/5 border-l-[3px] border-primary' : 'hover:bg-gray-50 border-l-[3px] border-transparent'}`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${isLinked ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}`}
                      >
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-800 truncate">
                            {a.userData?.name || 'Customer'}
                          </p>
                          {a.userData?.phone && (
                            <span className="flex items-center gap-0.5 text-xs text-gray-400 shrink-0">
                              <Phone size={10} />
                              {a.userData.phone}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                          <span className="flex items-center gap-0.5">
                            <Scissors size={10} />
                            {a.docData?.name || '—'}
                          </span>
                          <span className="text-gray-200">·</span>
                          <span className="flex items-center gap-0.5">
                            <Calendar size={10} />
                            {a.slotDate}
                          </span>
                          <span className="text-gray-200">·</span>
                          <span className="flex items-center gap-0.5">
                            <Clock size={10} />
                            {a.slotTime}
                          </span>
                        </div>
                      </div>
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
                })
              )}
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
                  <span className="bg-primary/10 text-primary text-xs font-medium px-2 py-0.5 rounded-full">
                    {products.length}
                  </span>
                )}
              </div>
            </div>
            <div className="px-4 py-3 border-b border-gray-50">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
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
              ) : (
                products.map((p) =>
                  p.variants.filter((v) => {
                    const inCart = cartQtyMap[`${p._id}-${v._id}`] || 0;
                    return v.stock - inCart > 0;
                  }).map((v) => {
                    const inCart = cartQtyMap[`${p._id}-${v._id}`] || 0;
                    const effectiveStock = v.stock - inCart;
                    const outOfStock = false;
                    const lowStock = effectiveStock <= (v.lowStockThreshold || 5);
                    return (
                      <button
                        key={`${p._id}-${v._id}`}
                        onClick={() => addProduct(p, v)}
                        disabled={outOfStock}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${outOfStock ? 'opacity-40 cursor-not-allowed bg-gray-50/50' : 'hover:bg-gray-50'}`}
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${outOfStock ? 'bg-gray-100' : 'bg-primary/10'}`}
                        >
                          <Package
                            size={15}
                            className={outOfStock ? 'text-gray-400' : 'text-primary'}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                            <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-md shrink-0">
                              {v.size}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-semibold text-primary">₹{v.price}</span>
                            <span className="text-gray-200">·</span>
                            {outOfStock ? (
                              <span className="text-xs font-medium text-red-500">Out of stock</span>
                            ) : lowStock ? (
                              <span className="text-xs font-medium text-amber-500">
                                Only {effectiveStock} left
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">{effectiveStock} in stock</span>
                            )}
                          </div>
                        </div>
                        {!outOfStock && (
                          <div className="w-7 h-7 rounded-full border border-primary/30 bg-primary/5 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors shrink-0">
                            <Plus size={13} />
                          </div>
                        )}
                      </button>
                    );
                  })
                )
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
              <button
                onClick={resetCart}
                className="text-xs text-red-400 hover:text-red-500 flex items-center gap-1"
              >
                <X size={11} /> Clear
              </button>
            )}
          </div>

          <div className="p-5 space-y-4">
            {/* Add Service button + picker */}
            {serviceBilling && (
              <div ref={servicePickerRef} className="relative">
                <button
                  onClick={() => {
                    setShowServicePicker((v) => !v);
                    setServiceSearch('');
                  }}
                  className="flex items-center gap-1.5 text-xs text-primary border border-primary/30 px-3 py-1.5 rounded-lg hover:bg-primary/5 transition-colors"
                >
                  <Plus size={12} /> Add Service
                </button>
                {showServicePicker && (
                  <div className="absolute left-0 top-full mt-1 z-30 w-72 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                    <div className="relative p-2 border-b border-gray-100">
                      <Search
                        size={12}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        autoFocus
                        className="w-full pl-7 pr-3 py-1.5 text-xs focus:outline-none"
                        placeholder="Search services or packages…"
                        value={serviceSearch}
                        onChange={(e) => setServiceSearch(e.target.value)}
                      />
                    </div>
                    <div className="max-h-52 overflow-y-auto divide-y divide-gray-50">
                      {/* Packages */}
                      {filteredPackages.length > 0 && (
                        <>
                          <div className="px-3 py-1.5 bg-gray-50">
                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                              <Gift size={10} /> Combo Packages
                            </span>
                          </div>
                          {filteredPackages.map((pkg) => (
                            <button
                              key={pkg._id}
                              onClick={() => addPackageToCart(pkg)}
                              className="w-full flex items-center justify-between px-3 py-2 hover:bg-primary/5 text-left transition-colors"
                            >
                              <div>
                                <p className="text-xs font-semibold text-gray-800">{pkg.name}</p>
                                <p className="text-[10px] text-gray-400">
                                  {pkg.serviceIds?.length || 0} services
                                </p>
                              </div>
                              {pkg.discountPercent > 0 && (
                                <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-semibold">
                                  {pkg.discountPercent}% off
                                </span>
                              )}
                            </button>
                          ))}
                        </>
                      )}
                      {/* Services */}
                      {filteredServices.length > 0 && (
                        <>
                          <div className="px-3 py-1.5 bg-gray-50">
                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                              <Scissors size={10} /> Services
                            </span>
                          </div>
                          {filteredServices.map((svc) => (
                            <button
                              key={svc._id}
                              onClick={() =>
                                addServiceToCart(svc.name, svc.basePrice || svc.price || 0)
                              }
                              className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 text-left transition-colors"
                            >
                              <span className="text-xs font-medium text-gray-700">{svc.name}</span>
                              <span className="text-xs text-primary font-semibold">
                                ₹{svc.basePrice || svc.price || 0}
                              </span>
                            </button>
                          ))}
                        </>
                      )}
                      {filteredServices.length === 0 && filteredPackages.length === 0 && (
                        <p className="text-center text-xs text-gray-400 py-6">No results</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Cart items */}
            <div className="space-y-2 min-h-[60px] max-h-64 overflow-y-auto">
              {cartServices.length === 0 && cartProducts.length === 0 ? (
                <p className="text-center text-gray-300 text-xs py-5">No items added yet</p>
              ) : null}
              {cartServices.map((s, i) => (
                <div key={i} className="flex items-start gap-2 py-1">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${s.isCombo ? 'bg-violet-50' : 'bg-blue-50'}`}>
                    {s.isCombo ? <Gift size={12} className="text-violet-500" /> : <Scissors size={12} className="text-blue-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${s.isCombo ? 'text-violet-700' : 'text-gray-800'}`}>{s.name}</p>
                    {s.isCombo && s.discountPercent > 0 ? (
                      <p className="text-[10px] text-gray-400">
                        Combo · <span className="line-through">₹{s.originalAmount}</span>
                        <span className="text-emerald-600 font-semibold ml-1">{s.discountPercent}% off</span>
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400">Service · ₹{s.price}</p>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-gray-700 w-14 text-right flex-shrink-0 mt-0.5">
                    ₹{s.price * (s.quantity || 1)}
                  </p>
                  <button
                    onClick={() => removeItem('service', i)}
                    className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-50 text-gray-300 hover:text-red-400 flex-shrink-0"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
              {cartProducts.map((p, i) => (
                <div key={i} className="flex items-center gap-2 py-1">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Package size={12} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{p.productName}</p>
                    <p className="text-xs text-gray-400">
                      {p.variantSize} · ₹{p.price}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => updateQty(i, -1)}
                      className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-500"
                    >
                      <Minus size={10} />
                    </button>
                    <span className="w-5 text-center text-xs font-semibold text-gray-700">
                      {p.quantity}
                    </span>
                    <button
                      onClick={() => updateQty(i, 1)}
                      disabled={p.maxStock != null && p.quantity >= p.maxStock}
                      className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Plus size={10} />
                    </button>
                  </div>
                  <p className="text-sm font-semibold text-gray-700 w-14 text-right flex-shrink-0">
                    ₹{p.price * p.quantity}
                  </p>
                  <button
                    onClick={() => removeItem('product', i)}
                    className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-50 text-gray-300 hover:text-red-400 flex-shrink-0"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>

            {/* Discount */}
            <div className="border-t border-gray-50 pt-3">
              <div className="flex items-center gap-2 mb-1.5">
                <Tag size={13} className="text-gray-400" />
                <span className="text-xs text-gray-500 font-medium">Discount (₹)</span>
              </div>
              <input
                type="number"
                min="0"
                className={inputCls}
                placeholder="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
            </div>

            {/* Totals */}
            <div className="border-t border-gray-100 pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {discountAmt > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span>-₹{discountAmt.toFixed(2)}</span>
                </div>
              )}
              {taxBreakdownCalc.map((t, i) => (
                <div key={i} className="flex justify-between text-gray-500">
                  <span>
                    {t.name} ({t.percent}%)
                  </span>
                  <span>+₹{t.amount.toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-gray-800 text-base border-t border-gray-100 pt-2 mt-1">
                <span>Total</span>
                <span className="text-primary">₹{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Customer info */}
            <div className="space-y-2">
              <p className="text-xs text-gray-500 font-medium">Customer</p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <User
                    size={13}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    className="w-full border border-gray-200 rounded-xl pl-7 pr-3 py-2 text-sm focus:outline-none focus:border-primary bg-gray-50"
                    placeholder="Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <div className="relative flex-1">
                  <Phone
                    size={13}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />
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
                  <button
                    key={m}
                    onClick={() => setPaymentMethod(m)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${paymentMethod === m ? 'bg-primary text-white border-primary shadow-sm shadow-primary/20' : 'bg-white text-gray-600 border-gray-200 hover:border-primary/40'}`}
                  >
                    {m === 'upi' ? 'UPI' : 'Cash'}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Bill? Yes / No */}
            <div className="space-y-2">
              <p className="text-xs text-gray-500 font-medium">Generate Bill?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setGenerateBill(true)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${generateBill ? 'bg-blue-700 text-white border-blue-500' : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'}`}
                >
                  Yes
                </button>
                <button
                  onClick={() => setGenerateBill(false)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${!generateBill ? 'bg-blue-700 text-white border-blue-500' : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'}`}
                >
                  No
                </button>
              </div>
            </div>

            {/* Complete */}
            <button
              onClick={handleComplete}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-semibold transition-all shadow-sm shadow-primary/20"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{' '}
                  Processing…
                </>
              ) : (
                <>
                  <CheckCircle size={16} /> {generateBill ? 'Generate Bill' : 'Save Bill'}
                </>
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
              <p className="font-semibold text-gray-800 text-sm">
                Bill {generateBill ? 'Generated' : 'Saved'}
              </p>
              <p className="text-xs text-gray-400">
                {lastBill.billNumber} · ₹{lastBill.total?.toFixed(2)}
              </p>
            </div>
            <button onClick={() => setLastBill(null)} className="text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;
