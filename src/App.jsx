import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import GameDetails from './pages/GameDetails'; // Переконайся, що шлях до файлу правильний
import Register from './pages/Register';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import AdminGames from './pages/AdminGames';
import AdminUsers from './pages/AdminUsers';
import AdminReviews from './pages/AdminReviews';
import AdminSettings from './pages/AdminSettings';

// 🔥 ОСЬ ЦЬОГО РЯДКА НЕ ВИСТАЧАЛО:
import Profile from './pages/Profile';

import NotFound from './pages/NotFound';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin-reviews" element={<AdminReviews key="reviews" />} />

        {/* Тепер React знає, що таке Profile */}
        <Route path="/profile" element={<Profile />} />

        <Route path="/admin-dashboard" element={<AdminDashboard key="dashboard" />} />
        <Route path="/admin-games" element={<AdminGames key="games" />} />
        <Route path="/admin-users" element={<AdminUsers key="users" />} />

        <Route path="/game/:id" element={<GameDetails />} />

        <Route path="/admin-settings" element={<AdminSettings key="settings" />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;