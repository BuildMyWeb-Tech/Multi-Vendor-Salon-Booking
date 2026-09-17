// frontend/src/pages/ShopHome.jsx
// Dynamic customer landing page for a specific salon (:shopSlug)
import React, { useEffect, useContext, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import {
  MapPin, Phone, Mail, Clock, Scissors, Star,
  Calendar, ArrowRight, AlertCircle, Loader2, Store
} from 'lucide-react';

const ShopHome = () => {
  const { shopSlug } = useParams();
  const { loadShop, currentShop, shopLoading, shopError } = useContext(ShopContext);
  const { backendUrl } = useContext(AppContext);
  const navigate = useNavigate();

  const [doctors, setDoctors] = useState([]);
  const [services, setServices] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    if (shopSlug) {
      loadShop(shopSlug);
    }
  }, [shopSlug]);

  useEffect(() => {
    if (currentShop?.shopId && currentShop.slug === shopSlug) {
      fetchShopData();
    }
  }, [currentShop]);

  const fetchShopData = async () => {
    setDataLoading(true);
    try {
      const [docRes, svcRes] = await Promise.all([
        axios.get(`${backendUrl}/api/shop/${shopSlug}/doctors`),
        axios.get(`${backendUrl}/api/shop/${shopSlug}/services`),
      ]);
      if (docRes.data.success) setDoctors(docRes.data.doctors);
      if (svcRes.data.success) setServices(svcRes.data.services);
    } catch {}
    setDataLoading(false);
  };

  if (shopLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={36} className="animate-spin text-primary mx-auto mb-3" />
          <p className="text-gray-500">Loading salon...</p>
        </div>
      </div>
    );
  }

  if (shopError) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          {shopError.suspended ? (
            <>
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={28} className="text-orange-500" />
              </div>
              <h1 className="text-xl font-bold text-gray-800 mb-2">Salon Unavailable</h1>
              <p className="text-gray-500">{shopError.message}</p>
              {shopError.shopName && (
                <p className="text-sm text-gray-400 mt-2">{shopError.shopName}</p>
              )}
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Store size={28} className="text-gray-400" />
              </div>
              <h1 className="text-xl font-bold text-gray-800 mb-2">Salon Not Found</h1>
              <p className="text-gray-500 text-sm">{shopError.message || 'This salon does not exist.'}</p>
              <Link to="/" className="mt-4 inline-block text-primary hover:underline text-sm">
                Go to Homepage
              </Link>
            </>
          )}
        </div>
      </div>
    );
  }

  if (!currentShop) return null;

  const shop = currentShop;

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-primary to-purple-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {shop.logo ? (
              <img
                src={shop.logo}
                alt={shop.shopName}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-white/30 shadow-lg flex-shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <Scissors size={32} className="text-white" />
              </div>
            )}
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold">{shop.shopName}</h1>
              {(shop.address || shop.city) && (
                <p className="flex items-center gap-1.5 text-white/70 mt-2 text-sm">
                  <MapPin size={15} />
                  {[shop.address, shop.city, shop.state].filter(Boolean).join(', ')}
                </p>
              )}
              <div className="flex flex-wrap gap-4 mt-3">
                {shop.phone && (
                  <a href={`tel:${shop.phone}`} className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm">
                    <Phone size={14} />
                    {shop.phone}
                  </a>
                )}
                {shop.email && (
                  <a href={`mailto:${shop.email}`} className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm">
                    <Mail size={14} />
                    {shop.email}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-8">
            <Link
              to={`/${shopSlug}/stylists`}
              className="inline-flex items-center gap-2 bg-white text-primary font-semibold px-6 py-3 rounded-xl hover:bg-white/90 transition-all shadow-md"
            >
              <Calendar size={18} />
              Book Appointment
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-12">
        {/* Services */}
        {services.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Our Services</h2>
                <p className="text-gray-500 text-sm mt-0.5">Professional salon services</p>
              </div>
              <Link to={`/${shopSlug}/services`} className="text-primary text-sm hover:underline flex items-center gap-1">
                View All <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {services.slice(0, 8).map((svc) => (
                <div key={svc._id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
                  onClick={() => navigate(`/${shopSlug}/stylists`)}>
                  {svc.imageUrl ? (
                    <img src={svc.imageUrl} alt={svc.name} className="w-full h-24 object-cover rounded-xl mb-3" />
                  ) : (
                    <div className="w-full h-24 bg-gradient-to-br from-primary/10 to-purple-100 rounded-xl mb-3 flex items-center justify-center">
                      <Scissors size={24} className="text-primary/60" />
                    </div>
                  )}
                  <p className="font-semibold text-gray-800 text-sm">{svc.name}</p>
                  <p className="text-primary font-bold text-sm mt-1">₹{svc.basePrice}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Stylists */}
        {doctors.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Meet Our Stylists</h2>
                <p className="text-gray-500 text-sm mt-0.5">Expert professionals at your service</p>
              </div>
              <Link to={`/${shopSlug}/stylists`} className="text-primary text-sm hover:underline flex items-center gap-1">
                View All <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {doctors.slice(0, 8).map((doc) => (
                <div
                  key={doc._id}
                  onClick={() => navigate(`/${shopSlug}/appointment/${doc._id}`)}
                  className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
                >
                  <div className="w-full aspect-square rounded-xl overflow-hidden mb-3 bg-gray-100">
                    <img
                      src={doc.image}
                      alt={doc.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="flex items-center gap-1 mb-1">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                    <span className="text-xs text-emerald-600 font-medium">Available</span>
                  </div>
                  <p className="font-semibold text-gray-800 text-sm">{doc.name}</p>
                  {doc.specialty?.length > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5">{doc.specialty[0]}</p>
                  )}
                  <button className="w-full mt-3 bg-primary/10 text-primary hover:bg-primary hover:text-white text-xs font-medium py-2 rounded-lg transition-colors">
                    Book Now
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {dataLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-primary" />
          </div>
        )}

        {!dataLoading && doctors.length === 0 && services.length === 0 && (
          <div className="text-center py-16">
            <Scissors size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400">No services or stylists added yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopHome;
