import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function DashboardLayout() {
  return (
    <div className="flex flex-col h-screen bg-[#0b0f19] text-slate-100 antialiased selection:bg-blue-600 selection:text-white overflow-hidden">
      <Navbar />
      <main className="flex-1 overflow-hidden p-3 md:p-4">
        <Outlet />
      </main>
    </div>
  );
}
