import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';
import { Scissors, Loader2, Search } from 'lucide-react';

const ShopServices = () => {
  const { shopSlug } = useParams();
  const { backendUrl } = useContext(AppContext);
  const { currentShop } = useContext(ShopContext);
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!shopSlug || !backendUrl) return;
    setLoading(true);
    axios.get(`${backendUrl}/api/shop/${shopSlug}/services`)
      .then(res => {
        if (res.data.success) setServices(res.data.services.filter(s => s.isActive));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [shopSlug, backendUrl]);

  const filtered = services.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const shopName = currentShop?.shopName || (shopSlug ? shopSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Salon');

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Our Services</h1>
        <p className="text-gray-500 mt-2">{shopName} — Professional salon services</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md mx-auto mb-8">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search services..."
          className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Scissors size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-400">{search ? 'No services match your search.' : 'No services available yet.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
          {filtered.map(svc => (
            <div
              key={svc._id}
              onClick={() => navigate(`/${shopSlug}/stylists`)}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer overflow-hidden"
            >
              {svc.imageUrl ? (
                <img src={svc.imageUrl} alt={svc.name} className="w-full h-36 object-cover" />
              ) : (
                <div className="w-full h-36 bg-gradient-to-br from-primary/10 to-blue-100 flex items-center justify-center">
                  <Scissors size={28} className="text-primary/50" />
                </div>
              )}
              <div className="p-4">
                <p className="font-semibold text-gray-800 text-sm">{svc.name}</p>
                {svc.description && (
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{svc.description}</p>
                )}
                <div className="flex items-center justify-between mt-3">
                  <span className="text-primary font-bold text-sm">₹{svc.basePrice}</span>
                  <button className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full hover:bg-primary hover:text-white transition-colors">
                    Book
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShopServices;
