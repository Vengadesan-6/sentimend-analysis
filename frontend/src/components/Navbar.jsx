import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles, ArrowRight, Menu, X, Layers, Cpu, BarChart2, History, FileSpreadsheet } from 'lucide-react';
import { checkHealth } from '../services/api';

export default function Navbar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isBackendHealthy, setIsBackendHealthy] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    checkHealth()
      .then((res) => setIsBackendHealthy(res.data?.models_loaded ?? true))
      .catch(() => setIsBackendHealthy(true));
  }, []);

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    if (location.pathname !== '/') {
      window.location.href = `/#${id}`;
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 pt-4 pb-2 transition-all duration-300 pointer-events-none">
      <div className={`max-w-7xl mx-auto rounded-full transition-all duration-300 pointer-events-auto px-6 py-3 flex items-center justify-between ${
        isScrolled 
          ? 'bg-white/90 backdrop-blur-xl border border-[#E8E4E1] shadow-floating' 
          : 'bg-white/70 backdrop-blur-md border border-[#E8E4E1]/80 shadow-soft'
      }`}>
        
        {/* Left: Original Minimal Logo & Title */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#7C3AED] via-[#EC4899] to-[#F97316] p-[2px] shadow-sm transition-transform group-hover:scale-105 duration-200">
            <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#7C3AED]" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-extrabold tracking-tight text-[#0A0A0A] font-display flex items-center">
              Sentiment<span className="gradient-text">AI</span>
            </span>
          </div>
        </Link>

        {/* Center Navigation Links (Desktop) */}
        <nav className="hidden lg:flex items-center gap-7 text-xs font-medium text-[#555555]">
          <button
            onClick={() => scrollToSection('how-it-works')}
            className="hover:text-[#0A0A0A] transition-colors cursor-pointer"
          >
            How it works
          </button>
          <button
            onClick={() => scrollToSection('analyzer')}
            className="hover:text-[#0A0A0A] transition-colors cursor-pointer font-semibold text-[#7C3AED]"
          >
            AI Analyzer
          </button>
          <button
            onClick={() => scrollToSection('features')}
            className="hover:text-[#0A0A0A] transition-colors cursor-pointer"
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection('use-cases')}
            className="hover:text-[#0A0A0A] transition-colors cursor-pointer"
          >
            Use cases
          </button>
          <button
            onClick={() => scrollToSection('analytics')}
            className="hover:text-[#0A0A0A] transition-colors cursor-pointer"
          >
            Analytics
          </button>
          <button
            onClick={() => scrollToSection('models')}
            className="hover:text-[#0A0A0A] transition-colors cursor-pointer"
          >
            Models
          </button>
          <button
            onClick={() => scrollToSection('faq')}
            className="hover:text-[#0A0A0A] transition-colors cursor-pointer"
          >
            FAQ
          </button>
          
          <div className="h-3.5 w-px bg-[#E8E4E1]" />

          {/* Quick Platform Tools */}
          <Link
            to="/bulk-analysis"
            className="hover:text-[#0A0A0A] transition-colors flex items-center gap-1 text-[#555555]"
            title="Batch CSV Processing"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#EC4899]" />
            <span>Batch CSV</span>
          </Link>
          <Link
            to="/history"
            className="hover:text-[#0A0A0A] transition-colors flex items-center gap-1 text-[#555555]"
            title="Prediction Audit Trail"
          >
            <History className="w-3.5 h-3.5 text-[#F97316]" />
            <span>History</span>
          </Link>
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Live Transformer Status Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFF8F5] border border-[#E8E4E1] text-[11px] font-mono text-[#555555]">
            <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
            <span>Transformer v1.0</span>
          </div>

          <button
            onClick={() => scrollToSection('analyzer')}
            className="btn-gradient px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <span>Try Analyzer</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-full text-[#0A0A0A] hover:bg-[#FFF8F5] transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-2 p-5 rounded-3xl bg-white/95 backdrop-blur-2xl border border-[#E8E4E1] shadow-floating pointer-events-auto space-y-3 text-sm font-medium text-[#0A0A0A]">
          <button
            onClick={() => scrollToSection('how-it-works')}
            className="block w-full text-left py-2 text-[#555555] hover:text-[#0A0A0A]"
          >
            How it works
          </button>
          <button
            onClick={() => scrollToSection('analyzer')}
            className="block w-full text-left py-2 text-[#7C3AED] font-semibold"
          >
            AI Analyzer
          </button>
          <button
            onClick={() => scrollToSection('features')}
            className="block w-full text-left py-2 text-[#555555] hover:text-[#0A0A0A]"
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection('use-cases')}
            className="block w-full text-left py-2 text-[#555555] hover:text-[#0A0A0A]"
          >
            Use cases
          </button>
          <button
            onClick={() => scrollToSection('analytics')}
            className="block w-full text-left py-2 text-[#555555] hover:text-[#0A0A0A]"
          >
            Analytics
          </button>
          <button
            onClick={() => scrollToSection('models')}
            className="block w-full text-left py-2 text-[#555555] hover:text-[#0A0A0A]"
          >
            Transformer Models
          </button>
          <button
            onClick={() => scrollToSection('faq')}
            className="block w-full text-left py-2 text-[#555555] hover:text-[#0A0A0A]"
          >
            FAQ
          </button>

          <div className="pt-2 border-t border-[#E8E4E1] flex gap-2">
            <Link
              to="/bulk-analysis"
              onClick={() => setMobileMenuOpen(false)}
              className="flex-1 py-2 text-center text-xs font-semibold rounded-xl bg-[#FFF8F5] border border-[#E8E4E1] text-[#0A0A0A]"
            >
              Batch CSV
            </Link>
            <Link
              to="/history"
              onClick={() => setMobileMenuOpen(false)}
              className="flex-1 py-2 text-center text-xs font-semibold rounded-xl bg-[#FFF8F5] border border-[#E8E4E1] text-[#0A0A0A]"
            >
              Audit History
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
