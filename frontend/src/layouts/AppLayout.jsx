import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-[#FFF8F5] text-[#0A0A0A] relative selection:bg-[#EC4899]/20 selection:text-[#7C3AED]">
      {/* Floating Navbar */}
      <Navbar />

      {/* Main Content Viewport */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-24 min-h-[calc(100vh-80px)]">
        <Outlet />
      </main>
    </div>
  );
}
