import React from 'react';
import { useNavigate } from 'react-router-dom';
import './NotFound.css';

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="notfound-container">
      <div className="bg-grid"></div>
      <div className="glow-red"></div>
      <div className="glow-purple"></div>

      <div className="notfound-content">
        {/* 🔥 ТЕПЕР ЦЕ ПРОСТО ТЕКСТ 🔥 */}
        <h1 className="glitch-title">
          404
        </h1>

        <h2 className="glitch-subtitle">СТОРІНКА НЕ ЗНАЙДЕНА</h2>
        <p className="notfound-text">
          Схоже, ви зайшли у викривлений простір. Або ми проводимо технічне обслуговування серверів.
        </p>

        <button className="home-btn" onClick={() => navigate('/')}>
          Повернутися на головну
        </button>
      </div>
    </div>
  );
}

export default NotFound;