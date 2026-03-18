import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css'; // Переконайся, що імпорт стилів правильний
import { Search, AlertCircle } from 'lucide-react'; // Додали AlertCircle

function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null); // 🔥 Стейт для збереження тексту помилки

  // 🔥 Тепер у нас nickname замість email
  const [formData, setFormData] = useState({
    nickname: '',
    password: '',
    rememberMe: false
  });

  useEffect(() => {
    // Якщо увімкнені техроботи АБО вручну заблокований вхід
    if (localStorage.getItem('maintenance') === 'true' || localStorage.getItem('blockLogin') === 'true') {
      navigate('/error-404');
    }

    const savedLogin = localStorage.getItem('nexusSavedLogin');
    if (savedLogin) {
      const parsedData = JSON.parse(savedLogin);
      setFormData({
        nickname: parsedData.nickname,
        password: parsedData.password,
        rememberMe: true // Одразу ставимо галочку, бо дані підтягнулись
      });
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // 🔥 ВІДПРАВКА ДАНИХ ДЛЯ ВХОДУ НА СЕРВЕР
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('https://nexus-api-server-9g9o.onrender.com/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nickname: formData.nickname,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setError(null); // Очищаємо помилку при успішному вході

        if (formData.rememberMe) {
          // Якщо стоїть галочка — зберігаємо нік і пароль у браузер
          localStorage.setItem('nexusSavedLogin', JSON.stringify({
            nickname: formData.nickname,
            password: formData.password
          }));
        } else {
          // Якщо галочку зняли — видаляємо старі записи (щоб більше не підставлялись)
          localStorage.removeItem('nexusSavedLogin');
        }

        // Успішний логін! Зберігаємо перепустку.
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        if (data.user.role === 'admin') {
          navigate('/admin-dashboard'); // Телепортуємо тебе в адмінку
        } else {
          navigate('/'); // Звичайних смертних відправляємо на головну
        }
      } else {
        // 🔥 ВИВОДИМО КРАСИВУ ПОМИЛКУ ЗАМІСТЬ ALERT
        setError(data.message || "Помилка входу");
      }

    } catch (error) {
      console.error("Помилка з'єднання з сервером:", error);
      // 🔥 ВИВОДИМО КРАСИВУ ПОМИЛКУ ЗАМІСТЬ ALERT
      setError("Не вдалося з'єднатися з сервером.");
    }
  };

  return (
    <div className="auth-container-fullscreen">

      {/* --- Світлові плями --- */}
      <div className="light-blob blob-top-left"></div>
      <div className="light-blob blob-bottom-right"></div>

      {/* --- СПРОЩЕНИЙ ХЕДЕР --- */}
      <header className="auth-header-bar" style={{ justifyContent: 'space-between' }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <div className="auth-logo-text">Ne<span>x</span>us</div>
        </Link>

        {/* Пошук видалено! */}

        <Link to="/register" className="login-btn-top" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'white', fontWeight: '500' }}>
          <div className="login-circle-icon" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#8b5cf6' }}></div>
          <span>Реєстрація</span>
        </Link>
      </header>

      <div className="auth-card-glass">
        <h2>Вхід</h2>
        <p className="auth-subtitle">З поверненням до Nexus!</p>

        <form onSubmit={handleSubmit} className="auth-form-glass">

          {/* 🔥 КРАСИВИЙ БЛОК ПОМИЛКИ 🔥 */}
          {error && (
            <div className="auth-error-box">
              <AlertCircle size={20} className="error-icon" />
              <span>{error}</span>
            </div>
          )}

          {/* 🔥 ПОЛЕ ДЛЯ НІКНЕЙМУ (замість пошти) */}
          <div className="input-wrapper-glass dark">
            <input
              type="text"
              name="nickname"
              placeholder="Нікнейм"
              value={formData.nickname}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-wrapper-glass dark">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Пароль"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`eye-icon-animated ${showPassword ? 'open' : 'closed'}`}
              >
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" className="eye-pupil" />
                <path d="M2 12s3-7 10-7 10 7 10 7" className="eye-lid" />
              </svg>
            </button>
          </div>

          {/* 🔥 НАШ КРАСИВИЙ ЧЕКБОКС "ЗАПАМ'ЯТАТИ МЕНЕ" */}
          <div className="remember-me-container" style={{ marginBottom: '25px' }}>
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="hidden-checkbox"
              />
              <span className="custom-checkbox"></span>
              <span className="checkbox-text">Запам'ятати мене</span>
            </label>
          </div>

          <button type="submit" className="auth-submit-btn-glass">
            Увійти
          </button>
        </form>

        {/* 🔥 ВІДРЕГУЛЬОВАНИЙ БЛОК "ЩЕ НЕ ЗАРЕЄСТРОВАНІ" */}
        <div className="auth-footer-link" style={{ marginTop: '25px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
          <span style={{ color: '#a1a1aa' }}>Ще не зареєстровані?</span>
          <Link to="/register" style={{ color: '#8b5cf6', textDecoration: 'none', fontWeight: '500' }}>Реєстрація</Link>
        </div>
      </div>

    </div>
  );
}

export default Login;