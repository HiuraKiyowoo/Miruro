import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

const Welcome     = lazy(() => import('./pages/Welcome'));
const Home        = lazy(() => import('./pages/Home'));
const Explore     = lazy(() => import('./pages/Explore'));
const Browse      = lazy(() => import('./pages/Browse'));
const MangaDetail = lazy(() => import('./pages/MangaDetail'));
const Reader      = lazy(() => import('./pages/Reader'));
const History     = lazy(() => import('./pages/History'));
const Taxonomy    = lazy(() => import('./pages/Taxonomy'));

function App() {
  return (
    <Router>
      <Suspense fallback={<div className="min-h-screen bg-[#0a0a0c]" />}>
        <Routes>
          <Route path="/"                        element={<Welcome />} />
          <Route path="/home"                    element={<Home />} />
          <Route path="/explore"                 element={<Explore />} />
          <Route path="/browse"                  element={<Browse />} />
          <Route path="/manga/:slug"             element={<MangaDetail />} />
          <Route path="/read/:id"                element={<Reader />} />
          <Route path="/history"                 element={<History />} />
          <Route path="/taxonomy/:type"          element={<Taxonomy />} />
          <Route path="/taxonomy/:type/:slug"    element={<Taxonomy />} />
          <Route path="*"                        element={<Navigate to="/home" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
