// frontend/src/pages/ShopHome.jsx
// Dynamic customer landing page for a specific salon (:shopSlug)
import React, { useEffect, useContext, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import {
  MapPin, Phone, Mail, Clock, Scissors, Star,
  Calendar, ArrowRight, AlertCircle, Loader2, Store,
  Sparkles, Users, Award, ChevronRight, CheckCircle2, Zap
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
      <div className="bg-gradient-to-br from-primary via-blue-600 to-purple-700 text-white relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3 pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 py-14 sm:py-20 relative">
          {/* Logo + Name row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-6">
            {shop.logo ? (
              <img
                src={shop.logo}
                alt={shop.shopName}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-white/30 shadow-xl flex-shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 border border-white/20">
                <Scissors size={32} className="text-white" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 bg-white/20 text-white/90 text-xs font-medium px-3 py-1 rounded-full border border-white/20">
                  <CheckCircle2 size={11} /> Verified Salon
                </span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight">{shop.shopName}</h1>
              <p className="text-white/70 mt-1 text-sm sm:text-base">
                {shop.tagline || 'Your style, your story — crafted with care.'}
              </p>
            </div>
          </div>

          {/* Contact pills */}
          <div className="flex flex-wrap gap-3 mb-8">
            {(shop.address || shop.city) && (
              <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm text-white/90 text-xs px-3 py-1.5 rounded-full border border-white/15">
                <MapPin size={13} />
                {[shop.address, shop.city, shop.state].filter(Boolean).join(', ')}
              </span>
            )}
            {shop.phone && (
              <a href={`tel:${shop.phone}`} className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm text-white/90 hover:bg-white/20 text-xs px-3 py-1.5 rounded-full border border-white/15 transition-colors">
                <Phone size={13} /> {shop.phone}
              </a>
            )}
            {shop.email && (
              <a href={`mailto:${shop.email}`} className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm text-white/90 hover:bg-white/20 text-xs px-3 py-1.5 rounded-full border border-white/15 transition-colors">
                <Mail size={13} /> {shop.email}
              </a>
            )}
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3">
            <Link
              to={`/${shopSlug}/stylists`}
              className="inline-flex items-center gap-2 bg-white text-primary font-bold px-7 py-3 rounded-xl hover:bg-white/90 transition-all shadow-lg shadow-black/20 text-sm"
            >
              <Calendar size={17} />
              Book Appointment
              <ArrowRight size={15} />
            </Link>
            <Link
              to={`/${shopSlug}/services`}
              className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/25 transition-all text-sm"
            >
              <Sparkles size={16} /> Our Services
            </Link>
          </div>

          {/* Stats row */}
          <div className="mt-10 flex flex-wrap gap-6">
            {doctors.length > 0 && (
              <div className="flex items-center gap-2 text-white/80">
                <Users size={16} className="text-white/60" />
                <span className="text-sm"><span className="font-bold text-white text-lg">{doctors.length}</span> Stylists</span>
              </div>
            )}
            {services.length > 0 && (
              <div className="flex items-center gap-2 text-white/80">
                <Scissors size={16} className="text-white/60" />
                <span className="text-sm"><span className="font-bold text-white text-lg">{services.length}</span> Services</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-white/80">
              <Zap size={16} className="text-white/60" />
              <span className="text-sm font-medium">Instant Booking</span>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <Award size={16} className="text-white/60" />
              <span className="text-sm font-medium">Expert Professionals</span>
            </div>
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

        {/* Why choose us */}
        <section className="bg-gradient-to-br from-primary/5 to-blue-50 rounded-3xl p-8 sm:p-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800">Why Choose {shop.shopName}?</h2>
            <p className="text-gray-500 text-sm mt-1">Experience the difference with our expert team</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {[
              { icon: <Award size={22} className="text-primary" />, title: 'Expert Stylists', desc: 'Our team of skilled professionals brings years of experience in the latest trends and techniques.' },
              { icon: <Zap size={22} className="text-primary" />, title: 'Easy Booking', desc: 'Book your appointment online in minutes — no phone calls, no waiting in queues.' },
              { icon: <Star size={22} className="text-primary" />, title: 'Premium Products', desc: 'We only use high-quality, trusted products to give your hair and skin the care it deserves.' },
              { icon: <Calendar size={22} className="text-primary" />, title: 'Flexible Timing', desc: 'Choose appointment slots that fit your schedule with our flexible booking system.' },
              { icon: <Sparkles size={22} className="text-primary" />, title: 'Personalised Care', desc: 'Every client gets a tailored experience designed to bring out their best look.' },
              { icon: <CheckCircle2 size={22} className="text-primary" />, title: 'Satisfaction Guaranteed', desc: 'Your happiness is our priority — we go the extra mile to make sure you leave smiling.' },
            ].map(f => (
              <div key={f.title} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-3">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-gray-800 text-sm mb-1">{f.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Contact info footer card */}
        {(shop.address || shop.phone || shop.email) && (
          <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-1">Visit Us</h2>
              <div className="space-y-2 mt-3">
                {(shop.address || shop.city) && (
                  <p className="flex items-center gap-2 text-gray-600 text-sm">
                    <MapPin size={15} className="text-primary flex-shrink-0" />
                    {[shop.address, shop.city, shop.state, shop.pincode].filter(Boolean).join(', ')}
                  </p>
                )}
                {shop.phone && (
                  <a href={`tel:${shop.phone}`} className="flex items-center gap-2 text-gray-600 hover:text-primary text-sm">
                    <Phone size={15} className="text-primary flex-shrink-0" /> {shop.phone}
                  </a>
                )}
                {shop.email && (
                  <a href={`mailto:${shop.email}`} className="flex items-center gap-2 text-gray-600 hover:text-primary text-sm">
                    <Mail size={15} className="text-primary flex-shrink-0" /> {shop.email}
                  </a>
                )}
              </div>
            </div>
            <Link
              to={`/${shopSlug}/stylists`}
              className="flex-shrink-0 inline-flex items-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary/90 transition-all shadow-sm text-sm"
            >
              <Calendar size={16} /> Book Now <ChevronRight size={15} />
            </Link>
          </section>
        )}
      </div>
    </div>
  );
};

export default ShopHome;
