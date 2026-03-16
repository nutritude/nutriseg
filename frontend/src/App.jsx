import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Checklist from './pages/Checklist';
import UnitsPage from './pages/UnitsPage';
import TeamPage from './pages/TeamPage';
import { UnitProvider } from './contexts/UnitContext';
import './App.css';

import VisitRoutePage from './pages/VisitRoutePage';
import ReportsPage from './pages/ReportsPage';
import OccurrencesPage from './pages/OccurrencesPage';
import EventsPage from './pages/EventsPage';

function App() {
  return (
    <UnitProvider>
      <Router>
        <Routes>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Home />} />
            <Route path="unidades" element={<UnitsPage />} />
            <Route path="visitas" element={<VisitRoutePage />} />
            <Route path="ocorrencias" element={<OccurrencesPage />} />
            <Route path="agenda" element={<EventsPage />} />
            <Route path="equipe" element={<TeamPage />} />
            <Route path="relatorios" element={<ReportsPage />} />

            {/* Módulos Operacionais (Acessíveis via Dashboard ou Links) */}
            <Route path="cardapio" element={<Menu />} />
            <Route path="checklist" element={<Checklist />} />
          </Route>
        </Routes>
      </Router>
    </UnitProvider>
  );
}

export default App;
