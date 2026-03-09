/**
 * App.jsx — Root application component.
 * Renders the persistent Header and the current page.
 */

import React from 'react';
import Header from './components/Header.jsx';
import Home from './pages/Home.jsx';

export default function App() {
  return (
    <div className="app-wrapper">
      <Header />
      <Home />
    </div>
  );
}
