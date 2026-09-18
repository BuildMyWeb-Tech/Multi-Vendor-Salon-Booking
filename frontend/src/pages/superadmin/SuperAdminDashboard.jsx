import React, { useContext, useEffect, useState } from 'react';
import { SuperAdminContext } from '../../context/SuperAdminContext';
import {
  Store, Users, Calendar, CheckCircle, Clock,
  ArrowUpRight, RefreshCw, TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';

const StatCard = ({ icon: Icon, label, value, sub, colorClass }) => (
  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-gray-800 mt-0.5">{value ?? '—'}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const SuperAdminDashboard = () => {
  const { getDashboard, dashData, loading } = useContext(SuperAdminContext);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { getDashboard(); }, []);

  const refresh = async () => {
    setRefreshing(true);
    await getDashboard();
    setRefreshing(false);
  };

  const d = dashData;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Platform Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Overview of all salons on the platform</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refresh}
            disabled={refreshing}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm hover:bg-gray-50 transition-all shadow-sm"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <Link
            to="/super-admin/salons/create"
            className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-all shadow-sm"
          >
            <Store size={15} />
            Add New Salon
          </Link>
        </div>
      </div>

      {/* Stats */}
      {loading && !d ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Store} label="Total Salons" value={d?.totalShops} colorClass="bg-primary" />
          <StatCard icon={CheckCircle} label="Active Salons" value={d?.activeShops} sub="Currently running" colorClass="bg-emerald-500" />
          <StatCard icon={Clock} label="Inactive Salons" value={(d?.totalShops ?? 0) - (d?.activeShops ?? 0)} sub="Not active" colorClass="bg-amber-500" />
          <StatCard icon={Users} label="Total Customers" value={d?.totalUsers} colorClass="bg-violet-500" />
        </div>
      )}

      {/* Recent Salons */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">Recently Added Salons</h2>
          <Link
            to="/super-admin/salons"
            className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 font-medium"
          >
            View All <ArrowUpRight size={14} />
          </Link>
        </div>

        {loading && !d ? (
          <div className="p-6 space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {d?.recentShops?.length > 0 ? (
              d.recentShops.map((salon) => (
                <div key={salon.shopId} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {salon.logo
                        ? <img src={salon.logo} alt={salon.shopName} className="w-full h-full object-cover rounded-xl" />
                        : <Store size={17} className="text-primary" />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{salon.shopName}</p>
                      <p className="text-xs text-gray-400">{salon.shopId} · /{salon.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      salon.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${salon.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                      {salon.status.charAt(0).toUpperCase() + salon.status.slice(1)}
                    </span>
                    <Link to="/super-admin/salons" className="text-gray-400 hover:text-primary transition-colors">
                      <ArrowUpRight size={16} />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-14 text-center text-gray-400">
                <Store size={36} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No salons yet</p>
                <Link to="/super-admin/salons/create" className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline">
                  Create your first salon <ArrowUpRight size={13} />
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
