import React, { useState } from 'react';
import { BrandLogo } from '../components/BrandLogo';
import {
  MapPin,
  Phone,
  ShieldCheck,
  MessageCircle,
  LogIn,
  ArrowRight,
  Users,
  Clock,
  FileCheck2,
  Store,
  Building2,
  Factory,
  CheckCircle2,
  Star,
  Quote,
  Menu,
  X,
  Lock,
  ChevronRight,
  Sparkles,
  Smartphone,
  CreditCard,
  Handshake,
} from 'lucide-react';

interface LandingPageProps {
  onOpenLogin: () => void;
  currentUser?: any;
  onGoToDashboard?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenLogin,
  currentUser,
  onGoToDashboard,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const phone1 = '+91 91317 47993';
  const phone2 = '+91 72249 47272';
  const address = 'Imlipura Choraha, Khandwa (M.P.) - 450001';
  const whatsappUrl = 'https://wa.me/919131747993?text=Namaste%2C%20Amanat%20Collection%20Service%20ke%20bare%20me%20jankari%20chahiye.';

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-emerald-500 selection:text-white">
      {/* 1. TOP ANNOUNCEMENT BAR */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          {/* Location */}
          <div className="flex items-center space-x-2 text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{address}</span>
          </div>

          {/* Contact Numbers & Trust Tag */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-slate-200 font-medium">
              <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <a href="tel:+919131747993" className="hover:text-emerald-400 transition">
                {phone1}
              </a>
              <span className="text-slate-600">|</span>
              <a href="tel:+917224947272" className="hover:text-emerald-400 transition">
                {phone2}
              </a>
            </div>
            <div className="hidden md:flex items-center space-x-1.5 text-emerald-400 font-semibold bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800/50">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Your Trust Our Commitment</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN NAVIGATION HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <a href="#" className="cursor-pointer">
            <BrandLogo size="md" />
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-7 text-sm font-bold text-slate-700">
            <button onClick={() => scrollTo('home')} className="hover:text-emerald-600 transition text-emerald-600 font-black">
              Home
            </button>
            <button onClick={() => scrollTo('services')} className="hover:text-emerald-600 transition">
              Our Services
            </button>
            <button onClick={() => scrollTo('why-us')} className="hover:text-emerald-600 transition">
              Why Us
            </button>
            <button onClick={() => scrollTo('how-it-works')} className="hover:text-emerald-600 transition">
              How It Works
            </button>
            <button onClick={() => scrollTo('testimonials')} className="hover:text-emerald-600 transition">
              Testimonials
            </button>
            <button onClick={() => scrollTo('contact')} className="hover:text-emerald-600 transition">
              Contact
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="hidden sm:flex items-center space-x-3">
            {/* WhatsApp Contact */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold text-xs rounded-full border border-emerald-200 transition active:scale-95"
            >
              <MessageCircle className="w-4 h-4 fill-emerald-600 text-white" />
              <span>Chat on WhatsApp</span>
            </a>

            {/* Staff / Admin Login Button */}
            {currentUser ? (
              <button
                onClick={onGoToDashboard}
                className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-extrabold text-xs rounded-full shadow-md shadow-purple-200 transition active:scale-95"
              >
                <LogIn className="w-4 h-4" />
                <span>Go to Dashboard ({currentUser.role === 'admin' ? 'Admin' : 'Collector'})</span>
              </button>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center space-x-2 px-5 py-2.5 bg-slate-900 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-full shadow-md shadow-slate-300 transition active:scale-95"
              >
                <LogIn className="w-4 h-4 text-emerald-400" />
                <span>Staff Login</span>
              </button>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2.5 text-slate-700 hover:text-emerald-600 hover:bg-slate-100 rounded-xl transition"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-5 space-y-4 shadow-xl animate-in slide-in-from-top-2">
            <div className="grid grid-cols-2 gap-2 text-sm font-bold text-slate-700">
              <button onClick={() => scrollTo('home')} className="text-left p-2.5 hover:bg-slate-50 rounded-xl text-emerald-600">
                Home
              </button>
              <button onClick={() => scrollTo('services')} className="text-left p-2.5 hover:bg-slate-50 rounded-xl">
                Our Services
              </button>
              <button onClick={() => scrollTo('why-us')} className="text-left p-2.5 hover:bg-slate-50 rounded-xl">
                Why Choose Us
              </button>
              <button onClick={() => scrollTo('how-it-works')} className="text-left p-2.5 hover:bg-slate-50 rounded-xl">
                How It Works
              </button>
              <button onClick={() => scrollTo('testimonials')} className="text-left p-2.5 hover:bg-slate-50 rounded-xl">
                Testimonials
              </button>
              <button onClick={() => scrollTo('contact')} className="text-left p-2.5 hover:bg-slate-50 rounded-xl">
                Contact Info
              </button>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
              {currentUser ? (
                <button
                  onClick={onGoToDashboard}
                  className="w-full flex items-center justify-center space-x-2 py-3 bg-purple-700 text-white font-extrabold text-sm rounded-xl shadow-md"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Go to Dashboard</span>
                </button>
              ) : (
                <button
                  onClick={() => { setMobileMenuOpen(false); onOpenLogin(); }}
                  className="w-full flex items-center justify-center space-x-2 py-3 bg-slate-900 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-md transition"
                >
                  <LogIn className="w-4 h-4 text-emerald-400" />
                  <span>Staff / Collector Login</span>
                </button>
              )}

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center space-x-2 py-3 bg-emerald-600 text-white font-extrabold text-sm rounded-xl shadow-md"
              >
                <MessageCircle className="w-4 h-4 fill-white text-emerald-600" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>
          </div>
        )}
      </header>

      {/* 3. HERO SECTION */}
      <section id="home" className="relative overflow-hidden bg-gradient-to-br from-emerald-50/70 via-slate-50 to-teal-50/50 py-12 sm:py-20 lg:py-24">
        {/* Background decorative curve */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-emerald-100/40 to-transparent pointer-events-none rounded-bl-[120px] hidden lg:block" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Pill badge */}
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-100/80 border border-emerald-200 text-emerald-800 text-xs font-black uppercase tracking-wider shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Amanat Collection Service</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
                Aapka Paisa <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600">
                  Hamari Amanat
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-slate-600 font-medium max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Rozana collection ka bharosa, surakshit aur samay par settlement. Vyapariyon, dukandaro aur har kisi ke daily cash flow ka vishwasniya sathi.
              </p>

              {/* Action CTAs */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
                <button
                  onClick={() => scrollTo('services')}
                  className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-full shadow-lg shadow-emerald-600/30 flex items-center space-x-2 transition active:scale-95"
                >
                  <span>Our Services</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => scrollTo('contact')}
                  className="px-6 py-3.5 bg-white hover:bg-slate-100 text-slate-800 border-2 border-slate-300 font-extrabold text-sm rounded-full shadow-xs transition active:scale-95"
                >
                  <span>Contact Us</span>
                </button>

                <button
                  onClick={currentUser ? onGoToDashboard : onOpenLogin}
                  className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-emerald-400 font-extrabold text-sm rounded-full shadow-md flex items-center space-x-2 transition active:scale-95"
                >
                  <LogIn className="w-4 h-4 text-emerald-400" />
                  <span>{currentUser ? 'Open Dashboard' : 'Staff Login'}</span>
                </button>
              </div>

              {/* Trust micro metrics */}
              <div className="pt-6 grid grid-cols-3 gap-3 max-w-md mx-auto lg:mx-0 border-t border-slate-200/60 text-left">
                <div>
                  <p className="text-xl sm:text-2xl font-black text-slate-900">100%</p>
                  <p className="text-[11px] font-bold text-slate-500">Surakshit Paisa</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-black text-slate-900">Same-Day</p>
                  <p className="text-[11px] font-bold text-slate-500">Fast Settlement</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-black text-slate-900">Digital</p>
                  <p className="text-[11px] font-bold text-slate-500">Passbook Ledger</p>
                </div>
              </div>
            </div>

            {/* Right Graphic Box (Collection Box Visual & Badge) */}
            <div className="lg:col-span-5 flex justify-center relative">
              <div className="relative w-full max-w-md">
                {/* Decorative floating badges */}
                <div className="absolute -top-4 -right-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2 rounded-2xl shadow-xl z-20 flex items-center space-x-2 transform rotate-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-200" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-100">Khandwa's Trusted</p>
                    <p className="text-xs font-black">Daily Collection</p>
                  </div>
                </div>

                {/* 3D Collection Box Card */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-emerald-100/80 relative overflow-hidden">
                  {/* Top Header */}
                  <div className="text-center pb-6 border-b border-slate-100">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-200">
                      <Handshake className="w-9 h-9" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">
                      AMANAT COLLECTION
                    </h3>
                    <p className="text-xs font-bold text-emerald-600 mt-0.5">
                      SERVICE
                    </p>
                  </div>

                  {/* Cash Deposit Slot Graphic */}
                  <div className="my-6 bg-slate-50 rounded-2xl p-5 border border-slate-200 text-center relative">
                    <div className="w-36 h-3 bg-slate-800 rounded-full mx-auto mb-4 shadow-inner border border-slate-700" />
                    <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-extrabold mb-2">
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Cash & UPI Deposit</span>
                    </div>
                    <p className="text-2xl font-black text-slate-900 tracking-tight">
                      ₹500 / ₹200 / ₹100
                    </p>
                    <p className="text-[11px] font-semibold text-slate-500 mt-1">
                      Rozana jama karein, aasaani se hisaab rakhein
                    </p>
                  </div>

                  {/* Cursive Tagline Banner */}
                  <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white text-center p-3.5 rounded-2xl shadow-md">
                    <p className="text-sm sm:text-base font-serif italic font-bold tracking-wide">
                      "Chhoti Chhoti Rakam, Bada Bharosa"
                    </p>
                  </div>

                  {/* Digital passbook preview badge */}
                  <div className="mt-4 p-3 bg-slate-100/70 rounded-xl flex items-center justify-between text-xs text-slate-700 font-bold">
                    <span className="flex items-center space-x-1.5">
                      <Smartphone className="w-4 h-4 text-emerald-600" />
                      <span>Live Passbook on Phone</span>
                    </span>
                    <span className="text-emerald-700 font-black">PIN Protected</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FOUR KEY PILLARS / HIGHLIGHTS */}
      <section className="py-10 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Pillar 1 */}
            <div className="bg-slate-50/80 hover:bg-emerald-50/60 p-5 rounded-2xl border border-slate-200/80 flex items-start space-x-4 transition hover:border-emerald-300">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-200">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                  Daily Collection
                </h4>
                <p className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">
                  Your money collected daily, on time right from your doorstep.
                </p>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="bg-slate-50/80 hover:bg-emerald-50/60 p-5 rounded-2xl border border-slate-200/80 flex items-start space-x-4 transition hover:border-emerald-300">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-200">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                  100% Safe & Secure
                </h4>
                <p className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">
                  Complete security with trust, verified receipts and secure records.
                </p>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="bg-slate-50/80 hover:bg-emerald-50/60 p-5 rounded-2xl border border-slate-200/80 flex items-start space-x-4 transition hover:border-emerald-300">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-200">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                  Timely Settlement
                </h4>
                <p className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">
                  Same day settlement, transparent withdrawal, no unnecessary delay.
                </p>
              </div>
            </div>

            {/* Pillar 4 */}
            <div className="bg-slate-50/80 hover:bg-emerald-50/60 p-5 rounded-2xl border border-slate-200/80 flex items-start space-x-4 transition hover:border-emerald-300">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-200">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                  Transparent & Reliable
                </h4>
                <p className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">
                  Clear WhatsApp receipts, digital statements and 100% transparency.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. OUR SERVICES SECTION */}
      <section id="services" className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Description */}
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center space-x-1.5 text-emerald-700 text-xs font-black uppercase tracking-wider">
                <span className="w-6 h-0.5 bg-emerald-600 inline-block" />
                <span>Our Services</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                Collection Services <br />
                for Your Business
              </h2>

              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                <strong>Amanat Collection Service</strong> is a trusted name in daily collection services. We help shopkeepers, businesses, industries and individuals in managing their daily cash flow with complete security, transparency and professionalism.
              </p>

              <div className="pt-2">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-full shadow-md shadow-emerald-600/30 transition active:scale-95"
                >
                  <span>Get Started Now</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Right 4 Grid Cards */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Service 1 */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-emerald-300 transition text-center sm:text-left">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4 mx-auto sm:mx-0">
                  <Store className="w-6 h-6" />
                </div>
                <h4 className="text-base font-black text-slate-900">For Shopkeepers</h4>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Rozana collection ka aasaan tarika. Dukan par daily cash collection aur turant digital receipt.
                </p>
              </div>

              {/* Service 2 */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-emerald-300 transition text-center sm:text-left">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4 mx-auto sm:mx-0">
                  <Building2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-black text-slate-900">For Businesses</h4>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Aapke business ka strong cash support. B2B payments, ledger maintenance aur time par settlement.
                </p>
              </div>

              {/* Service 3 */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-emerald-300 transition text-center sm:text-left">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4 mx-auto sm:mx-0">
                  <Factory className="w-6 h-6" />
                </div>
                <h4 className="text-base font-black text-slate-900">For Industries</h4>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Large & small both we serve. Industrial supply collections, multi-location recovery aur secure reconciliation.
                </p>
              </div>

              {/* Service 4 */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-emerald-300 transition text-center sm:text-left">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4 mx-auto sm:mx-0">
                  <Users className="w-6 h-6" />
                </div>
                <h4 className="text-base font-black text-slate-900">For Everyone</h4>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Har kisike liye bharosemand seva. Daily chhota amount bachayein aur zarurat par asani se wapas lein.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. WHY CHOOSE US (DARK NAVY SECTION) */}
      <section id="why-us" className="py-16 sm:py-20 bg-[#091e3a] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Header */}
            <div className="lg:col-span-5 space-y-3">
              <span className="text-emerald-400 text-xs font-black uppercase tracking-wider">
                WHY CHOOSE US
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                Hamara Wada <br />
                <span className="text-emerald-400">Aapke Saath</span>
              </h2>
              <p className="text-sm text-slate-300 font-medium max-w-md leading-relaxed">
                Hum sirf paisa nahi lete, aapka bharosa bhi saath lete hain. Hard-earned money ki 100% suraksha hamari prathmikta hai.
              </p>
            </div>

            {/* Right 4 Badges */}
            <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              {/* Badge 1 */}
              <div className="bg-white/5 border border-white/10 hover:border-emerald-400/50 p-4 rounded-2xl text-center backdrop-blur-xs transition">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h4 className="text-xs font-bold uppercase tracking-wider">Safe Collection</h4>
              </div>

              {/* Badge 2 */}
              <div className="bg-white/5 border border-white/10 hover:border-emerald-400/50 p-4 rounded-2xl text-center backdrop-blur-xs transition">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                  <Handshake className="w-6 h-6" />
                </div>
                <h4 className="text-xs font-bold uppercase tracking-wider">Professional Team</h4>
              </div>

              {/* Badge 3 */}
              <div className="bg-white/5 border border-white/10 hover:border-emerald-400/50 p-4 rounded-2xl text-center backdrop-blur-xs transition">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                  <Clock className="w-6 h-6" />
                </div>
                <h4 className="text-xs font-bold uppercase tracking-wider">On-Time Settlement</h4>
              </div>

              {/* Badge 4 */}
              <div className="bg-white/5 border border-white/10 hover:border-emerald-400/50 p-4 rounded-2xl text-center backdrop-blur-xs transition">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                  <FileCheck2 className="w-6 h-6" />
                </div>
                <h4 className="text-xs font-bold uppercase tracking-wider">Full Transparency</h4>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. HOW IT WORKS (SIMPLE 4 STEP PROCESS) */}
      <section id="how-it-works" className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-12">
            <div className="lg:col-span-8 space-y-2">
              <span className="text-emerald-700 text-xs font-black uppercase tracking-wider">
                HOW IT WORKS
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Simple 4 Step Process
              </h2>
              <p className="text-sm text-slate-600 font-medium">
                Hamara process simple hai, aur aapke liye bilkul easy.
              </p>
            </div>

            <div className="lg:col-span-4 text-left lg:text-right">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-full shadow-sm"
              >
                <span>Know More</span>
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* 4 Steps Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
            {/* Step 1 */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 relative group hover:border-emerald-300 transition">
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-black text-emerald-600 font-mono">01</span>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <h4 className="text-sm font-black text-slate-900 mb-1">Collection Request</h4>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Aap humein collection ki request dete hain ya registration karate hain.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 relative group hover:border-emerald-300 transition">
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-black text-emerald-600 font-mono">02</span>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
              </div>
              <h4 className="text-sm font-black text-slate-900 mb-1">Money Collection</h4>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Hamari team aapke counter se daily payment cash ya online UPI se collect karti hai.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 relative group hover:border-emerald-300 transition">
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-black text-emerald-600 font-mono">03</span>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>
              <h4 className="text-sm font-black text-slate-900 mb-1">Safe Handling</h4>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Paisa surakshit tarike se handle kiya jata hai aur turant live passbook me update hota hai.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 relative group hover:border-emerald-300 transition">
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-black text-emerald-600 font-mono">04</span>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <FileCheck2 className="w-5 h-5" />
                </div>
              </div>
              <h4 className="text-sm font-black text-slate-900 mb-1">Settlement</h4>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Same day aapke account ya cash me samay par settlement kiya jata hai.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. CLIENT TESTIMONIALS */}
      <section id="testimonials" className="py-16 sm:py-20 bg-slate-50 border-t border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="text-emerald-700 text-xs font-black uppercase tracking-wider">
              CLIENTS TESTIMONIALS
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Our Happy Clients
            </h2>
            <p className="text-sm text-slate-600 font-medium">
              Aapka bharosa hi hamari sabse badi taaqat hai.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Review 1 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <Quote className="w-8 h-8 text-emerald-500/30 mb-3" />
                <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                  "Amanat Collection Service ne hamare business ko kaafi asaani di hai. Rozana payment samay par milta hai aur digital passbook par sabhi hisaab clear rehta hai."
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100">
                <div className="flex items-center space-x-1 text-amber-400 mb-1.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm font-black text-slate-900">Rafiq Bhai</p>
                <p className="text-[11px] font-semibold text-slate-500">Shopkeeper, Khandwa</p>
              </div>
            </div>

            {/* Review 2 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <Quote className="w-8 h-8 text-emerald-500/30 mb-3" />
                <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                  "Professional team, safe process and very transparent. Cash withdrawal bhi aasaani se mil jata hai. Highly recommended for daily businesses!"
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100">
                <div className="flex items-center space-x-1 text-amber-400 mb-1.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm font-black text-slate-900">Sameer Khan</p>
                <p className="text-[11px] font-semibold text-slate-500">Business Owner</p>
              </div>
            </div>

            {/* Review 3 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <Quote className="w-8 h-8 text-emerald-500/30 mb-3" />
                <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                  "Trustworthy service. Pehle roz cash bank le jaane ki tension hoti thi, ab Amanat Collection ki wajah se daily collection smooth ho gaya hai."
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100">
                <div className="flex items-center space-x-1 text-amber-400 mb-1.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm font-black text-slate-900">Imran Sheikh</p>
                <p className="text-[11px] font-semibold text-slate-500">Regular Client</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. PRE-FOOTER CTA BANNER */}
      <section id="contact" className="bg-[#0b2545] text-white py-10 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-900/50">
              <Handshake className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                Amanat Collection Service
              </h3>
              <p className="text-xs text-emerald-300 font-medium mt-0.5">
                Rozana Collection • Surakshit Handling • Samay Par Settlement
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-full shadow-lg shadow-emerald-500/20 transition active:scale-95"
            >
              <MessageCircle className="w-4 h-4 fill-slate-950 text-emerald-500" />
              <span>Contact Us Now</span>
            </a>
            <div className="text-xs font-mono font-bold text-slate-300">
              {phone1} | {phone2}
            </div>
          </div>
        </div>
      </section>

      {/* 10. FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-10 text-xs border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center pb-8 border-b border-slate-800 text-center md:text-left">
            <div>
              <BrandLogo variant="light" size="sm" />
              <p className="text-[11px] text-slate-400 mt-2 font-medium">
                Aapka paisa, hamari amanat. Daily trusted collection service in Khandwa.
              </p>
            </div>

            <div className="space-y-1 text-slate-300">
              <p className="font-bold flex items-center justify-center md:justify-start space-x-1.5">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{address}</span>
              </p>
              <p className="font-bold flex items-center justify-center md:justify-start space-x-1.5">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{phone1} / {phone2}</span>
              </p>
            </div>

            <div className="flex flex-col items-center md:items-end space-y-2">
              <p className="text-xs font-bold text-slate-300">Follow Us & Contact</p>
              <div className="flex items-center space-x-3">
                <a href={whatsappUrl} className="w-8 h-8 rounded-full bg-slate-800 hover:bg-emerald-600 text-white flex items-center justify-center transition">
                  <MessageCircle className="w-4 h-4" />
                </a>
                <a href={`tel:${phone1.replace(/\s+/g, '')}`} className="w-8 h-8 rounded-full bg-slate-800 hover:bg-emerald-600 text-white flex items-center justify-center transition">
                  <Phone className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
            <p>© {new Date().getFullYear()} Amanat Collection Service. All Rights Reserved.</p>
            <p className="text-emerald-400 font-semibold">Your Trust Our Commitment</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
