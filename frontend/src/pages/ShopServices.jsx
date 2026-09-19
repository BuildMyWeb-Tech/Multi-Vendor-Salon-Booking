import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';
import { Scissors, Loader2, Search, Plus, Tag, Star, SlidersHorizontal, ArrowRight } from 'lucide-react';

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
            {filtered.map((svc, idx) => (
              <ServiceCard key={svc._id} svc={svc} idx={idx} shopSlug={shopSlug} navigate={navigate} />
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

const ServiceCard = ({ svc, idx, shopSlug, navigate }) => {
  const isPopular = idx < 2; // first two treated as popular for demo

  return (
    <div
      onClick={() => navigate(`/${shopSlug}/stylists`)}
      className="bg-white rounded-2xl overflow-hidden cursor-pointer group border border-gray-100 hover:border-primary/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ height: '160px' }}>
        {svc.imageUrl ? (
          <img
            src={svc.imageUrl}
            alt={svc.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/10 via-blue-50 to-indigo-50 flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-white shadow-md flex items-center justify-center">
              <Scissors size={28} className="text-primary/60" />
            </div>
          </div>
        )}

        {/* Popular badge */}
        {isPopular && (
          <span className="absolute top-3 right-3 bg-amber-400 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow">
            <Star size={9} fill="white" />
            Popular
          </span>
        )}
      </div>

      {/* Details */}
      <div className="p-4">
        <div className="flex items-start gap-2 mb-1">
          <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Scissors size={12} className="text-primary" />
          </div>
          <p className="font-semibold text-gray-800 text-sm leading-tight">{svc.name}</p>
        </div>

        {svc.description && (
          <p className="text-xs text-gray-400 mt-1.5 line-clamp-2 pl-8">{svc.description}</p>
        )}

        <div className="flex items-center justify-between mt-3 pl-8">
          <div>
            <p className="text-[10px] text-gray-400 font-medium">Starting from</p>
            <p className="text-primary font-bold text-sm">₹{svc.basePrice}</p>
          </div>
          <button className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors shadow-sm">
            <Plus size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShopServices;
