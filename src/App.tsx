import React, { useState, useEffect } from 'react';
import { ClimateProvider } from './context/ClimateContext';
import { AIProvider } from './context/AIContext';
import { Navbar } from './components/common/Navbar';
import { LiveTicker } from './components/common/LiveTicker';
import { Footer } from './components/common/Footer';
import { LocationModal } from './components/common/LocationModal';
import { ExportModal } from './components/common/ExportModal';

// Pages
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { LiveRiskPage } from './pages/LiveRiskPage';
import { ForecastPage } from './pages/ForecastPage';
import { ClimateMapPage } from './pages/ClimateMapPage';
import { HealthInsightsPage } from './pages/HealthInsightsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AlertsPage } from './pages/AlertsPage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { SettingsPage } from './pages/SettingsPage';
import { WhatIfSimulatorPage } from './pages/WhatIfSimulatorPage';
import { DataSourcesPage } from './pages/DataSourcesPage';

export function AppContent() {
  const [activeTab, setActiveTab] = useState<string>('landing');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  return (
    <div className="min-h-screen flex flex-col bg-[#040813] text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 1. Global Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenLocationModal={() => setIsLocationModalOpen(true)}
      />

      {/* 2. Real-Time Telemetry Ticker */}
      <LiveTicker />

      {/* 3. Main Page Body */}
      <main className="flex-1">
        {activeTab === 'landing' && (
          <LandingPage
            setActiveTab={setActiveTab}
            onOpenLocationModal={() => setIsLocationModalOpen(true)}
          />
        )}
        {activeTab === 'dashboard' && (
          <DashboardPage
            setActiveTab={setActiveTab}
            onOpenLocationModal={() => setIsLocationModalOpen(true)}
            onOpenExportModal={() => setIsExportModalOpen(true)}
          />
        )}
        {activeTab === 'live-risk' && (
          <LiveRiskPage setActiveTab={setActiveTab} />
        )}
        {activeTab === 'forecast' && (
          <ForecastPage />
        )}
        {activeTab === 'climate-map' && (
          <ClimateMapPage />
        )}
        {activeTab === 'health-insights' && (
          <HealthInsightsPage />
        )}
        {activeTab === 'analytics' && (
          <AnalyticsPage onOpenExportModal={() => setIsExportModalOpen(true)} />
        )}
        {activeTab === 'alerts' && (
          <AlertsPage />
        )}
        {activeTab === 'ai-assistant' && (
          <AIAssistantPage setActiveTab={setActiveTab} />
        )}
        {activeTab === 'what-if' && (
          <WhatIfSimulatorPage />
        )}
        {activeTab === 'settings' && (
          <SettingsPage />
        )}
        {activeTab === 'data-sources' && (
          <DataSourcesPage />
        )}
      </main>

      {/* 4. Global Footer */}
      <Footer setActiveTab={setActiveTab} />

      {/* 5. Modals */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
      />
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ClimateProvider>
      <AIProvider>
        <AppContent />
      </AIProvider>
    </ClimateProvider>
  );
}
