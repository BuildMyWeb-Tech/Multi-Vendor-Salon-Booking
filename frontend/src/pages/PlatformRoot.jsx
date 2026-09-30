import React, { useState, useEffect, useRef } from 'react';
import {
  Scissors, Calendar, Bell, Star, MapPin, Clock,
  Sparkles, Users, Award, Zap, Shield, ArrowRight,
  CheckCircle, ChevronRight, Store, Phone, Search,
  CreditCard, Receipt, Tag, Percent, UserCheck, LayoutDashboard,
  Building2, BadgeCheck, Smartphone, QrCode, Package, TrendingUp,
  Globe, Lock, ChevronDown, Layers, PanelLeft, Settings,
  MessageCircle, Mail, Instagram, Facebook, Menu, X, Check,
  Quote, Play,
} from 'lucide-react';

// ── Data ────────────────────────────────────────────────────────────────────

const WHATSAPP_NUMBER = '919344095727';
const WHATSAPP_MSG = encodeURIComponent('Hi, I want salon booking app pricing for my salon');
const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MSG}`;

const featureCategories = [
  {
    id: 'salon', label: 'Core Salon System', icon: Building2,
    gradient: 'from-blue-500 to-blue-600', lightBg: 'bg-blue-50', iconColor: 'text-blue-600',
    borderColor: 'border-blue-100', hoverBorder: 'hover:border-blue-300',
    items: [
      { icon: Globe, text: 'Custom salon URL & branded booking page' },
      { icon: Layers, text: 'Service catalogue with categories & pricing' },
      { icon: Settings, text: 'Full salon admin control panel' },
      { icon: Star, text: 'Logo, gallery & profile management' },
      { icon: MapPin, text: 'Location & contact info display' },
    ],
  },
  {
    id: 'booking', label: 'Salon Booking', icon: Calendar,
    gradient: 'from-violet-500 to-violet-600', lightBg: 'bg-violet-50', iconColor: 'text-violet-600',
    borderColor: 'border-violet-100', hoverBorder: 'hover:border-violet-300',
    items: [
      { icon: Calendar, text: 'Real-time slot availability & date picker' },
      { icon: UserCheck, text: 'Choose preferred stylist per booking' },
      { icon: Bell, text: 'Instant booking confirmation notifications' },
      { icon: Clock, text: 'Reschedule & cancellation support' },
      { icon: Layers, text: 'Multi-service booking in one appointment' },
    ],
  },
  {
    id: 'service-billing', label: 'Service Billing', icon: Receipt,
    gradient: 'from-amber-500 to-orange-500', lightBg: 'bg-amber-50', iconColor: 'text-amber-600',
    borderColor: 'border-amber-100', hoverBorder: 'hover:border-amber-300',
    items: [
      { icon: Receipt, text: 'Bill services directly at the counter' },
      { icon: Scissors, text: 'Select services & quantities per visit' },
      { icon: Percent, text: 'Apply coupons & discounts at billing' },
      { icon: CreditCard, text: 'Cash, UPI or card payment modes' },
      { icon: TrendingUp, text: 'Service revenue reports & analytics' },
    ],
  },
  {
    id: 'product-billing', label: 'Product Billing', icon: Package,
    gradient: 'from-orange-500 to-red-500', lightBg: 'bg-orange-50', iconColor: 'text-orange-600',
    borderColor: 'border-orange-100', hoverBorder: 'hover:border-orange-300',
    items: [
      { icon: Package, text: 'Sell retail products alongside services' },
      { icon: Layers, text: 'Manage product catalogue & stock' },
      { icon: Tag, text: 'Set product price & apply discounts' },
      { icon: CreditCard, text: 'Mixed service + product invoices' },
      { icon: TrendingUp, text: 'Product sales tracking & reports' },
    ],
  },
  {
    id: 'stylist', label: 'Stylist Panel', icon: Users,
    gradient: 'from-cyan-500 to-cyan-600', lightBg: 'bg-cyan-50', iconColor: 'text-cyan-600',
    borderColor: 'border-cyan-100', hoverBorder: 'hover:border-cyan-300',
    items: [
      { icon: UserCheck, text: 'Individual login for each stylist' },
      { icon: Calendar, text: 'Personal appointment dashboard' },
      { icon: Award, text: 'Specialisation & expertise tags' },
      { icon: Bell, text: 'New booking alerts per stylist' },
      { icon: Users, text: 'Multiple stylists per salon' },
    ],
  },
  {
    id: 'create', label: 'Create Your Salon', icon: Store,
    gradient: 'from-indigo-500 to-purple-600', lightBg: 'bg-indigo-50', iconColor: 'text-indigo-600',
    borderColor: 'border-indigo-100', hoverBorder: 'hover:border-indigo-300',
    items: [
      { icon: Store, text: 'Fill & submit salon form in minutes' },
      { icon: CheckCircle, text: 'Super Admin reviews & approves request' },
      { icon: Globe, text: 'Go live with your own booking URL instantly' },
      { icon: Sparkles, text: 'No setup fee — completely free to list' },
      { icon: Settings, text: 'Admin configures features before approval' },
    ],
  },
  {
    id: 'coupons', label: 'Coupons & Discounts', icon: Tag,
    gradient: 'from-rose-500 to-pink-500', lightBg: 'bg-rose-50', iconColor: 'text-rose-600',
    borderColor: 'border-rose-100', hoverBorder: 'hover:border-rose-300',
    items: [
      { icon: Tag, text: 'Create coupon codes with custom names' },
      { icon: Percent, text: 'Percentage or flat amount discount types' },
      { icon: BadgeCheck, text: 'Set minimum order value conditions' },
      { icon: Clock, text: 'Expiry date & usage count limits' },
      { icon: Zap, text: 'Auto-apply eligible coupons at checkout' },
    ],
  },
  {
    id: 'broadcast', label: 'Broadcast & Bulk SMS', icon: Bell,
    gradient: 'from-sky-500 to-blue-600', lightBg: 'bg-sky-50', iconColor: 'text-sky-600',
    borderColor: 'border-sky-100', hoverBorder: 'hover:border-sky-300',
    items: [
      { icon: Users, text: 'Send bulk messages to all customers' },
      { icon: Bell, text: 'Broadcast offers, updates & announcements' },
      { icon: Smartphone, text: 'WhatsApp & SMS delivery channels' },
      { icon: Tag, text: 'Attach coupon codes inside messages' },
      { icon: TrendingUp, text: 'Track delivery & open rates' },
    ],
  },
];

const pricingPlans = [
  {
    id: 'starter',
    title: 'Starter',
    subtitle: 'Perfect for single-location salons just getting started',
    price: 999,
    period: '/ month',
    items: [
      'Online booking page with your salon URL',
      'Up to 3 stylists',
      'Appointment management',
      'WhatsApp booking notifications',
      'Basic service catalogue',
    ],
    callToAction: { text: 'Get Started', href: whatsappLink, target: '_blank' },
    hasRibbon: false,
  },
  {
    id: 'growth',
    title: 'Growth',
    subtitle: 'For growing salons that need full features',
    price: 1999,
    period: '/ month',
    items: [
      'Everything in Starter',
      'Up to 10 stylists',
      'POS billing (service + products)',
      'Coupons & packages',
      'UPI QR payment integration',
      'Stylist individual panel',
      'Analytics & reports',
    ],
    callToAction: { text: 'Get Started', href: whatsappLink, target: '_blank' },
    hasRibbon: true,
    ribbonTitle: 'Popular',
  },
  {
    id: 'enterprise',
    title: 'Enterprise',
    subtitle: 'For salon chains and high-volume businesses',
    price: 3999,
    period: '/ month',
    items: [
      'Everything in Growth',
      'Unlimited stylists',
      'Bulk SMS / WhatsApp broadcast',
      'Multi-branch support',
      'Priority onboarding & support',
      'Custom branding',
    ],
    callToAction: { text: 'Contact Us', href: whatsappLink, target: '_blank' },
    hasRibbon: false,
  },
];

const faqs = [
  {
    q: 'How do I get my salon listed on StyleSlot?',
    a: 'Click "List Your Salon" and fill in your salon details. Our Super Admin team reviews your submission and approves it within 24–48 hours. Once approved, you get your own booking URL.',
  },
  {
    q: 'Is there a setup fee to list my salon?',
    a: 'No setup fee. Listing your salon is completely free. You only pay the monthly subscription once your salon goes live and starts accepting bookings.',
  },
  {
    q: 'Can my clients book appointments online?',
    a: 'Yes. Your salon gets a unique URL (e.g. /your-salon-name) where clients can browse services, pick a stylist, choose a slot, and pay via UPI or at the salon.',
  },
  {
    q: 'How does the POS billing work?',
    a: 'Your admin can bill walk-in clients directly from the dashboard — select services or products, apply coupons, choose payment mode (cash/UPI/card) and generate a digital bill instantly.',
  },
  {
    q: 'Can the same stylist handle multiple salons?',
    a: 'Each stylist has a personal login per salon. If the same person works at multiple salons, they will have separate logins for each — keeping appointment and earnings data isolated.',
  },
  {
    q: 'What payment methods do clients use to book?',
    a: 'Clients can pay via UPI QR code upload (screenshot proof), or choose to pay at the salon. The admin verifies UPI payments from the dashboard before confirming.',
  },
  {
    q: 'Can I manage multiple branches of my salon?',
    a: 'Yes, with the Enterprise plan you can have multiple sub-salons under one ownership. Each branch has its own booking page, stylist panel, and admin dashboard.',
  },
  {
    q: 'How are coupons and packages set up?',
    a: 'From your admin panel, go to Coupons or Packages, create codes with conditions (minimum amount, expiry date, usage limits). Clients apply them at checkout automatically.',
  },
];

const testimonials = [
  {
    quote: "StyleSlot transformed how we run our salon. The booking page, stylist panel and POS billing all in one place — we reduced no-shows by 60% and doubled our revenue tracking.",
    name: 'Priya Menon',
    role: 'Owner, Glamour Studio — Chennai',
    initials: 'PM',
    color: 'bg-violet-500',
  },
  {
    quote: "Getting listed was so easy. Within 2 days our booking page was live. The UPI payment integration is a game-changer — clients pay before coming and we rarely have last-minute cancellations.",
    name: 'Ravi Kumar',
    role: 'Owner, The Style Hub — Bangalore',
    initials: 'RK',
    color: 'bg-blue-500',
  },
  {
    quote: "The coupons and package features have helped us run promotions very effectively. Our repeat client rate has improved significantly since we started using StyleSlot.",
    name: 'Ananya Singh',
    role: 'Owner, Blush & Bloom — Mumbai',
    initials: 'AS',
    color: 'bg-pink-500',
  },
];

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How it Works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQs', href: '#faqs' },
  { label: 'Contact', href: '#contact' },
];

const footerLinks = [
  {
    title: 'Product',
    links: [
      { text: 'Features', href: '#features' },
      { text: 'How it Works', href: '#how-it-works' },
      { text: 'Pricing', href: '#pricing' },
      { text: 'FAQs', href: '#faqs' },
    ],
  },
  {
    title: 'Company',
    links: [
      { text: 'About BuildMyWeb', href: 'https://www.buildmyweb.info', external: true },
      { text: 'Services', href: '#features' },
      { text: 'Contact', href: '#contact' },
    ],
  },
  {
    title: 'Get in Touch',
    links: [
      { text: 'buildmyweb2024@gmail.com', href: 'mailto:buildmyweb2024@gmail.com' },
      { text: '+91 93440 95727', href: 'tel:+919344095727' },
      { text: 'www.buildmyweb.info', href: 'https://www.buildmyweb.info', external: true },
    ],
  },
];

// ── Sub-components ──────────────────────────────────────────────────────────

function SectionLabel({ children, color = 'bg-primary/10 text-primary' }) {
  return (
    <div className={`inline-flex items-center gap-2 ${color} text-xs font-bold px-4 py-2 rounded-full mb-4 uppercase tracking-wider`}>
      {children}
    </div>
  );
}

function SectionHeading({ title, subtitle, centered = true }) {
  return (
    <div className={`mb-12 ${centered ? 'text-center' : ''}`}>
      <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">{title}</h2>
      {subtitle && <p className="text-gray-500 text-lg max-w-2xl mx-auto">{subtitle}</p>}
    </div>
  );
}

function FAQItem({ q, a, open, onToggle }) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left bg-white hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <span className="font-semibold text-gray-800 text-sm pr-4">{q}</span>
        <ChevronDown
          size={18}
          className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-5 pt-1 bg-white">
          <p className="text-gray-600 text-sm leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

const PlatformRoot = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const scrollTo = (href) => {
    setMenuOpen(false);
    if (href.startsWith('#')) {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">

      {/* ── Announcement bar ─────────────────────────────────────────────── */}
      <div className="bg-primary text-white text-xs text-center py-2 px-4 font-medium">
        🎉 StyleSlot v2 is live — smarter booking, POS billing and UPI payments all in one.&nbsp;
        <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="underline font-bold">Get Pricing on WhatsApp →</a>
      </div>

      {/* ── Sticky Header ────────────────────────────────────────────────── */}
      <header className={`sticky top-0 z-30 transition-all duration-300 ${scrolled ? 'bg-white shadow-md' : 'bg-white/95 backdrop-blur-sm border-b border-gray-100'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">

          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5 no-underline">
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-primary/30 flex-shrink-0">
              <Scissors size={17} className="text-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-lg font-extrabold text-gray-900 tracking-tight">StyleSlot</span>
              <span className="text-[10px] text-gray-400 font-medium -mt-0.5">by BuildMyWeb</span>
            </div>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7">
            {navLinks.map(({ label, href }) => (
              <button
                key={label}
                onClick={() => scrollTo(href)}
                className="text-sm font-medium text-gray-600 hover:text-primary transition-colors relative group bg-transparent border-0 cursor-pointer"
              >
                {label}
                <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-primary transition-all duration-200 group-hover:w-full rounded-full" />
              </button>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href="/create-salon"
              className="text-sm font-semibold text-primary border border-primary/30 hover:border-primary hover:bg-primary/5 px-4 py-2 rounded-lg transition-all"
            >
              List Your Salon
            </a>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-primary text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary/90 transition-all shadow-sm"
            >
              <MessageCircle size={14} /> Get Pricing
            </a>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={20} className="text-gray-700" /> : <Menu size={20} className="text-gray-700" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-1">
            {navLinks.map(({ label, href }) => (
              <button
                key={label}
                onClick={() => scrollTo(href)}
                className="w-full text-left px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors bg-transparent border-0 cursor-pointer"
              >
                {label}
              </button>
            ))}
            <div className="pt-3 border-t border-gray-100 space-y-2">
              <a href="/create-salon" className="block w-full text-center text-sm font-semibold text-primary border border-primary/30 px-4 py-2.5 rounded-lg hover:bg-primary/5 transition-all">
                List Your Salon
              </a>
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="block w-full text-center text-sm font-semibold bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-primary/90 transition-all">
                Get Pricing on WhatsApp
              </a>
            </div>
          </div>
        )}
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-slate-900 via-primary to-blue-700 text-white overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 pointer-events-none select-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-300/10 rounded-full translate-y-1/2 -translate-x-1/4" />
          <div className="absolute top-1/3 left-1/4 w-32 h-32 bg-yellow-300/10 rounded-full" />
          <div className="absolute top-1/2 right-1/3 w-20 h-20 bg-pink-300/10 rounded-full" />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 py-24 sm:py-36 text-center">
          {/* Tagline pill */}
          <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 text-white/90 text-xs font-bold px-4 py-2 rounded-full mb-8 uppercase tracking-widest">
            <Star size={10} fill="currentColor" className="text-yellow-300" />
            Multi-Vendor Salon Booking Platform
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold leading-tight mb-6 tracking-tight">
            The Complete <span className="text-yellow-300">Salon Booking</span>
            <br className="hidden sm:block" /> & Management Platform
          </h1>

          <p className="text-white/75 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            StyleSlot powers complete salon businesses — from customer bookings to POS billing,
            UPI payments, stylist management, coupons, packages and beyond.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white text-primary font-bold px-7 py-3.5 rounded-xl hover:bg-yellow-50 transition-all shadow-lg shadow-black/20 text-sm w-full sm:w-auto justify-center"
            >
              <MessageCircle size={16} /> Get Pricing on WhatsApp
            </a>
            <a
              href="/create-salon"
              className="inline-flex items-center gap-2 bg-white/15 border border-white/30 text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-white/25 transition-all text-sm w-full sm:w-auto justify-center"
            >
              <Store size={15} /> List Your Salon <ArrowRight size={14} />
            </a>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-5 text-white/60 text-xs">
            {[
              { icon: <Users size={13} />, text: 'Multi-salon support' },
              { icon: <Calendar size={13} />, text: 'Real-time booking' },
              { icon: <QrCode size={13} />, text: 'UPI QR payments' },
              { icon: <Receipt size={13} />, text: 'POS billing' },
              { icon: <Shield size={13} />, text: 'Super Admin panel' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-1.5">{icon}{text}</div>
            ))}
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 opacity-40 animate-bounce">
          <ChevronDown size={22} className="text-white" />
        </div>
      </section>

      {/* ── Stats Strip ──────────────────────────────────────────────────── */}
      <section className="border-b border-gray-100 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { value: '9+', label: 'Core Features' },
            { value: 'UPI', label: 'QR Payment Built-in' },
            { value: '∞', label: 'Salons Supported' },
            { value: '1-click', label: 'Booking Experience' },
          ].map(({ value, label }) => (
            <div key={label} className="group">
              <div className="text-2xl sm:text-3xl font-extrabold text-primary mb-1 group-hover:scale-110 transition-transform duration-200">{value}</div>
              <div className="text-xs text-gray-500 font-medium">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section id="features" className="max-w-7xl mx-auto w-full px-6 py-20">
        <div className="text-center mb-14">
          <SectionLabel><Sparkles size={11} /> Platform Capabilities</SectionLabel>
          <SectionHeading
            title="Everything Your Salon Needs"
            subtitle="A complete end-to-end platform — from online booking to POS billing, for every type of salon."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featureCategories.map(({ id, label, icon: CatIcon, gradient, lightBg, iconColor, borderColor, hoverBorder, items }) => (
            <div
              key={id}
              className={`group bg-white rounded-2xl border ${borderColor} ${hoverBorder} shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden`}
            >
              <div className={`bg-gradient-to-br ${gradient} p-5`}>
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                  <CatIcon size={20} className="text-white" />
                </div>
                <h3 className="text-white font-bold text-base leading-snug">{label}</h3>
              </div>
              <div className="p-4 space-y-2.5">
                {items.map(({ icon: ItemIcon, text }) => (
                  <div key={text} className="flex items-start gap-2.5">
                    <div className={`w-6 h-6 ${lightBg} rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <ItemIcon size={12} className={iconColor} />
                    </div>
                    <span className="text-gray-600 text-xs leading-snug">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="bg-gradient-to-br from-gray-50 to-blue-50/50 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <SectionLabel color="bg-blue-100 text-blue-700"><Zap size={11} /> Simple Process</SectionLabel>
            <SectionHeading
              title="How It Works"
              subtitle="From discovery to booking — three simple steps for your clients."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 relative">
            {/* Connector line */}
            <div className="hidden sm:block absolute top-8 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-primary/20 via-primary/50 to-primary/20 z-0" />

            {[
              {
                icon: Search, step: '01', title: 'Find Your Salon',
                desc: "Visit your salon's unique StyleSlot URL to see all services, stylists and available time slots.",
                color: 'bg-blue-500',
              },
              {
                icon: Calendar, step: '02', title: 'Pick a Slot',
                desc: 'Choose a stylist, date and time. Apply coupons or packages for a better deal.',
                color: 'bg-violet-500',
              },
              {
                icon: CheckCircle, step: '03', title: 'Confirm & Pay',
                desc: 'Pay via UPI QR or at the salon. Receive instant booking confirmation and reminders.',
                color: 'bg-emerald-500',
              },
            ].map(({ icon: Icon, step, title, desc, color }) => (
              <div key={step} className="group text-center relative z-10">
                <div className="relative inline-flex mb-5">
                  <div className={`w-16 h-16 ${color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mx-auto`}>
                    <Icon size={26} className="text-white" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 bg-yellow-400 text-gray-900 text-xs font-black rounded-full flex items-center justify-center shadow">
                    {step.slice(1)}
                  </span>
                </div>
                <h3 className="font-bold text-gray-800 mb-2 text-base">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* Admin steps */}
          <div className="mt-16 pt-12 border-t border-gray-200">
            <p className="text-center text-xs text-gray-400 font-semibold uppercase tracking-widest mb-8">For Salon Owners</p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
              {[
                { icon: Store, n: '1', title: 'Submit Salon', desc: 'Fill the listing form with your salon details.' },
                { icon: BadgeCheck, n: '2', title: 'Get Approved', desc: 'Our team reviews and approves within 24h.' },
                { icon: Settings, n: '3', title: 'Configure', desc: 'Set up services, stylists, slots & pricing.' },
                { icon: TrendingUp, n: '4', title: 'Go Live', desc: 'Your booking page is live. Start accepting clients!' },
              ].map(({ icon: Icon, n, title, desc }) => (
                <div key={n} className="flex items-start gap-3 bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon size={16} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-0.5">Step {n}</p>
                    <p className="font-bold text-gray-800 text-sm">{title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Services We Cover ────────────────────────────────────────────── */}
      <section className="py-20 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <SectionLabel color="bg-amber-100 text-amber-700"><Scissors size={11} /> Service Types</SectionLabel>
            <SectionHeading
              title="Services We Cover"
              subtitle="From everyday haircuts to bridal looks — every service, every salon."
            />
          </div>

          {/* Large service cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {[
              {
                icon: Scissors, label: 'Haircuts & Styling', tag: 'Most Popular',
                desc: 'Precision cuts, blowouts and everyday styling for all hair types.',
                gradient: 'from-blue-500 to-blue-600',
              },
              {
                icon: Sparkles, label: 'Colour & Highlights', tag: 'Trending',
                desc: 'Balayage, ombré, full colour and toning treatments.',
                gradient: 'from-violet-500 to-purple-600',
              },
              {
                icon: Star, label: 'Bridal & Makeup', tag: 'Premium',
                desc: 'Complete bridal packages — hair, makeup and trials included.',
                gradient: 'from-pink-500 to-rose-500',
              },
              {
                icon: Award, label: 'Spa & Treatments', tag: 'Relaxing',
                desc: 'Deep conditioning, keratin, scalp treatments and more.',
                gradient: 'from-emerald-500 to-teal-500',
              },
            ].map(({ icon: Icon, label, desc, gradient, tag }) => (
              <div
                key={label}
                className={`group relative bg-gradient-to-br ${gradient} rounded-2xl p-6 text-white overflow-hidden hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-xl`}
              >
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full" />
                <div className="absolute top-4 right-4 bg-white/20 text-white/90 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
                  {tag}
                </div>
                <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                  <Icon size={20} className="text-white" />
                </div>
                <h3 className="font-bold text-base mb-1.5 leading-snug">{label}</h3>
                <p className="text-white/75 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* Pill row */}
          <div className="flex flex-wrap gap-3 justify-center">
            {[
              { icon: Zap, label: 'Beard & Grooming' },
              { icon: Clock, label: 'Express Services' },
              { icon: Users, label: 'Group Bookings' },
              { icon: MapPin, label: 'Walk-in Salons' },
              { icon: Phone, label: 'Online Consultation' },
              { icon: TrendingUp, label: 'Hair Extensions' },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="group flex items-center gap-2.5 bg-white border border-gray-200 hover:border-primary/40 hover:bg-primary/5 rounded-full px-4 py-2.5 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Icon size={12} className="text-primary" />
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-primary transition-colors">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────── */}
      <section id="pricing" className="bg-gradient-to-br from-slate-50 to-blue-50/40 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <SectionLabel color="bg-violet-100 text-violet-700"><Zap size={11} /> Flexible Plans</SectionLabel>
            <SectionHeading
              title="Simple, Transparent Pricing"
              subtitle="No hidden fees. Choose the plan that fits your salon's size and ambition."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pricingPlans.map(({ id, title, subtitle, price, period, items, callToAction, hasRibbon, ribbonTitle }) => (
              <div
                key={id}
                className={`relative bg-white rounded-2xl border shadow-sm flex flex-col ${
                  hasRibbon ? 'border-primary shadow-lg shadow-primary/10 scale-[1.02]' : 'border-gray-200 hover:shadow-md'
                } transition-all duration-300`}
              >
                {hasRibbon && ribbonTitle && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-black uppercase px-4 py-1 rounded-full tracking-widest shadow">
                    {ribbonTitle}
                  </div>
                )}
                <div className="p-7 flex-1">
                  <h3 className="text-xl font-bold text-gray-800 mb-1">{title}</h3>
                  <p className="text-sm text-gray-500 mb-6 leading-snug">{subtitle}</p>
                  <div className="flex items-end gap-1 mb-6">
                    <span className="text-3xl font-black text-gray-900">₹{price.toLocaleString('en-IN')}</span>
                    <span className="text-gray-400 text-sm mb-1">{period}</span>
                  </div>
                  <ul className="space-y-3">
                    {items.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600">
                        <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check size={11} className="text-primary" strokeWidth={3} />
                        </div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="px-7 pb-7">
                  <a
                    href={callToAction.href}
                    target={callToAction.target}
                    rel="noopener noreferrer"
                    className={`block w-full text-center py-3 rounded-xl font-bold text-sm transition-all ${
                      hasRibbon
                        ? 'bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/25'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {callToAction.text}
                  </a>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-gray-400 mt-8">
            All prices are exclusive of GST. Annual billing available at 2 months free.&nbsp;
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline">Contact us for custom enterprise pricing →</a>
          </p>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <SectionLabel color="bg-emerald-100 text-emerald-700"><Star size={11} /> Happy Salon Owners</SectionLabel>
            <SectionHeading
              title="What Salon Owners Say"
              subtitle="Real results from real salons that use StyleSlot every day."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map(({ quote, name, role, initials, color }) => (
              <div key={name} className="bg-white border border-gray-200 rounded-2xl p-7 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col">
                <Quote size={24} className="text-primary/20 mb-4" />
                <p className="text-gray-700 text-sm leading-relaxed flex-1 mb-5">"{quote}"</p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${color} rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                    {initials}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{name}</p>
                    <p className="text-xs text-gray-500">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQs ─────────────────────────────────────────────────────────── */}
      <section id="faqs" className="bg-gradient-to-br from-gray-50 to-slate-50 py-20">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <SectionLabel color="bg-orange-100 text-orange-700"><MessageCircle size={11} /> Common Questions</SectionLabel>
            <SectionHeading title="Frequently Asked Questions" />
          </div>

          <div className="space-y-3">
            {faqs.map((item, i) => (
              <FAQItem
                key={i}
                q={item.q}
                a={item.a}
                open={openFaq === i}
                onToggle={() => setOpenFaq(openFaq === i ? null : i)}
              />
            ))}
          </div>

          <div className="text-center mt-10">
            <p className="text-gray-500 text-sm mb-4">Still have questions? We'd love to help.</p>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary/90 transition-all shadow-sm text-sm"
            >
              <MessageCircle size={16} /> Chat with us on WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ── Contact ──────────────────────────────────────────────────────── */}
      <section id="contact" className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <SectionLabel><MessageCircle size={11} /> Get in Touch</SectionLabel>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
                Ready to Take <br />Your Salon Online?
              </h2>
              <p className="text-gray-500 text-base mb-8 leading-relaxed">
                Reach out via WhatsApp for the fastest response. We'll walk you through the platform,
                answer all your questions and help you get listed today.
              </p>
              <div className="space-y-4">
                {[
                  { icon: MessageCircle, label: 'WhatsApp', value: '+91 93440 95727', href: whatsappLink, target: '_blank' },
                  { icon: Mail, label: 'Email', value: 'buildmyweb2024@gmail.com', href: 'mailto:buildmyweb2024@gmail.com' },
                  { icon: Globe, label: 'Website', value: 'www.buildmyweb.info', href: 'https://www.buildmyweb.info', target: '_blank' },
                ].map(({ icon: Icon, label, value, href, target }) => (
                  <a
                    key={label}
                    href={href}
                    target={target}
                    rel={target ? 'noopener noreferrer' : undefined}
                    className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-primary/40 hover:bg-primary/5 transition-all group"
                  >
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors flex-shrink-0">
                      <Icon size={18} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium mb-0.5">{label}</p>
                      <p className="text-gray-800 font-semibold text-sm group-hover:text-primary transition-colors">{value}</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-primary ml-auto transition-colors" />
                  </a>
                ))}
              </div>
            </div>

            {/* CTA Card */}
            <div className="relative bg-gradient-to-br from-primary via-blue-600 to-purple-600 rounded-3xl p-8 sm:p-10 text-white overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
              <div className="relative">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                  <Store size={22} className="text-white" />
                </div>
                <h3 className="text-2xl font-extrabold mb-3 tracking-tight">Ready to Grow Your Salon?</h3>
                <p className="text-white/75 text-sm mb-6 leading-relaxed">
                  Submit your salon for review and go live with your own booking page, UPI payments,
                  stylist panel and POS billing — all in one platform.
                </p>
                <div className="space-y-3">
                  <a
                    href="/create-salon"
                    className="flex items-center justify-center gap-2 bg-white text-primary font-bold px-6 py-3 rounded-xl hover:bg-yellow-50 transition-all shadow-lg text-sm"
                  >
                    <Store size={15} /> List Your Salon <ArrowRight size={14} />
                  </a>
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-white/15 border border-white/30 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/25 transition-all text-sm"
                  >
                    <MessageCircle size={15} /> Chat on WhatsApp
                  </a>
                </div>
                <div className="flex flex-wrap gap-3 mt-6 text-white/60 text-xs">
                  {['No setup fee', 'Quick approval', 'Your own booking URL', 'Full admin dashboard'].map((t) => (
                    <div key={t} className="flex items-center gap-1">
                      <CheckCircle size={11} /> {t}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-14">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center">
                  <Scissors size={17} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-extrabold text-lg leading-none">StyleSlot</p>
                  <p className="text-slate-400 text-[10px] mt-0.5">by BuildMyWeb</p>
                </div>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                The complete salon booking and management platform for modern salons.
              </p>
              <div className="flex items-center gap-3">
                {[
                  { icon: MessageCircle, href: whatsappLink, label: 'WhatsApp' },
                  { icon: Instagram, href: '#', label: 'Instagram' },
                  { icon: Facebook, href: '#', label: 'Facebook' },
                ].map(({ icon: Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="w-9 h-9 bg-slate-800 hover:bg-primary rounded-lg flex items-center justify-center transition-colors"
                  >
                    <Icon size={16} className="text-slate-300" />
                  </a>
                ))}
              </div>
            </div>

            {/* Link columns */}
            {footerLinks.map(({ title, links }) => (
              <div key={title}>
                <p className="text-white font-bold text-sm mb-4 uppercase tracking-wider">{title}</p>
                <ul className="space-y-2.5">
                  {links.map(({ text, href, external }) => (
                    <li key={text}>
                      {href.startsWith('#') ? (
                        <button
                          onClick={() => document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })}
                          className="text-slate-400 hover:text-white text-sm transition-colors bg-transparent border-0 cursor-pointer p-0"
                        >
                          {text}
                        </button>
                      ) : (
                        <a
                          href={href}
                          target={external ? '_blank' : undefined}
                          rel={external ? 'noopener noreferrer' : undefined}
                          className="text-slate-400 hover:text-white text-sm transition-colors"
                        >
                          {text}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-slate-500 text-xs">
              © {new Date().getFullYear()} StyleSlot · Built by{' '}
              <a href="https://www.buildmyweb.info" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
                BuildMyWeb
              </a>
              . All rights reserved.
            </p>
            <div className="flex items-center gap-5 text-xs text-slate-500">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default PlatformRoot;
