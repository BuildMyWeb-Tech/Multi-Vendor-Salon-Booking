// admin/src/pages/SuperAdmin/SuperAdminSalons.jsx

import React, { useContext, useEffect, useState } from 'react';
import { SuperAdminContext } from '../../context/SuperAdminContext';
import {
  Store,
  Search,
  Plus,
  AlertCircle,
  Clock,
  MoreVertical,
  Ban,
  PlayCircle,
  ArrowUpRight,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const statusColors = {
  active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  inactive: 'bg-gray-100 text-gray-600 border-gray-200',
  suspended: 'bg-red-100 text-red-600 border-red-200',
};

const SuperAdminSalons = () => {
  const { getAllSalons, salons, updateSalonStatus, loading } = useContext(SuperAdminContext);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [openMenu, setOpenMenu] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    getAllSalons({
      search,
      status: statusFilter,
    });
  }, [search, statusFilter]);

  const handleStatusChange = async (shopId, newStatus) => {
    try {
      setActionLoading(shopId);

      await updateSalonStatus(shopId, newStatus);

      setOpenMenu(null);
    } catch (error) {
      console.error('Failed to update salon status:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStatus = async (salon) => {
    const newStatus = salon.status === 'active' ? 'inactive' : 'active';

    await handleStatusChange(salon.shopId, newStatus);
  };

  const getStatusLabel = (status) => {
    if (!status) return 'Unknown';

    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">All Salons</h1>

          <p className="text-gray-500 text-sm mt-0.5">
            {salons.length} salon
            {salons.length !== 1 ? 's' : ''} on the platform
          </p>
        </div>

        <Link
          to="/super-admin/salons/create"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:from-purple-700 hover:to-blue-700 transition-all shadow-md self-start sm:self-auto"
        >
          <Plus size={16} />
          Create Salon
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by salon name..."
            className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 bg-white"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-400 bg-white appearance-none cursor-pointer"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        {/* Refresh */}
        <button
          onClick={() =>
            getAllSalons({
              search,
              status: statusFilter,
            })
          }
          className="flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-all bg-white"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading && salons.length === 0 ? (
          <div className="p-6 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : salons.length === 0 ? (
          <div className="py-16 text-center">
            <Store size={48} className="mx-auto text-gray-200 mb-4" />

            <p className="text-gray-400 font-medium">No salons found</p>

            <p className="text-gray-300 text-sm mt-1">Try adjusting your search or filters</p>

            <Link
              to="/super-admin/salons/create"
              className="mt-4 inline-flex items-center gap-1.5 text-purple-600 text-sm hover:underline"
            >
              <Plus size={14} />
              Create a new salon
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Salon
                  </th>

                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">
                    Contact
                  </th>

                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">
                    Admin
                  </th>

                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Status
                  </th>

                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    URLs
                  </th>

                  <th className="px-6 py-3.5" />
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50">
                {salons.map((salon) => {
                  const isActive = salon.status === 'active';
                  const isSuspended = salon.status === 'suspended';
                  const isUpdating = actionLoading === salon.shopId;

                  return (
                    <tr key={salon.shopId} className="hover:bg-gray-50/50 transition-colors">
                      {/* Salon */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {salon.logo ? (
                              <img
                                src={salon.logo}
                                alt={salon.shopName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Store size={18} className="text-purple-500" />
                            )}
                          </div>

                          <div>
                            <p className="font-semibold text-gray-800">{salon.shopName}</p>

                            <p className="text-xs text-gray-400">{salon.shopId}</p>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-6 py-4 hidden md:table-cell">
                        <p className="text-gray-700">{salon.phone || '—'}</p>

                        <p className="text-xs text-gray-400">
                          {salon.city || ''}
                          {salon.city && salon.state ? ', ' : ''}
                          {salon.state || ''}
                        </p>
                      </td>

                      {/* Admin */}
                      <td className="px-6 py-4 hidden lg:table-cell">
                        {salon.admin ? (
                          <div>
                            <p className="text-gray-700">{salon.admin.name}</p>

                            <p className="text-xs text-gray-400">ID: {salon.admin.adminId}</p>
                          </div>
                        ) : (
                          <span className="text-gray-300 text-xs">No admin</span>
                        )}
                      </td>

                      {/* STATUS TOGGLE */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {/* Toggle */}
                          <button
                            id={`salon-status-${salon.shopId}`}
                            type="button"
                            role="switch"
                            aria-checked={isActive}
                            aria-label={`Change status for ${salon.shopName}`}
                            disabled={isUpdating || isSuspended}
                            onClick={() => handleToggleStatus(salon)}
                            className={`
                              relative inline-flex
                              h-7 w-12
                              flex-shrink-0
                              items-center
                              rounded-full
                              transition-all duration-200
                              focus:outline-none
                              focus:ring-2
                              focus:ring-offset-2
                              disabled:cursor-not-allowed
                              disabled:opacity-60
                              ${
                                isActive
                                  ? 'bg-blue-600 focus:ring-blue-500'
                                  : isSuspended
                                    ? 'bg-red-400 focus:ring-red-400'
                                    : 'bg-gray-300 focus:ring-gray-400'
                              }
                            `}
                          >
                            <span
                              className={`
                                inline-block
                                h-5
                                w-5
                                transform
                                rounded-full
                                bg-white
                                shadow-md
                                transition-transform duration-200
                                ${isActive ? 'translate-x-6' : 'translate-x-1'}
                              `}
                            />
                          </button>

                          {/* Status Text */}
                          <div className="min-w-[75px]">
                            <span
                              className={`
                                text-sm
                                font-medium
                                ${
                                  isActive
                                    ? 'text-blue-600'
                                    : isSuspended
                                      ? 'text-red-500'
                                      : 'text-gray-500'
                                }
                              `}
                            >
                              {getStatusLabel(salon.status)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* URLs */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <a
                            href={`http://localhost:5173/${salon.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-xs text-blue-500 hover:underline"
                          >
                            <ArrowUpRight size={11} />/{salon.slug}
                          </a>

                          <a
                            href={`http://localhost:5173/${salon.slug}/admin`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-xs text-purple-500 hover:underline"
                          >
                            <ArrowUpRight size={11} />/{salon.slug}/admin
                          </a>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 relative">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenMenu(openMenu === salon.shopId ? null : salon.shopId)
                          }
                          className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {openMenu === salon.shopId && (
                          <div className="absolute right-4 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg z-10 min-w-[160px] py-1 overflow-hidden">
                            {/* Activate */}
                            {salon.status !== 'active' && (
                              <button
                                type="button"
                                onClick={() => handleStatusChange(salon.shopId, 'active')}
                                disabled={isUpdating}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                              >
                                <PlayCircle size={15} />
                                Activate
                              </button>
                            )}

                            {/* Deactivate */}
                            {salon.status === 'active' && (
                              <button
                                type="button"
                                onClick={() => handleStatusChange(salon.shopId, 'inactive')}
                                disabled={isUpdating}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                              >
                                <Clock size={15} />
                                Deactivate
                              </button>
                            )}

                            {/* Suspend */}
                            {salon.status !== 'suspended' && (
                              <button
                                type="button"
                                onClick={() => handleStatusChange(salon.shopId, 'suspended')}
                                disabled={isUpdating}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                              >
                                <Ban size={15} />
                                Suspend
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Close dropdown on outside click */}
      {openMenu && <div className="fixed inset-0 z-0" onClick={() => setOpenMenu(null)} />}
    </div>
  );
};

export default SuperAdminSalons;
