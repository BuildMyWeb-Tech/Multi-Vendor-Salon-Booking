import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';
import { Scissors, Loader2, Search, ArrowRight, IndianRupee, Calendar, Sparkles } from 'lucide-react';

const ShopServices = () => {
  const { shopSlug } = useParams();
  const { backendUrl } = useContext(AppContext);
  const { currentShop } = useContext(ShopContext);
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

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

  const shopName = currentShop?.shopName || (shopSlug ? shopSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Salon');

  // Derive categories from services
  const categories = ['All', ...Array.from(new Set(services.map(s => s.category).filter(Boolean)))];

  const filtered = services.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === 'All' || s.category === activeCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Our Services</h1>
        <p className="text-gray-500 mt-2">{shopName} — Professional salon services tailored for you</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md mx-auto mb-6">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search services..."
          className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white shadow-sm"
        />
      </div>

      {/* Category tabs */}
      {categories.length > 1 && (
        <div className="flex gap-2 flex-wrap justify-center mb-8">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${activeCategory === cat ? 'bg-primary text-white shadow-md shadow-primary/25' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

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
        <>
          <p className="text-sm text-gray-500 mb-4">
            Showing <span className="font-semibold text-gray-700">{filtered.length}</span> services
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
            {filtered.map((svc) => (
              <ServiceCard key={svc._id} svc={svc} shopSlug={shopSlug} navigate={navigate} />
            ))}
          </div>
        </>
      )}

      {/* CTA */}
      {!loading && filtered.length > 0 && (
        <div className="mt-12 bg-gradient-to-r from-primary/10 to-blue-50 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-gray-800 text-lg">Ready for a transformation?</h3>
            <p className="text-gray-500 text-sm mt-1">Book with one of our expert stylists today</p>
          </div>
          <button
            onClick={() => navigate(`/${shopSlug}/stylists`)}
            className="bg-primary text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-md shadow-primary/20 whitespace-nowrap"
          >
            View Stylists <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

const ServiceCard = ({ svc, shopSlug, navigate }) => (
  <div
    onClick={() => navigate(`/${shopSlug}/stylists`)}
    className="bg-white rounded-2xl overflow-hidden cursor-pointer group border border-gray-100 hover:border-primary/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col"
  >
    {/* Image / Icon area */}
    <div className="overflow-hidden" style={{ height: '160px' }}>
      {svc.imageUrl ? (
        <img
          src={svc.imageUrl}
          alt={svc.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-primary/8 via-blue-50 to-indigo-50 flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-primary/10 flex items-center justify-center">
            <Scissors size={28} className="text-primary/50" />
          </div>
        </div>
      )}
    </div>

    {/* Details */}
    <div className="p-4 flex flex-col gap-2 flex-1">
      <p className="font-bold text-gray-900 text-base leading-tight">{svc.name}</p>

      {svc.description && (
        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{svc.description}</p>
      )}

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
        <div className="flex items-center gap-0.5 text-primary font-bold text-base">
          <IndianRupee size={14} className="mt-0.5" />
          <span>{svc.basePrice}</span>
        </div>
        <button
          className="flex items-center gap-1.5 bg-primary text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
          onClick={e => { e.stopPropagation(); navigate(`/${shopSlug}/stylists`); }}
        >
          <Calendar size={12} />
          Book
        </button>
      </div>
    </div>
  </div>
);

export default ShopServices;
