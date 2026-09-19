import React, { useEffect, useContext, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import {
  MapPin, Phone, Mail, Clock, Scissors, Star,
  Calendar, ArrowRight, AlertCircle, Loader2, Store,
  Sparkles, Users, Award, ChevronRight, CheckCircle2, Zap,
  Plus, User, Instagram
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
    if (shopSlug) loadShop(shopSlug);
  }, [shopSlug]);

  useEffect(() => {
    if (currentShop?.shopId && currentShop.slug === shopSlug) fetchShopData();
  }, [currentShop]);

  const fetchShopData = async () => {
    setDataLoading(true);
    try {
      const [docRes, svcRes] = await Promise.all([
        axios.get(`${backendUrl}/api/shop/${shopSlug}/doctors`),
        axios.get(`${backendUrl}/api/shop/${shopSlug}/services`),
      ]);
      if (docRes.data.success) setDoctors(docRes.data.doctors);
      if (svcRes.data.success) setServices(svcRes.data.services.filter(s => s.isActive));
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
              {shopError.shopName && <p className="text-sm text-gray-400 mt-2">{shopError.shopName}</p>}
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Store size={28} className="text-gray-400" />
              </div>
              <h1 className="text-xl font-bold text-gray-800 mb-2">Salon Not Found</h1>
              <p className="text-gray-500 text-sm">{shopError.message || 'This salon does not exist.'}</p>
              <Link to="/" className="mt-4 inline-block text-primary hover:underline text-sm">Go to Homepage</Link>
            </>
          )}
        </div>
      </div>
    );
  }

  if (!currentShop) return null;
  const shop = currentShop;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ─── Hero Banner ─────────────────────────────── */}
      <div className="bg-gradient-to-br from-primary via-blue-600 to-purple-700 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3 pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 w-40 h-40 bg-white/5 rounded-full pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 py-14 sm:py-20 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-6">
            {shop.logo ? (
              <img src={shop.logo} alt={shop.shopName}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-white/30 shadow-xl flex-shrink-0" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 border border-white/20">
                <Scissors size={32} className="text-white" />
              </div>
            )}
            <div>
              <span className="inline-flex items-center gap-1 bg-white/20 text-white/90 text-xs font-medium px-3 py-1 rounded-full border border-white/20 mb-2">
                <CheckCircle2 size={11} /> Verified Salon
              </span>
              <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight">{shop.shopName}</h1>
              <p className="text-white/70 mt-1 text-sm sm:text-base">
                {shop.tagline || 'Your style, your story — crafted with care.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mb-8">
            {(shop.address || shop.city) && (
              <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm text-white/90 text-xs px-3 py-1.5 rounded-full border border-white/15">
                <MapPin size={13} /> {[shop.address, shop.city, shop.state].filter(Boolean).join(', ')}
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

          <div className="flex flex-wrap gap-3">
            <Link to={`/${shopSlug}/stylists`}
              className="inline-flex items-center gap-2 bg-white text-primary font-bold px-7 py-3 rounded-xl hover:bg-white/90 transition-all shadow-lg shadow-black/20 text-sm">
              <Calendar size={17} /> Book Appointment <ArrowRight size={15} />
            </Link>
            <Link to={`/${shopSlug}/services`}
              className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/25 transition-all text-sm">
              <Sparkles size={16} /> Our Services
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap gap-6">
            {[
              { icon: Users, label: 'Expert Stylists' },
              { icon: Scissors, label: 'Our Services' },
              { icon: Zap, label: 'Instant Booking' },
              { icon: Star, label: 'Top Rated' },
              { icon: Award, label: 'Certified Pros' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2.5">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Icon size={16} className="text-white" />
                </div>
                <span className="text-white text-sm font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-14">

        {/* ─── Services ───────────────────────────────── */}
        {services.length > 0 && (
          <section>
            <SectionHeader
              title="Our Services"
              subtitle="Professional salon services tailored for you"
              link={`/${shopSlug}/services`}
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
              {services.slice(0, 8).map((svc, idx) => (
                <HomeServiceCard key={svc._id} svc={svc} idx={idx} shopSlug={shopSlug} navigate={navigate} />
              ))}
            </div>
          </section>
        )}

        {/* ─── Stylists ───────────────────────────────── */}
        {doctors.length > 0 && (
          <section>
            <SectionHeader
              title="Meet Our Stylists"
              subtitle="Expert professionals at your service"
              link={`/${shopSlug}/stylists`}
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
              {doctors.slice(0, 8).map((doc) => (
                <HomeStylistCard key={doc._id} doc={doc} shopSlug={shopSlug} navigate={navigate} />
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

        {/* ─── Why Choose Us ──────────────────────────── */}
        <section className="bg-gradient-to-br from-primary/5 via-blue-50 to-indigo-50 rounded-3xl p-8 sm:p-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800">Why Choose {shop.shopName}?</h2>
            <p className="text-gray-500 text-sm mt-1">Experience the difference with our expert team</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {[
              { icon: Award, title: 'Expert Stylists', desc: 'Skilled professionals with years of experience in the latest trends and techniques.' },
              { icon: Zap, title: 'Easy Booking', desc: 'Book your appointment online in minutes — no calls, no queues.' },
              { icon: Star, title: 'Premium Products', desc: 'We use only high-quality, trusted products for your hair and skin.' },
              { icon: Calendar, title: 'Flexible Timing', desc: 'Choose slots that fit your schedule with our flexible booking system.' },
              { icon: Sparkles, title: 'Personalised Care', desc: 'Tailored experience designed to bring out your best look.' },
              { icon: CheckCircle2, title: 'Satisfaction Guaranteed', desc: 'Your happiness is our priority — we go the extra mile every time.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title}
                className="bg-white rounded-2xl p-5 border border-white shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group">
                <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary group-hover:scale-110 transition-all duration-200">
                  <Icon size={20} className="text-primary group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-bold text-gray-800 text-sm mb-1.5">{title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Visit Us ───────────────────────────────── */}
        {(shop.address || shop.phone || shop.email) && (
          <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-3">Visit Us</h2>
                <div className="space-y-2.5">
                  {(shop.address || shop.city) && (
                    <p className="flex items-center gap-2 text-gray-600 text-sm">
                      <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MapPin size={14} className="text-primary" />
                      </span>
                      {[shop.address, shop.city, shop.state, shop.pincode].filter(Boolean).join(', ')}
                    </p>
                  )}
                  {shop.phone && (
                    <a href={`tel:${shop.phone}`} className="flex items-center gap-2 text-gray-600 hover:text-primary text-sm transition-colors">
                      <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Phone size={14} className="text-primary" />
                      </span>
                      {shop.phone}
                    </a>
                  )}
                  {shop.email && (
                    <a href={`mailto:${shop.email}`} className="flex items-center gap-2 text-gray-600 hover:text-primary text-sm transition-colors">
                      <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Mail size={14} className="text-primary" />
                      </span>
                      {shop.email}
                    </a>
                  )}
                </div>
              </div>
              <Link to={`/${shopSlug}/stylists`}
                className="flex-shrink-0 inline-flex items-center gap-2 bg-primary text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-primary/90 transition-all shadow-md shadow-primary/25 text-sm">
                <Calendar size={16} /> Book Appointment <ChevronRight size={15} />
              </Link>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

/* ── Shared section header ── */
const SectionHeader = ({ title, subtitle, link }) => (
  <div className="flex items-end justify-between mb-6">
    <div>
      <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
      <p className="text-gray-500 text-sm mt-0.5">{subtitle}</p>
    </div>
    <Link to={link}
      className="flex items-center gap-1 text-primary text-sm font-semibold hover:gap-2 transition-all">
      View All <ArrowRight size={14} />
    </Link>
  </div>
);

/* ── Service card (matches ShopServices style) ── */
const HomeServiceCard = ({ svc, idx, shopSlug, navigate }) => {
  const isPopular = idx < 2;
  return (
    <div
      onClick={() => navigate(`/${shopSlug}/stylists`)}
      className="bg-white rounded-2xl overflow-hidden cursor-pointer group border border-gray-100 hover:border-primary/30 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-200"
    >
      <div className="relative overflow-hidden" style={{ height: '140px' }}>
        {svc.imageUrl ? (
          <img src={svc.imageUrl} alt={svc.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/10 via-blue-50 to-indigo-50 flex items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-white shadow-md flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Scissors size={24} className="text-primary/60" />
            </div>
          </div>
        )}
        {isPopular && (
          <span className="absolute top-2.5 right-2.5 bg-amber-400 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
            <Star size={9} fill="white" /> Popular
          </span>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start gap-2 mb-1">
          <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-primary/20 transition-colors">
            <Scissors size={11} className="text-primary" />
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
          <button className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-200 shadow-sm">
            <Plus size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Stylist card (matches ShopStylists style) ── */
const HomeStylistCard = ({ doc, shopSlug, navigate }) => (
  <div
    onClick={() => navigate(`/${shopSlug}/appointment/${doc._id}`)}
    className={`bg-white rounded-2xl overflow-hidden cursor-pointer group transition-all duration-200 hover:shadow-xl hover:-translate-y-1.5 border-2 ${doc.available ? 'border-primary/20 hover:border-primary' : 'border-gray-100'}`}
  >
    {/* Portrait image */}
    <div className="relative overflow-hidden" style={{ aspectRatio: '3/4' }}>
      {doc.image ? (
        <img src={doc.image} alt={doc.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-primary/10 to-blue-50 flex items-center justify-center">
          <User size={40} className="text-primary/30" />
        </div>
      )}

      {/* Available badge */}
      {doc.available && (
        <span className="absolute top-2.5 right-2.5 bg-emerald-500 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          Available Today
        </span>
      )}

      {/* Name overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent px-3 pb-3 pt-8">
        <p className="text-white font-bold text-sm leading-tight">{doc.name}</p>
        {doc.specialty?.length > 0 && (
          <p className="text-white/75 text-[11px] mt-0.5 flex items-center gap-1">
            <Scissors size={10} /> {doc.specialty.slice(0, 2).join(', ')}
          </p>
        )}
      </div>
    </div>

    {/* Info */}
    <div className="px-3 py-3 space-y-1">
      <div className="flex items-center gap-1.5 text-xs">
        <span className={`w-2 h-2 rounded-full ${doc.available ? 'bg-emerald-500' : 'bg-gray-300'}`} />
        <span className={doc.available ? 'text-emerald-600' : 'text-gray-400'}>
          {doc.available ? 'Currently Available' : 'Currently Not Available'}
        </span>
      </div>
      {doc.experience && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Calendar size={11} className="text-primary/60" />
          <span>{doc.experience}</span>
        </div>
      )}
    </div>

    {/* CTA */}
    <div className="px-3 pb-3">
      {doc.available ? (
        <button className="w-full bg-primary text-white text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5 hover:bg-primary/90 transition-colors">
          <Calendar size={12} /> Book Appointment
        </button>
      ) : (
        <button disabled className="w-full bg-gray-100 text-gray-400 text-xs font-semibold py-2.5 rounded-xl cursor-not-allowed">
          Not Available
        </button>
      )}
    </div>
  </div>
);

export default ShopHome;
