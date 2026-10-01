import React, { useContext, useEffect, useRef, useState } from 'react';
import { SalonAdminContext } from '../../context/SalonAdminContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  MessageCircle, Search, CheckSquare, Square, Users, Send,
  Image as ImageIcon, X, Clock, Eye,
  RefreshCw, Plus, Loader2,
} from 'lucide-react';

// ── helpers ───────────────────────────────────────────────────────────────────

const fmt = (dt) =>
  dt ? new Date(dt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const statusBadge = (s) => ({
  sent:    'bg-emerald-100 text-emerald-700',
  failed:  'bg-red-100 text-red-700',
  pending: 'bg-yellow-100 text-yellow-700',
}[s] || 'bg-gray-100 text-gray-600');

const waUrl = (phone, msg) => {
  const clean = phone.replace(/[^0-9]/g, '');
  const num = clean.startsWith('91') ? clean : `91${clean}`;
  return `https://wa.me/${num}?text=${encodeURIComponent(msg || '')}`;
};

// ── sub-components ────────────────────────────────────────────────────────────

const ContactRow = ({ contact, checked, onToggle }) => (
  <label className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 select-none">
    <button type="button" onClick={onToggle} className="flex-shrink-0 text-primary">
      {checked
        ? <CheckSquare size={18} />
        : <Square size={18} className="text-gray-300" />}
    </button>
    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
      <span className="text-xs font-bold text-primary">
        {(contact.name || contact.phone).charAt(0).toUpperCase()}
      </span>
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-800 truncate">{contact.name || '—'}</p>
      <p className="text-xs text-gray-400">{contact.phone}</p>
    </div>
  </label>
);

const HistoryCard = ({ broadcast, onView }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">
          {broadcast.message || (broadcast.mediaUrl ? '[Media only]' : '—')}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{fmt(broadcast.createdAt)}</p>
      </div>
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${broadcast.sendMode === 'api' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
        {broadcast.sendMode === 'api' ? 'API' : 'Manual'}
      </span>
    </div>
    <div className="grid grid-cols-4 gap-2 text-center">
      {[
        { label: 'Total',   value: broadcast.totalCount,   color: 'text-gray-700'    },
        { label: 'Sent',    value: broadcast.sentCount,    color: 'text-emerald-600' },
        { label: 'Failed',  value: broadcast.failedCount,  color: 'text-red-500'     },
        { label: 'Pending', value: broadcast.pendingCount, color: 'text-amber-500'   },
      ].map(({ label, value, color }) => (
        <div key={label} className="bg-gray-50 rounded-lg py-2">
          <p className={`text-sm font-bold ${color}`}>{value}</p>
          <p className="text-[10px] text-gray-400">{label}</p>
        </div>
      ))}
    </div>
    <button
      onClick={onView}
      className="mt-3 w-full text-sm text-primary font-medium flex items-center justify-center gap-1.5 hover:bg-primary/5 py-1.5 rounded-lg transition-colors"
    >
      <Eye size={14} /> View Recipients
    </button>
  </div>
);

// ── main component ────────────────────────────────────────────────────────────

const Broadcast = () => {
  const { saAdminToken, backendUrl, shopInfo } = useContext(SalonAdminContext);
  const navigate = useNavigate();
  const hdrs = () => ({ satoken: saAdminToken });

  useEffect(() => {
    if (shopInfo && !shopInfo.broadcastEnabled) navigate('/admin/dashboard');
  }, [shopInfo]);

  // contacts
  const [contacts, setContacts]             = useState([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [search, setSearch]                 = useState('');
  const [selected, setSelected]             = useState(new Set());

  // compose
  const [message, setMessage]               = useState('');
  const [mediaFile, setMediaFile]           = useState(null);
  const [mediaPreview, setMediaPreview]     = useState(null);
  const [mediaType, setMediaType]           = useState('');
  const [sendMode, setSendMode]             = useState('manual');
  const [sending, setSending]               = useState(false);
  const mediaInputRef                       = useRef(null);

  // history
  const [broadcasts, setBroadcasts]         = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [view, setView]                     = useState('compose'); // 'compose' | 'history'

  // detail modal
  const [detail, setDetail]                 = useState(null);
  const [detailLoading, setDetailLoading]   = useState(false);

  useEffect(() => { loadContacts(); loadHistory(); }, []);

  const loadContacts = async () => {
    setContactsLoading(true);
    try {
      const { data } = await axios.get(`${backendUrl}/api/salon-admin/broadcast/contacts`, { headers: hdrs() });
      if (data.success) setContacts(data.contacts);
      else toast.error(data.message);
    } catch { toast.error('Failed to load contacts'); }
    finally { setContactsLoading(false); }
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const { data } = await axios.get(`${backendUrl}/api/salon-admin/broadcast`, { headers: hdrs() });
      if (data.success) setBroadcasts(data.broadcasts);
    } catch {}
    finally { setHistoryLoading(false); }
  };

  const filteredContacts = contacts.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  const toggleContact = (phone) =>
    setSelected((prev) => { const n = new Set(prev); n.has(phone) ? n.delete(phone) : n.add(phone); return n; });

  const toggleAll = () =>
    setSelected(selected.size === filteredContacts.length ? new Set() : new Set(filteredContacts.map((c) => c.phone)));

  const clearMedia = () => {
    setMediaFile(null); setMediaPreview(null); setMediaType('');
    if (mediaInputRef.current) mediaInputRef.current.value = '';
  };

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { toast.error('File must be under 20MB'); return; }
    const isVideo = file.type.startsWith('video/');
    setMediaFile(file); setMediaType(isVideo ? 'video' : 'image');
    const reader = new FileReader();
    reader.onload = (ev) => setMediaPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const selectedContacts = contacts.filter((c) => selected.has(c.phone));

  const saveBroadcast = async (recipientDocs) => {
    const fd = new FormData();
    fd.append('message', message.trim());
    fd.append('sendMode', sendMode);
    fd.append('recipients', JSON.stringify(recipientDocs));
    if (mediaFile) fd.append('media', mediaFile);
    const { data } = await axios.post(`${backendUrl}/api/salon-admin/broadcast`, fd, {
      headers: { ...hdrs(), 'Content-Type': 'multipart/form-data' },
    });
    return data;
  };

  const handleManualSend = async () => {
    if (selected.size === 0) { toast.warning('Select at least one contact'); return; }
    if (!message.trim() && !mediaFile) { toast.warning('Enter a message or upload media'); return; }
    setSending(true);
    try {
      selectedContacts.forEach((c) => window.open(waUrl(c.phone, message.trim()), '_blank'));
      const data = await saveBroadcast(selectedContacts.map((c) => ({ ...c, status: 'pending' })));
      if (data.success) {
        toast.success('WhatsApp opened and broadcast saved!');
        setMessage(''); setSelected(new Set()); clearMedia();
        loadHistory(); setView('history');
      } else { toast.error(data.message); }
    } catch (err) { toast.error(err.response?.data?.message || err.message || 'Error'); }
    finally { setSending(false); }
  };

  const handleApiSend = async () => {
    if (selected.size === 0) { toast.warning('Select at least one contact'); return; }
    if (!message.trim() && !mediaFile) { toast.warning('Enter a message or upload media'); return; }
    setSending(true);
    try {
      const data = await saveBroadcast(selectedContacts);
      if (data.success) {
        const b = data.broadcast;
        toast.success(`Done — Sent: ${b.sentCount} / Failed: ${b.failedCount}`);
        setMessage(''); setSelected(new Set()); clearMedia();
        loadHistory(); setView('history');
      } else { toast.error(data.message); }
    } catch (err) { toast.error(err.response?.data?.message || err.message || 'Error'); }
    finally { setSending(false); }
  };

  const openDetail = async (id) => {
    setDetail({ _id: id }); setDetailLoading(true);
    try {
      const { data } = await axios.get(`${backendUrl}/api/salon-admin/broadcast/${id}`, { headers: hdrs() });
      if (data.success) setDetail(data.broadcast);
      else toast.error(data.message);
    } catch { toast.error('Failed to load detail'); }
    finally { setDetailLoading(false); }
  };

  const allSelected = filteredContacts.length > 0 && selected.size === filteredContacts.length;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <MessageCircle size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">WhatsApp Broadcast</h1>
            <p className="text-xs text-gray-400">Send bulk messages to your salon customers</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('compose')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'compose' ? 'bg-primary text-white shadow-sm' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            <Plus size={14} /> New Broadcast
          </button>
          <button
            onClick={() => { setView('history'); loadHistory(); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'history' ? 'bg-primary text-white shadow-sm' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            <Clock size={14} /> History
          </button>
        </div>
      </div>

      {/* ── History ──────────────────────────────────────────────────────── */}
      {view === 'history' && (
        <div>
          {/* <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">{broadcasts.length} broadcast{broadcasts.length !== 1 ? 's' : ''}</p>
            <button onClick={loadHistory} className="text-primary text-sm flex items-center gap-1 hover:underline">
              <RefreshCw size={13} /> Refresh
            </button>
          </div> */}
          {historyLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={28} className="text-primary animate-spin" />
            </div>
          ) : broadcasts.length === 0 ? (
            <div className="text-center py-16 bg-white border border-gray-100 rounded-2xl">
              <MessageCircle size={40} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No broadcasts yet</p>
              <button onClick={() => setView('compose')} className="mt-4 text-primary text-sm font-semibold hover:underline">
                Send your first broadcast →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {broadcasts.map((b) => (
                <HistoryCard key={b._id} broadcast={b} onView={() => openDetail(b._id)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Compose ──────────────────────────────────────────────────────── */}
      {view === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* Contacts Panel */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col" style={{ height: '70vh' }}>
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                  <Users size={15} className="text-primary" />
                  Contacts
                  {!contactsLoading && (
                    <span className="text-xs text-gray-400 font-normal">({contacts.length})</span>
                  )}
                </p>
                {!contactsLoading && contacts.length > 0 && (
                  <button onClick={toggleAll} className="text-xs font-medium text-primary hover:underline">
                    {allSelected ? 'Deselect All' : 'Select All'}
                  </button>
                )}
              </div>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name or number…"
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary/50 bg-white"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {contactsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 size={22} className="text-primary animate-spin" />
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="text-center py-10">
                  <Users size={28} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">
                    {contacts.length === 0 ? 'No customers found for this salon' : 'No results'}
                  </p>
                </div>
              ) : (
                filteredContacts.map((c) => (
                  <ContactRow
                    key={c.phone}
                    contact={c}
                    checked={selected.has(c.phone)}
                    onToggle={() => toggleContact(c.phone)}
                  />
                ))
              )}
            </div>

            {selected.size > 0 && (
              <div className="px-4 py-2 border-t border-gray-100 bg-primary/5 text-xs text-primary font-semibold flex-shrink-0">
                {selected.size} contact{selected.size !== 1 ? 's' : ''} selected
              </div>
            )}
          </div>

          {/* Message + Send Panel */}
          <div className="lg:col-span-3 flex flex-col gap-4">

            {/* Send mode */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-sm font-semibold text-gray-700 mb-3">Send Method</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    value: 'manual',
                    label: 'Manual (wa.me)',
                    desc: 'Opens WhatsApp for each contact — no API needed',
                    icon: MessageCircle,
                    colorClass: 'text-amber-600',
                    bg: 'bg-amber-50',
                  },
                  {
                    value: 'api',
                    label: 'WhatsApp Cloud API',
                    desc: 'Automatic send via WhatsApp Business API',
                    icon: Send,
                    colorClass: 'text-blue-600',
                    bg: 'bg-blue-50',
                  },
                ].map(({ value, label, desc, icon: Icon, colorClass, bg }) => (
                  <label
                    key={value}
                    onClick={() => setSendMode(value)}
                    className={`cursor-pointer rounded-xl border-2 p-3 transition-all ${sendMode === value ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center mb-2`}>
                      <Icon size={15} className={colorClass} />
                    </div>
                    <p className="text-sm font-semibold text-gray-800">{label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                  </label>
                ))}
              </div>
              {sendMode === 'api' && (
                <p className="mt-3 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700">
                  Requires <strong>WHATSAPP_API_TOKEN</strong> and <strong>WHATSAPP_PHONE_ID</strong> set on the server.
                </p>
              )}
              {sendMode === 'manual' && (
                <p className="mt-3 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-xs text-amber-700">
                  WhatsApp will open once per selected contact. Only messages you manually send are actually delivered — they are saved as "Pending" in history.
                </p>
              )}
            </div>

            {/* Message area */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-sm font-semibold text-gray-700 mb-3">Message</p>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                placeholder="Type your broadcast message here…"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
              />
              <p className="text-right text-xs text-gray-400 mt-1">{message.length} characters</p>

              {/* Media upload */}
              <div className="mt-4">
                {mediaPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-gray-200">
                    {mediaType === 'image'
                      ? <img src={mediaPreview} alt="preview" className="w-full max-h-44 object-cover" />
                      : <video src={mediaPreview} controls className="w-full max-h-44" />}
                    <button
                      onClick={clearMedia}
                      className="absolute top-2 right-2 bg-white/90 rounded-full p-1 hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                      <X size={14} />
                    </button>
                    <span className="absolute bottom-2 left-2 bg-black/50 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                      {mediaType}
                    </span>
                  </div>
                ) : (
                  <label className="flex items-center gap-3 border-2 border-dashed border-gray-200 hover:border-primary/40 rounded-xl px-4 py-3 cursor-pointer transition-all group">
                    <div className="w-9 h-9 bg-gray-50 group-hover:bg-primary/10 rounded-lg flex items-center justify-center transition-colors flex-shrink-0">
                      <ImageIcon size={17} className="text-gray-400 group-hover:text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 group-hover:text-primary font-medium transition-colors">Upload image or video</p>
                      <p className="text-xs text-gray-400">JPG, PNG, MP4 — max 20MB</p>
                    </div>
                    <input ref={mediaInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleMediaChange} />
                  </label>
                )}
              </div>
            </div>

            {/* Send */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {selected.size === 0
                      ? 'No contacts selected'
                      : `${selected.size} contact${selected.size !== 1 ? 's' : ''} selected`}
                  </p>
                  {selected.size > 0 && sendMode === 'manual' && (
                    <p className="text-xs text-amber-600 mt-0.5">
                      WhatsApp will open {selected.size} time{selected.size !== 1 ? 's' : ''}
                    </p>
                  )}
                  {selected.size > 0 && sendMode === 'api' && (
                    <p className="text-xs text-blue-600 mt-0.5">Messages sent automatically via API</p>
                  )}
                </div>
                <button
                  onClick={sendMode === 'manual' ? handleManualSend : handleApiSend}
                  disabled={sending || selected.size === 0}
                  className="flex items-center gap-2 bg-primary text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  {sending
                    ? <><Loader2 size={15} className="animate-spin" /> Sending…</>
                    : <><Send size={15} /> {sendMode === 'manual' ? 'Open WhatsApp' : 'Send Broadcast'}</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Detail Modal ──────────────────────────────────────────────────── */}
      {detail && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setDetail(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <h3 className="font-bold text-gray-800">Broadcast Detail</h3>
              <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>

            {detailLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="text-primary animate-spin" />
              </div>
            ) : detail.recipients ? (
              <>
                {/* Stats */}
                <div className="grid grid-cols-4 gap-2 px-5 py-3 border-b border-gray-100 flex-shrink-0">
                  {[
                    { label: 'Total',   value: detail.totalCount,   color: 'text-gray-700'    },
                    { label: 'Sent',    value: detail.sentCount,    color: 'text-emerald-600' },
                    { label: 'Failed',  value: detail.failedCount,  color: 'text-red-500'     },
                    { label: 'Pending', value: detail.pendingCount, color: 'text-amber-500'   },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="text-center bg-gray-50 rounded-lg py-2">
                      <p className={`text-base font-bold ${color}`}>{value}</p>
                      <p className="text-[10px] text-gray-400">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Message preview */}
                {detail.message && (
                  <div className="mx-5 mt-3 p-3 bg-gray-50 rounded-xl text-sm text-gray-600 border border-gray-100 flex-shrink-0">
                    {detail.message}
                  </div>
                )}
                {detail.mediaUrl && (
                  <div className="mx-5 mt-2 flex-shrink-0">
                    {detail.mediaType === 'image'
                      ? <img src={detail.mediaUrl} alt="media" className="rounded-xl max-h-28 object-cover border border-gray-100" />
                      : <video src={detail.mediaUrl} controls className="rounded-xl max-h-28 w-full border border-gray-100" />}
                  </div>
                )}

                <p className="text-xs text-gray-400 px-5 pt-2 flex-shrink-0">
                  {fmt(detail.createdAt)} · {detail.sendMode === 'api' ? 'API send' : 'Manual send'}
                </p>

                {/* Recipients */}
                <div className="flex-1 overflow-y-auto px-5 py-3 space-y-1">
                  {detail.recipients.map((r, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 py-2.5 border-b border-gray-50 last:border-0">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{r.name || '—'}</p>
                        <p className="text-xs text-gray-400">{r.phone}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusBadge(r.status)}`}>
                          {r.status}
                        </span>
                        {r.status === 'pending' && (
                          <a
                            href={waUrl(r.phone, detail.message)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full hover:bg-emerald-100 transition-colors"
                          >
                            Open WA
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default Broadcast;
