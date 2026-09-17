// frontend/src/pages/ShopStylists.jsx
// Shop-aware wrapper around the existing Doctors/Stylists page
import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import {
  Search, Scissors, Loader2, Store
} from 'lucide-react';

const ShopStylists = () => {
  const { shopSlug } = useParams();
  const { loadShop, shopError, shopLoading, currentShop } = useContext(ShopContext);
  const { backendUrl } = useContext(AppContext);
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

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

  const filtered = doctors.filter((d) =>
    !search || d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.specialty?.join(' ').toLowerCase().includes(search.toLowerCase())
  );

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
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          {currentShop?.shopName ? `${currentShop.shopName} — ` : ''}Stylists
        </h1>
        <p className="text-gray-500 mt-1">Book an appointment with our professional stylists</p>
      </div>

      {/* Search */}
      <div className="relative mb-8 max-w-md">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search stylists..."
          className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Scissors size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-400">No stylists found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
          {filtered.map((doc) => (
            <div
              key={doc._id}
              onClick={() => navigate(`/${shopSlug}/appointment/${doc._id}`)}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group overflow-hidden"
            >
              <div className="aspect-square overflow-hidden bg-gray-50">
                <img
                  src={doc.image}
                  alt={doc.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className={`w-2 h-2 rounded-full ${doc.available ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                  <span className={`text-xs font-medium ${doc.available ? 'text-emerald-600' : 'text-gray-400'}`}>
                    {doc.available ? 'Available' : 'Unavailable'}
                  </span>
                </div>
                <p className="font-semibold text-gray-800">{doc.name}</p>
                {doc.specialty?.length > 0 && (
                  <p className="text-xs text-gray-400 mt-0.5">{doc.specialty[0]}</p>
                )}
                {doc.experience && (
                  <p className="text-xs text-gray-400">{doc.experience} experience</p>
                )}
                {doc.price > 0 && (
                  <p className="text-sm font-bold text-primary mt-2">₹{doc.price}</p>
                )}
                {doc.available && (
                  <button className="w-full mt-3 bg-primary text-white text-xs font-medium py-2 rounded-lg hover:bg-primary/90 transition-colors">
                    Book Appointment
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShopStylists;
