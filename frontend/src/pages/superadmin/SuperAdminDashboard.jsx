// admin/src/pages/SuperAdmin/SuperAdminDashboard.jsx
import React, { useContext, useEffect, useState } from 'react';
import { SuperAdminContext } from '../../context/SuperAdminContext';
import {
  Store, Users, Calendar, TrendingUp, ShieldCheck,
  AlertCircle, CheckCircle, Clock, ArrowUpRight, RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${color}`}>
      <Icon size={24} className="text-white" />
    </div>
    <div>
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <p className="text-2xl font-bold text-gray-800">{value ?? '—'}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const statusColors = {
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-gray-100 text-gray-600',
  suspended: 'bg-red-100 text-red-600',
};

const statusIcons = {
  active: <CheckCircle size={13} />,
  inactive: <Clock size={13} />,
  suspended: <AlertCircle size={13} />,
};

const SuperAdminDashboard = () => {
  const { getDashboard, dashData, loading } = useContext(SuperAdminContext);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    getDashboard();
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    await getDashboard();
    setRefreshing(false);
  };

  const d = dashData;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <Link
            to="/super-admin/salons/create"
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:from-purple-700 hover:to-blue-700 transition-all shadow-md"
          >
            <Store size={16} />
            Add New Salon
          </Link>
        </div>
      </div>

      {/* Stats */}
      {loading && !d ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Store} label="Total Salons" value={d?.totalShops} color="bg-gradient-to-br from-purple-500 to-purple-600" />
          <StatCard icon={CheckCircle} label="Active Salons" value={d?.activeShops} color="bg-gradient-to-br from-emerald-500 to-emerald-600" />
          <StatCard icon={AlertCircle} label="Suspended" value={d?.suspendedShops} color="bg-gradient-to-br from-red-500 to-red-600" />
          <StatCard icon={Users} label="Total Customers" value={d?.totalUsers} color="bg-gradient-to-br from-blue-500 to-blue-600" />
        </div>
      )}

      {/* Recent Salons */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">Recently Added Salons</h2>
          <Link
            to="/super-admin/salons"
            className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            View All <ArrowUpRight size={14} />
          </Link>
        </div>

        {loading && !d ? (
          <div className="p-6 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {d?.recentShops?.length > 0 ? (
              d.recentShops.map((salon) => (
                <div key={salon.shopId} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                      {salon.logo ? (
                        <img src={salon.logo} alt={salon.shopName} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <Store size={18} className="text-purple-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{salon.shopName}</p>
                      <p className="text-xs text-gray-400">{salon.shopId} · /{salon.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[salon.status]}`}>
                      {statusIcons[salon.status]}
                      {salon.status.charAt(0).toUpperCase() + salon.status.slice(1)}
                    </span>
                    <Link
                      to={`/super-admin/salons`}
                      className="text-gray-400 hover:text-purple-600 transition-colors"
                    >
                      <ArrowUpRight size={16} />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-gray-400">
                <Store size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No salons created yet.</p>
                <Link
                  to="/super-admin/salons/create"
                  className="mt-3 inline-flex items-center gap-1 text-sm text-purple-600 hover:underline"
                >
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
