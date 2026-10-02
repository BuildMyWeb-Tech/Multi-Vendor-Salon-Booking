import React, { useEffect, useContext, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import {
  MapPin, Phone, Mail, Clock, Scissors, Star,
  Calendar, ArrowRight, AlertCircle, Loader2, Store,
  Sparkles, Users, Award, ChevronRight, CheckCircle2, Zap,
  Plus, User, Instagram, Tag, Percent, IndianRupee
} from 'lucide-react';

const ShopHome = () => {
  const { shopSlug } = useParams();
  const { loadShop, currentShop, shopLoading, shopError } = useContext(ShopContext);
  const { backendUrl } = useContext(AppContext);
  const navigate = useNavigate();

  const [doctors, setDoctors] = useState([]);
  const [services, setServices] = useState([]);
  const [packages, setPackages] = useState([]);
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
      const [docRes, svcRes, pkgRes] = await Promise.all([
        axios.get(`${backendUrl}/api/shop/${shopSlug}/doctors`),
        axios.get(`${backendUrl}/api/shop/${shopSlug}/services`),
        axios.get(`${backendUrl}/api/user/packages?shopSlug=${shopSlug}`),
      ]);
      if (docRes.data.success) setDoctors(docRes.data.doctors);
      if (svcRes.data.success) setServices(svcRes.data.services.filter(s => s.isActive));
      if (pkgRes.data.success) setPackages(pkgRes.data.packages || []);
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

        {/* ─── Trending Combo Packs ───────────────────── */}
        {packages.length > 0 && (
          <section>
            <SectionHeader
              title="Trending Combo Packs"
              subtitle="Exclusive deals on your favourite service combos"
              link={`/${shopSlug}/stylists`}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {packages.map((pkg) => {
                const pkgServices = services.filter(s => pkg.serviceIds?.some(id => String(id) === String(s._id)));
                const subtotal = pkgServices.reduce((sum, s) => sum + s.basePrice, 0);
                const comboPrice = pkg.discountPercent ? Math.round(subtotal * (1 - pkg.discountPercent / 100)) : subtotal;
                return (
                  <div
                    key={pkg._id}
                    onClick={() => navigate(`/${shopSlug}/stylists`)}
                    className="cursor-pointer bg-gradient-to-br from-primary/5 to-blue-50 border border-primary/20 rounded-2xl p-5 hover:shadow-md hover:border-primary/40 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Tag size={18} className="text-primary" />
                      </div>
                      <span className="flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full">
                        <Percent size={11} /> {pkg.discountPercent}% OFF
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-800 text-base mb-1">{pkg.name}</h3>
                    {pkgServices.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {pkgServices.map(s => (
                          <span key={s._id} className="text-[10px] bg-white border border-primary/15 text-gray-600 px-2 py-0.5 rounded-full">{s.name}</span>
                        ))}
                      </div>
                    )}
                    {subtotal > 0 && (
                      <div className="flex items-center gap-2 pt-2 border-t border-primary/10">
                        <span className="text-gray-400 line-through text-xs">₹{subtotal}</span>
                        <span className="font-bold text-primary text-base">₹{comboPrice}</span>
                        <span className="ml-auto">
                          <button className="text-xs bg-primary text-white px-3 py-1 rounded-lg hover:bg-primary/90 transition-colors">Book</button>
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ─── Services ───────────────────────────────── */}
        {services.length > 0 && (
          <section>
            <SectionHeader
              title="Our Services"
              subtitle="Professional salon services tailored for you"
              link={`/${shopSlug}/services`}
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {services.slice(0, 8).map((svc) => (
                <HomeServiceCard key={svc._id} svc={svc} shopSlug={shopSlug} navigate={navigate} />
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
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([shop.address, shop.city, shop.state, shop.pincode].filter(Boolean).join(', '))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-gray-600 text-sm hover:text-primary transition-colors"
                    >
                      <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MapPin size={14} className="text-primary" />
                      </span>
                      {[shop.address, shop.city, shop.state, shop.pincode].filter(Boolean).join(', ')}
                    </a>
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

/* ── Service card ── */
const HomeServiceCard = ({ svc, shopSlug, navigate }) => (
  <div
    onClick={() => navigate(`/${shopSlug}/stylists`)}
    className="bg-white rounded-2xl overflow-hidden cursor-pointer group border border-gray-100 hover:border-primary/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col"
  >
    {/* Image */}
    <div className="overflow-hidden" style={{ height: '150px' }}>
      {svc.imageUrl ? (
        <img src={svc.imageUrl} alt={svc.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-primary/10 via-blue-50 to-indigo-50 flex items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-primary/10 flex items-center justify-center">
            <Scissors size={26} className="text-primary/50" />
          </div>
        </div>
      )}
    </div>

    {/* Details */}
    <div className="p-4 flex flex-col gap-2 flex-1">
      <p className="font-bold text-gray-900 text-sm leading-tight">{svc.name}</p>

      {svc.description && (
        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{svc.description}</p>
      )}

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
        <div className="flex items-center gap-0.5 text-primary font-bold text-sm">
          <IndianRupee size={12} className="mt-0.5" />
          <span>{svc.basePrice}</span>
        </div>
        <button
          className="flex items-center gap-1 bg-primary text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
          onClick={e => { e.stopPropagation(); navigate(`/${shopSlug}/stylists`); }}
        >
          <Calendar size={11} /> Book
        </button>
      </div>
    </div>
  </div>
);

/* ── Stylist card ── */
const HomeStylistCard = ({ doc, shopSlug, navigate }) => (
  <div
    onClick={() => navigate(`/${shopSlug}/appointment/${doc._id}`)}
    className="bg-white rounded-2xl overflow-hidden cursor-pointer group transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border border-gray-100 shadow-sm"
  >
    {/* Square image */}
    <div className="relative overflow-hidden" style={{ aspectRatio: '1/1' }}>
      {doc.image ? (
        <img src={doc.image} alt={doc.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-primary/10 to-blue-50 flex items-center justify-center">
          <User size={40} className="text-primary/30" />
        </div>
      )}
      {/* Availability dot */}
      <span className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full border-2 border-white shadow ${doc.available !== false ? 'bg-emerald-400' : 'bg-gray-300'}`} />
    </div>

    {/* Details */}
    <div className="px-3 pt-2.5 pb-3 space-y-1.5">
      <p className="font-bold text-gray-900 text-sm leading-tight truncate">{doc.name}</p>

      {doc.specialty?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {doc.specialty.map((s) => (
            <span key={s} className="bg-primary/8 text-primary text-[10px] font-medium px-2 py-0.5 rounded-full border border-primary/15">
              {s}
            </span>
          ))}
        </div>
      )}

      {doc.experience && (
        <p className="text-[11px] text-gray-400 flex items-center gap-1">
          <Award size={10} className="text-amber-400 flex-shrink-0" />
          {doc.experience}
        </p>
      )}

      <button className="w-full mt-1 bg-primary text-white text-[11px] font-semibold py-2 rounded-xl flex items-center justify-center gap-1 hover:bg-primary/90 transition-colors">
        <Calendar size={11} /> Book
      </button>
    </div>
  </div>
);

export default ShopHome;
