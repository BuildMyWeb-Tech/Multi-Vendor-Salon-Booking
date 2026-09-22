import React, { useContext, useEffect, useState } from 'react';
import { SalonAdminContext } from '../../../context/SalonAdminContext';
import { toast } from 'react-toastify';
import { Receipt, Search, Eye, X, RefreshCw, AlertTriangle, Printer, Trash2, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const statusBadge = {
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled:  'bg-red-50 text-red-600 border-red-200',
};

const Bills = () => {
  const { billingApi, shopInfo } = useContext(SalonAdminContext);
  const [bills, setBills]               = useState([]);
  const [total, setTotal]               = useState(0);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage]                 = useState(1);
  const [viewBill, setViewBill]         = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling]     = useState(false);

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

  // ── Colour palette ────────────────────────────────────────────────────────
  const BLUE      = [30,  90, 200];   // deep blue header / accents
  const BLUE_MID  = [52, 120, 220];   // mid blue for sub-elements
  const BLUE_LIGHT= [235, 242, 255];  // very light blue alt rows / shaded areas
  const GREY      = [100, 110, 125];
  const DARK      = [25,  30,  40];

  // ── Draw page header (shop info) ─────────────────────────────────────────
  const drawPageHeader = (doc, shop) => {
    // Deep blue top band
    doc.setFillColor(...BLUE);
    doc.rect(0, 0, 210, 32, 'F');

    // Left: white diagonal accent stripe
    doc.setFillColor(255, 255, 255, 0.06);
    doc.triangle(0, 0, 50, 0, 0, 32, 'F');

    // Shop name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text(shop?.shopName || 'Salon', 14, 14);

    // Shop info (small, white, right of name)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(200, 215, 240);
    const infoParts = [
      shop?.address,
      shop?.phone     ? `☎ ${shop.phone}`       : null,
      shop?.gstNumber ? `GST: ${shop.gstNumber}`     : null,
    ].filter(Boolean);
    doc.text(infoParts.join('   '), 14, 21);

    // Right: "BILLS REPORT" label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text('BILLS REPORT', 196, 13, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(200, 215, 240);
    doc.text(
      `Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`,
      196, 21, { align: 'right' }
    );

    // Thin accent line below header
    doc.setDrawColor(...BLUE_MID);
    doc.setLineWidth(0.8);
    doc.line(0, 32, 210, 32);
  };

  // ── Draw page footer ──────────────────────────────────────────────────────
  const drawPageFooter = (doc, pageNum) => {
    doc.setFillColor(...BLUE_LIGHT);
    doc.rect(0, 286, 210, 11, 'F');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(...GREY);
    doc.text('Thank you for your business!', 14, 292);
    doc.setFont('helvetica', 'normal');
    doc.text(`Page ${pageNum}`, 196, 292, { align: 'right' });
  };

  // ── Render one bill block, returns new Y ─────────────────────────────────
  const renderBillInDoc = (doc, bill, startY) => {
    let y = startY;

    // Bill card background
    doc.setFillColor(...BLUE_LIGHT);
    doc.roundedRect(14, y, 182, 10, 2, 2, 'F');

    // Bill number (left, blue bold)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...BLUE);
    doc.text(bill.billNumber, 18, y + 6.5);

    // Date (right, grey)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...GREY);
    doc.text(
      new Date(bill.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      192, y + 6.5, { align: 'right' }
    );

    // Status pill (right side, coloured)
    const isPaid = bill.status !== 'cancelled';
    const pillColor = isPaid ? [16, 185, 129] : [239, 68, 68];
    doc.setFillColor(...pillColor);
    doc.roundedRect(155, y + 2, 20, 6, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(255, 255, 255);
    doc.text(bill.status?.toUpperCase(), 165, y + 6, { align: 'center' });

    y += 14;

    // Meta row: customer + payment
    doc.setFontSize(8);
    if (bill.customerName) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...DARK);
      doc.text(bill.customerName, 18, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...GREY);
      if (bill.customerPhone) doc.text(`  |  ${bill.customerPhone}`, 18 + doc.getTextWidth(bill.customerName), y);
    }
    // Payment badge
    doc.setFillColor(...BLUE);
    doc.roundedRect(170, y - 5, 22, 6, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(255, 255, 255);
    doc.text((bill.paymentMethod || 'CASH').toUpperCase(), 181, y - 0.8, { align: 'center' });

    y += 6;

    // Items table
    const rows = [
      ...(bill.services || []).map((s) => [s.name, 'Service', `${s.quantity ?? 1}`, `Rs.${s.price.toFixed(2)}`, `Rs.${s.subtotal.toFixed(2)}`]),
      ...(bill.products || []).map((p) => [p.productName, p.variantSize || '—', `${p.quantity}`, `Rs.${p.price.toFixed(2)}`, `Rs.${p.subtotal.toFixed(2)}`]),
    ];

    autoTable(doc, {
      startY: y,
      head: [['#', 'Item', 'Type / Size', 'Qty', 'Unit Price', 'Total']],
      body: rows.map((r, i) => [i + 1, ...r]),
      styles:     { fontSize: 8, cellPadding: 3, textColor: DARK },
      headStyles: { fillColor: BLUE, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: BLUE_LIGHT },
      columnStyles: {
        0: { cellWidth: 8,  halign: 'center', textColor: GREY },
        1: { cellWidth: 58 },
        2: { cellWidth: 34 },
        3: { cellWidth: 12, halign: 'center' },
        4: { cellWidth: 30, halign: 'right' },
        5: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: 14, right: 14 },
      tableLineColor: [220, 228, 245],
      tableLineWidth: 0.2,
    });

    y = doc.lastAutoTable.finalY;

    // Totals panel — right-aligned box
    const boxX = 128, boxW = 68;
    let ty = y + 4;
    const totalsData = [
      ['Subtotal', `Rs.${bill.subtotal?.toFixed(2)}`, false],
      ...(bill.discount > 0 ? [['Discount', `-Rs.${bill.discount?.toFixed(2)}`, false]] : []),
      ...(bill.tax > 0      ? [[`Tax (${bill.taxPercent}%)`, `+Rs.${bill.tax?.toFixed(2)}`, false]] : []),
    ];
    const rowH = 6;
    const totalBoxH = totalsData.length * rowH + rowH + 3;

    doc.setFillColor(250, 252, 255);
    doc.setDrawColor(...BLUE_LIGHT);
    doc.setLineWidth(0.3);
    doc.roundedRect(boxX, ty - 3, boxW, totalBoxH, 2, 2, 'FD');

    doc.setFontSize(8);
    for (const [label, val] of totalsData) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...GREY);
      doc.text(label, boxX + 4, ty);
      doc.setTextColor(...DARK);
      doc.text(val, boxX + boxW - 3, ty, { align: 'right' });
      ty += rowH;
    }

    // Total highlight row
    doc.setFillColor(...BLUE);
    doc.roundedRect(boxX, ty - 4, boxW, rowH + 2, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text('TOTAL', boxX + 4, ty + 0.5);
    doc.text(`Rs.${bill.total?.toFixed(2)}`, boxX + boxW - 3, ty + 0.5, { align: 'right' });
    ty += rowH + 4;

    return ty;
  };

  // ── Download ALL bills as one PDF ─────────────────────────────────────────
  const handleDownloadAllPDF = () => {
    if (bills.length === 0) { toast.info('No bills to download'); return; }

    const shop = shopInfo;
    const doc  = new jsPDF({ unit: 'mm', format: 'a4' });
    let pageNum = 1;

    drawPageHeader(doc, shop);

    // ── Summary overview table ──────────────────────────────────────────────
    const summaryRows = bills.map((b, i) => [
      i + 1,
      b.billNumber,
      b.customerName || '—',
      new Date(b.createdAt).toLocaleDateString('en-IN'),
      (b.paymentMethod || 'cash').toUpperCase(),
      `Rs.${b.total?.toFixed(2)}`,
      b.status?.toUpperCase(),
    ]);

    // Section label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...BLUE);
    doc.text('Summary', 14, 40);
    doc.setDrawColor(...BLUE_MID);
    doc.setLineWidth(0.4);
    doc.line(14, 42, 36, 42);

    autoTable(doc, {
      startY: 45,
      head: [['#', 'Bill No.', 'Customer', 'Date', 'Payment', 'Total', 'Status']],
      body: summaryRows,
      styles:     { fontSize: 8, cellPadding: 3, textColor: DARK },
      headStyles: { fillColor: BLUE, textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: BLUE_LIGHT },
      columnStyles: {
        0: { cellWidth: 8,  halign: 'center', textColor: GREY },
        1: { cellWidth: 36 },
        2: { cellWidth: 42 },
        3: { cellWidth: 24 },
        4: { cellWidth: 20, halign: 'center' },
        5: { cellWidth: 26, halign: 'right', fontStyle: 'bold', textColor: BLUE },
        6: { cellWidth: 22, halign: 'center' },
      },
      margin: { left: 14, right: 14 },
      tableLineColor: [220, 228, 245],
      tableLineWidth: 0.2,
      didParseCell: (d) => {
        if (d.column.index === 6 && d.section === 'body') {
          d.cell.styles.textColor  = d.cell.raw === 'CANCELLED' ? [239, 68, 68] : [16, 185, 129];
          d.cell.styles.fontStyle  = 'bold';
        }
      },
    });

    // Grand total
    const grandTotal = bills.reduce((s, b) => s + (b.total || 0), 0);
    let gy = doc.lastAutoTable.finalY + 5;
    doc.setFillColor(...BLUE);
    doc.roundedRect(148, gy - 4, 48, 9, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text('Grand Total', 152, gy + 1.5);
    doc.text(`Rs.${grandTotal.toFixed(2)}`, 193, gy + 1.5, { align: 'right' });
    gy += 14;

    // ── Bill Details heading ────────────────────────────────────────────────
    if (gy > 240) { doc.addPage(); drawPageHeader(doc, shop); drawPageFooter(doc, ++pageNum); gy = 38; }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...BLUE);
    doc.text('Bill Details', 14, gy);
    doc.setDrawColor(...BLUE_MID);
    doc.setLineWidth(0.4);
    doc.line(14, gy + 2, 42, gy + 2);
    gy += 8;

    // ── Each bill ──────────────────────────────────────────────────────────
    for (let i = 0; i < bills.length; i++) {
      if (gy > 240) {
        drawPageFooter(doc, pageNum);
        doc.addPage();
        drawPageHeader(doc, shop);
        pageNum++;
        gy = 38;
      }
      gy = renderBillInDoc(doc, bills[i], gy);
      if (i < bills.length - 1) {
        doc.setDrawColor(220, 228, 245);
        doc.setLineWidth(0.3);
        doc.line(14, gy, 196, gy);
        gy += 6;
      }
    }

    drawPageFooter(doc, pageNum);

    const fname = `Bills-${(shop?.shopName || 'Salon').replace(/\s+/g, '-')}-${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}.pdf`;
    doc.save(fname);
  };

  // ── Print (existing) ──────────────────────────────────────────────────────
  const handlePrintBill = (bill) => {
    const win  = window.open('', '_blank', 'width=400,height=600');
    const shop = shopInfo;
    win.document.write(`
      <html><head><title>Bill ${bill.billNumber}</title>
      <style>body{font-family:monospace;font-size:12px;padding:20px;max-width:320px;margin:0 auto}
      table{width:100%}th{text-align:left}th.r,td.r{text-align:right}.divider{border-top:1px dashed #000;margin:8px 0}</style>
      </head><body>
      <div style="text-align:center"><h2 style="margin:0">${shop?.shopName || 'Salon'}</h2>
      ${shop?.address   ? `<p style="margin:2px 0">${shop.address}</p>`       : ''}
      ${shop?.phone     ? `<p style="margin:2px 0">${shop.phone}</p>`         : ''}
      ${shop?.gstNumber ? `<p style="margin:2px 0">GST: ${shop.gstNumber}</p>` : ''}</div>
      <div class="divider"></div>
      ${bill.customerName ? `<p>Customer: ${bill.customerName}${bill.customerPhone ? ' | ' + bill.customerPhone : ''}</p>` : ''}
      <table>
        <tr><th>Item</th><th class="r">Qty</th><th class="r">Price</th><th class="r">Total</th></tr>
        ${(bill.services || []).map(s => `<tr><td>${s.name}</td><td class="r">${s.quantity}</td><td class="r">₹${s.price}</td><td class="r">₹${s.subtotal}</td></tr>`).join('')}
        ${(bill.products || []).map(p => `<tr><td>${p.productName} (${p.variantSize})</td><td class="r">${p.quantity}</td><td class="r">₹${p.price}</td><td class="r">₹${p.subtotal}</td></tr>`).join('')}
      </table>
      <div class="divider"></div>
      <table>
        <tr><td>Subtotal</td><td class="r">₹${bill.subtotal?.toFixed(2)}</td></tr>
        ${bill.discount > 0 ? `<tr><td>Discount</td><td class="r">-₹${bill.discount?.toFixed(2)}</td></tr>` : ''}
        ${bill.tax > 0 ? `<tr><td>Tax (${bill.taxPercent}%)</td><td class="r">+₹${bill.tax?.toFixed(2)}</td></tr>` : ''}
        <tr><td><strong>TOTAL</strong></td><td class="r"><strong>₹${bill.total?.toFixed(2)}</strong></td></tr>
        <tr><td>Payment</td><td class="r" style="text-transform:capitalize">${bill.paymentMethod}</td></tr>
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
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadAllPDF}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 transition-all shadow-sm shadow-primary/20"
          >
            <Download size={15} />
            Download Bills
          </button>
          
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary bg-white"
            placeholder="Search by name, phone or bill no…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary bg-white"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
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
                      <button onClick={() => setViewBill(b)} title="View" className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors">
                        <Eye size={14} />
                      </button>
                      <button onClick={() => handlePrintBill(b)} title="Print" className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <Printer size={14} />
                      </button>
                      {b.status === 'completed' && (
                        <button onClick={() => setCancelTarget(b)} title="Cancel bill" className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={14} />
                        </button>
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
            {/* Modal header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-800">{viewBill.billNumber}</h3>
                <p className="text-xs text-gray-400">{new Date(viewBill.createdAt).toLocaleString('en-IN')}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => handlePrintBill(viewBill)} title="Print"
                  className="flex items-center gap-1 text-xs text-gray-500 border border-gray-200 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                  <Printer size={12} /> Print
                </button>
                <button onClick={() => setViewBill(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 ml-1">
                  <X size={18} />
                </button>
              </div>
            </div>

            {viewBill.customerName && (
              <p className="text-sm text-gray-600 mb-3">
                Customer: <strong>{viewBill.customerName}</strong>
                {viewBill.customerPhone ? ` · ${viewBill.customerPhone}` : ''}
              </p>
            )}

            {/* Items */}
            <div className="border border-gray-100 rounded-xl overflow-hidden mb-3">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-500">
                    <th className="text-left px-3 py-2">Item</th>
                    <th className="text-right px-3 py-2">Qty</th>
                    <th className="text-right px-3 py-2">Price</th>
                    <th className="text-right px-3 py-2">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {viewBill.services?.map((s, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 text-gray-700">{s.name}</td>
                      <td className="px-3 py-2 text-right text-gray-500">{s.quantity}</td>
                      <td className="px-3 py-2 text-right text-gray-500">₹{s.price}</td>
                      <td className="px-3 py-2 text-right font-medium text-gray-700">₹{s.subtotal}</td>
                    </tr>
                  ))}
                  {viewBill.products?.map((p, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 text-gray-700">{p.productName} <span className="text-gray-400">({p.variantSize})</span></td>
                      <td className="px-3 py-2 text-right text-gray-500">{p.quantity}</td>
                      <td className="px-3 py-2 text-right text-gray-500">₹{p.price}</td>
                      <td className="px-3 py-2 text-right font-medium text-gray-700">₹{p.subtotal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="border-t border-gray-100 pt-3 space-y-1 text-sm">
              <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>₹{viewBill.subtotal?.toFixed(2)}</span></div>
              {viewBill.discount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><span>-₹{viewBill.discount?.toFixed(2)}</span></div>}
              {viewBill.tax > 0 && <div className="flex justify-between text-gray-500"><span>Tax ({viewBill.taxPercent}%)</span><span>+₹{viewBill.tax?.toFixed(2)}</span></div>}
              <div className="flex justify-between font-bold text-gray-800 border-t pt-1"><span>Total</span><span>₹{viewBill.total?.toFixed(2)}</span></div>
              <div className="flex justify-between text-gray-500 capitalize text-xs pt-0.5"><span>Payment</span><span>{viewBill.paymentMethod}</span></div>
            </div>

            <button onClick={() => setViewBill(null)} className="w-full mt-4 bg-primary hover:bg-primary/90 text-white py-2.5 rounded-xl text-sm font-medium transition-colors">
              Close
            </button>
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
              <button onClick={() => setCancelTarget(null)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50">
                Keep
              </button>
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
