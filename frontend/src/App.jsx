import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import LandingPage from './pages/LandingPage';
import BulkAnalysis from './pages/BulkAnalysis';
import History from './pages/History';
import Analytics from './pages/Analytics';
import ModelPerformance from './pages/ModelPerformance';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="analyze" element={<LandingPage />} />
          <Route path="bulk-analysis" element={<BulkAnalysis />} />
          <Route path="history" element={<History />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="model-performance" element={<ModelPerformance />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
