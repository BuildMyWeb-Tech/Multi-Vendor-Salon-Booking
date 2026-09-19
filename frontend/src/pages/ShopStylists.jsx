import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import {
  Search, Scissors, Loader2, Store, LayoutGrid, User,
  Clock, Instagram, Calendar, SlidersHorizontal, Star
} from 'lucide-react';

const SORT_OPTIONS = ['Most Popular', 'Name A-Z', 'Experience'];

const ShopStylists = () => {
  const { shopSlug } = useParams();
  const { loadShop, shopError, shopLoading, currentShop } = useContext(ShopContext);
  const { backendUrl } = useContext(AppContext);
  const navigate = useNavigate();

  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState('Most Popular');
  const [showFilter, setShowFilter] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [filterAvail, setFilterAvail] = useState('all'); // 'all' | 'available'

  useEffect(() => {
    if (shopSlug) loadShop(shopSlug);
  }, [shopSlug]);

  useEffect(() => {
    if (currentShop?.slug === shopSlug) fetchDoctors();
  }, [currentShop]);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${backendUrl}/api/shop/${shopSlug}/doctors`);
      if (data.success) setDoctors(data.doctors);
    } catch {}
    setLoading(false);
  };

  const filtered = doctors
    .filter((d) => {
      const q = search.toLowerCase();
      const matchSearch = !search ||
        d.name.toLowerCase().includes(q) ||
        d.specialty?.join(' ').toLowerCase().includes(q);
      const matchAvail = filterAvail === 'all' || d.available;
      return matchSearch && matchAvail;
    })
    .sort((a, b) => {
      if (sort === 'Name A-Z') return a.name.localeCompare(b.name);
      if (sort === 'Experience') {
        const pa = parseInt(a.experience) || 0;
        const pb = parseInt(b.experience) || 0;
        return pb - pa;
      }
      // Most Popular: available first
      return (b.available ? 1 : 0) - (a.available ? 1 : 0);
    });

  if (shopLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (shopError && !shopError.suspended) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Store size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">{shopError.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Our Stylists</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Found <span className="font-semibold text-gray-700">{filtered.length}</span> stylists
          </p>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stylists..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
          />
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <p className="text-sm text-gray-500">
          Showing {filtered.length} of {doctors.length} stylists
        </p>

        <div className="flex items-center gap-2">
          {/* View toggles */}
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100 text-primary' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-gray-100 text-primary' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <User size={16} />
            </button>
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="appearance-none border border-gray-200 rounded-xl px-4 py-2 text-sm pr-8 focus:outline-none focus:border-primary bg-white cursor-pointer"
            >
              {SORT_OPTIONS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`flex items-center gap-2 border rounded-xl px-4 py-2 text-sm transition-colors ${showFilter ? 'border-primary text-primary bg-primary/5' : 'border-gray-200 text-gray-600 hover:border-primary hover:text-primary'}`}
          >
            <SlidersHorizontal size={14} />
            Filter
          </button>
        </div>
      </div>

      {/* Filter panel */}
      {showFilter && (
        <div className="mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-4 flex-wrap">
          <span className="text-sm font-medium text-gray-700">Availability:</span>
          {[['all', 'All'], ['available', 'Available Today']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilterAvail(val)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filterAvail === val ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-primary hover:text-primary'}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Scissors size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-400">No stylists found.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
          {filtered.map((doc) => (
            <StylistCard key={doc._id} doc={doc} shopSlug={shopSlug} navigate={navigate} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((doc) => (
            <StylistListCard key={doc._id} doc={doc} shopSlug={shopSlug} navigate={navigate} />
          ))}
        </div>
      )}
    </div>
  );
};

const StylistCard = ({ doc, shopSlug, navigate }) => (
  <div
    onClick={() => navigate(`/${shopSlug}/appointment/${doc._id}`)}
    className={`bg-white rounded-2xl overflow-hidden cursor-pointer group transition-all duration-200 hover:shadow-xl hover:-translate-y-1 border-2 ${doc.available ? 'border-primary/30 hover:border-primary' : 'border-gray-100'}`}
  >
    {/* Image */}
    <div className="relative overflow-hidden" style={{ aspectRatio: '3/4' }}>
      {doc.image ? (
        <img
          src={doc.image}
          alt={doc.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-primary/10 to-blue-50 flex items-center justify-center">
          <User size={40} className="text-primary/30" />
        </div>
      )}

      {/* Available Today badge */}
      {doc.available && (
        <span className="absolute top-3 right-3 bg-emerald-500 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 shadow">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          Available Today
        </span>
      )}

      {/* Name + specialty overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent px-3 pb-3 pt-8">
        <p className="text-white font-bold text-sm leading-tight">{doc.name}</p>
        {doc.specialty?.length > 0 && (
          <p className="text-white/75 text-[11px] mt-0.5 flex items-center gap-1">
            <Scissors size={10} />
            {doc.specialty.slice(0, 2).join(', ')}
          </p>
        )}
      </div>
    </div>

    {/* Details */}
    <div className="px-3 py-3 space-y-1.5">
      {doc.experience && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Calendar size={12} className="text-primary/60" />
          <span>{doc.experience} Experience</span>
        </div>
      )}
      {doc.instagram && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Instagram size={12} className="text-pink-400" />
          <span>@{doc.instagram}</span>
        </div>
      )}
      <div className="flex items-center gap-1.5 text-xs">
        <span className={`w-2 h-2 rounded-full ${doc.available ? 'bg-emerald-500' : 'bg-gray-300'}`} />
        <span className={doc.available ? 'text-emerald-600' : 'text-gray-400'}>
          {doc.available ? 'Currently Available' : 'Currently Not Available'}
        </span>
      </div>
    </div>

    {/* CTA */}
    <div className="px-3 pb-3">
      {doc.available ? (
        <button className="w-full bg-primary text-white text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5 hover:bg-primary/90 transition-colors">
          <Calendar size={13} />
          Book Appointment
        </button>
      ) : (
        <button disabled className="w-full bg-gray-100 text-gray-400 text-xs font-semibold py-2.5 rounded-xl cursor-not-allowed">
          Not Available
        </button>
      )}
    </div>
  </div>
);

const StylistListCard = ({ doc, shopSlug, navigate }) => (
  <div
    onClick={() => navigate(`/${shopSlug}/appointment/${doc._id}`)}
    className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer flex gap-4 p-4"
  >
    <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
      {doc.image
        ? <img src={doc.image} alt={doc.name} className="w-full h-full object-cover" />
        : <div className="w-full h-full bg-primary/10 flex items-center justify-center"><User size={24} className="text-primary/40" /></div>
      }
      {doc.available && (
        <span className="absolute top-1 right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
      )}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold text-gray-800">{doc.name}</p>
          {doc.specialty?.length > 0 && (
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <Scissors size={10} /> {doc.specialty.slice(0, 3).join(', ')}
            </p>
          )}
        </div>
        {doc.available ? (
          <span className="bg-emerald-50 text-emerald-600 text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">Available Today</span>
        ) : (
          <span className="bg-gray-50 text-gray-400 text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">Not Available</span>
        )}
      </div>
      <div className="flex items-center gap-4 mt-2 flex-wrap">
        {doc.experience && (
          <span className="text-xs text-gray-500 flex items-center gap-1"><Calendar size={11} className="text-primary/60" />{doc.experience}</span>
        )}
        {doc.instagram && (
          <span className="text-xs text-gray-500 flex items-center gap-1"><Instagram size={11} className="text-pink-400" />@{doc.instagram}</span>
        )}
      </div>
    </div>
    <div className="flex items-center">
      {doc.available ? (
        <button className="bg-primary text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors whitespace-nowrap">
          Book
        </button>
      ) : (
        <button disabled className="bg-gray-100 text-gray-400 text-xs font-semibold px-4 py-2 rounded-xl cursor-not-allowed whitespace-nowrap">
          Not Available
        </button>
      )}
    </div>
  </div>
);

export default ShopStylists;
