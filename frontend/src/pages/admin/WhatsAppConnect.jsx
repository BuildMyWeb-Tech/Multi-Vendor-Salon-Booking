import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { SalonAdminContext } from '../../context/SalonAdminContext';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  Smartphone, Wifi, WifiOff, RefreshCw, LogOut, CheckCircle2,
  Loader2, QrCode,
} from 'lucide-react';

const STATE_LABELS = {
  DISCONNECTED:   'Disconnected',
  STARTING:       'Starting…',
  AUTHENTICATING: 'Authenticating…',
  QR_REQUIRED:    'Scan QR Code',
  CONNECTED:      'Connected',
  RECONNECTING:   'Reconnecting…',
  LOGGED_OUT:     'Logged Out',
  ERROR:          'Error',
};

const STATE_COLORS = {
  CONNECTED:      'text-emerald-600 bg-emerald-50 border-emerald-200',
  QR_REQUIRED:    'text-blue-600 bg-blue-50 border-blue-200',
  RECONNECTING:   'text-amber-600 bg-amber-50 border-amber-200',
  STARTING:       'text-amber-600 bg-amber-50 border-amber-200',
  AUTHENTICATING: 'text-amber-600 bg-amber-50 border-amber-200',
  DISCONNECTED:   'text-gray-500 bg-gray-50 border-gray-200',
  LOGGED_OUT:     'text-red-600 bg-red-50 border-red-200',
  ERROR:          'text-red-600 bg-red-50 border-red-200',
};

const fmt = (dt) => dt ? new Date(dt).toLocaleString('en-IN', {
  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
}) : '—';

export default function WhatsAppConnect() {
  const { saAdminToken, backendUrl, shopInfo } = useContext(SalonAdminContext);
  const navigate = useNavigate();
  const { shopSlug } = useParams();

  const [status, setStatus]           = useState(null);
  const [loading, setLoading]         = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const pollRef = useRef(null);

  const fetchStatus = useCallback(async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/salon-admin/whatsapp/status`, {
        headers: { satoken: saAdminToken },
      });
      if (data.success) setStatus(data);
    } catch (err) {
      console.error('Status fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [backendUrl, saAdminToken]);

  useEffect(() => {
    if (shopInfo && !shopInfo.broadcastEnabled) navigate(`/${shopSlug}/admin/dashboard`);
  }, [shopInfo, navigate]);

  useEffect(() => {
    fetchStatus();
    // Poll fast (2s) only while transitioning; slow down to 15s when already connected/disconnected
    const FAST_STATES = new Set(['STARTING', 'AUTHENTICATING', 'QR_REQUIRED', 'RECONNECTING']);
    const getInterval = (s) => (s && FAST_STATES.has(s.connectionState) ? 2000 : 15000);

    let currentInterval = 2000;
    pollRef.current = setInterval(() => {
      fetchStatus();
      // Re-schedule at the right rate after status updates
      const next = getInterval(status);
      if (next !== currentInterval) {
        clearInterval(pollRef.current);
        currentInterval = next;
        pollRef.current = setInterval(fetchStatus, currentInterval);
      }
    }, currentInterval);
    return () => clearInterval(pollRef.current);
  }, [fetchStatus]);

  const handleConnect = async () => {
    setActionLoading(true);
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/salon-admin/whatsapp/connect`,
        {},
        { headers: { satoken: saAdminToken } }
      );
      if (data.success) {
        toast.success('Connecting — QR code will appear in a few seconds.');
        await fetchStatus();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Failed to request connection.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect WhatsApp? You will need to scan QR again to reconnect.')) return;
    setActionLoading(true);
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/salon-admin/whatsapp/disconnect`,
        {},
        { headers: { satoken: saAdminToken } }
      );
      if (data.success) {
        toast.success('Disconnected.');
        await fetchStatus();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Failed to disconnect.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  const state = status?.connectionState || 'DISCONNECTED';
  const isConnected = state === 'CONNECTED';
  const isQrRequired = state === 'QR_REQUIRED';
  const stateColor = STATE_COLORS[state] || STATE_COLORS.DISCONNECTED;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Smartphone size={22} className="text-primary" />
          WhatsApp Connection
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Connect your WhatsApp to send broadcast messages to customers.
        </p>
      </div>

      {/* Status Card */}
      <div className="rounded-2xl border border-gray-200 shadow-sm bg-white p-5">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <p className="text-xs font-medium text-gray-400 mb-1">Connection Status</p>
            <span className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full border ${stateColor}`}>
              {isConnected
                ? <CheckCircle2 size={14} />
                : ['RECONNECTING', 'STARTING', 'AUTHENTICATING'].includes(state)
                  ? <Loader2 size={14} className="animate-spin" />
                  : isQrRequired
                    ? <QrCode size={14} />
                    : <WifiOff size={14} />}
              {STATE_LABELS[state] || state}
            </span>
          </div>
          {status?.lastConnectedAt && (
            <div className="text-right">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Last Connected</p>
              <p className="text-xs font-medium text-gray-600 mt-0.5">{fmt(status.lastConnectedAt)}</p>
            </div>
          )}
        </div>

        {status?.lastError && (
          <div className="mb-4 rounded-xl bg-red-50 px-3 py-2">
            <p className="text-[10px] text-red-500 uppercase tracking-wide">Last Error</p>
            <p className="text-xs font-medium text-red-600 mt-0.5 truncate">{status.lastError}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          {!isConnected && (
            <button
              onClick={handleConnect}
              disabled={actionLoading}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {actionLoading ? <Loader2 size={15} className="animate-spin" /> : <Wifi size={15} />}
              {isQrRequired ? 'Regenerate QR' : 'Connect WhatsApp'}
            </button>
          )}
          {isConnected && (
            <button
              onClick={handleDisconnect}
              disabled={actionLoading}
              className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-100 disabled:opacity-50 transition-colors"
            >
              {actionLoading ? <Loader2 size={15} className="animate-spin" /> : <LogOut size={15} />}
              Disconnect
            </button>
          )}
          
        </div>
      </div>

      {/* QR Code — ready to scan */}
      {isQrRequired && status?.qrDataUri && (
        <div className="rounded-2xl border border-blue-200 shadow-sm bg-blue-50 p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <QrCode size={18} className="text-blue-600" />
            <h2 className="text-base font-semibold text-blue-700">Scan with WhatsApp</h2>
          </div>
          <p className="text-sm text-blue-600 mb-4">
            Open WhatsApp → Linked Devices → Link a Device → scan this QR code
          </p>
          <div className="inline-block bg-white rounded-xl p-3 shadow-sm border border-blue-100">
            <img src={status.qrDataUri} alt="WhatsApp QR Code" className="w-56 h-56 object-contain" />
          </div>
          {status.qrGeneratedAt && (
            <p className="text-xs text-blue-500 mt-2">Generated: {fmt(status.qrGeneratedAt)}</p>
          )}
        </div>
      )}

      {/* Waiting for QR */}
      {!isQrRequired && !isConnected && ['STARTING', 'AUTHENTICATING', 'DISCONNECTED', 'RECONNECTING'].includes(state) && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-6 text-center">
          <Loader2 size={28} className="text-blue-500 animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-blue-700">Waiting for QR code…</p>
          <p className="text-xs text-blue-500 mt-1">
            Connecting to WhatsApp. This takes 5–15 seconds.
          </p>
        </div>
      )}

      {/* Connected info */}
      {isConnected && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={18} className="text-emerald-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-emerald-800 mb-1">WhatsApp Connected</h3>
              <p className="text-sm text-emerald-700">
                Ready to send broadcasts. Go to{' '}
                <button
                  onClick={() => navigate(`/${shopSlug}/admin/broadcast`)}
                  className="underline font-medium"
                >
                  Broadcast
                </button>{' '}
                to send messages to your customers.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
