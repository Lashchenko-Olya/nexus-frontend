import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import './Auth.css';

function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: ''
  });

  useEffect(() => {
    if (localStorage.getItem('maintenance') === 'true' || localStorage.getItem('blockReg') === 'true') {
      navigate('/error-404');
    }
  }, [navigate]);

  useEffect(() => {
    fetch('https://nexus-api-server-9g9o.onrender.com/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.blockReg) {
          setError("Реєстрація тимчасово закрита адміністратором.");
        }
      });
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Очищаємо попередні помилки перед новою спробою
    setError(null);

    // 🔥 1. ПЕРЕВІРКА НІКНЕЙМУ (Тільки латиниця, цифри, _ та -)
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(formData.username)) {
      setError("Нікнейм може містити лише англійські літери, цифри, тире або підкреслення.");
      return; // ⛔ Зупиняємо реєстрацію
    }

    // 🔥 2. ЖОРСТКА ПЕРЕВІРКА ПОШТИ 
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(formData.email)) {
      setError("Введіть дійсну пошту (наприклад: user@gmail.com). Використовуйте лише латинські літери.");
      return; // ⛔ Зупиняємо реєстрацію
    }

    // 🔥 3. ПЕРЕВІРКА ПАРОЛЯ (Мінімум 8 символів)
    if (formData.password.length < 8) {
      setError("Пароль надто короткий. Він має містити щонайменше 8 символів.");
      return; // ⛔ Зупиняємо реєстрацію
    }

    try {
      const response = await fetch('https://nexus-api-server-9g9o.onrender.com/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: formData.username,
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setError(null);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/');
      } else {
        setError(data.message || "Помилка реєстрації");
      }
    } catch (error) {
      console.error("Помилка з'єднання:", error);
      setError("Не вдалося з'єднатися з сервером.");
    }
  };

  return (
    <div className="auth-container-fullscreen">
      <div className="light-blob blob-top-left"></div>
      <div className="light-blob blob-bottom-right"></div>

      <header className="auth-header-bar" style={{ justifyContent: 'space-between' }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <div className="auth-logo-text">Ne<span>x</span>us</div>
        </Link>

        <Link to="/login" className="login-btn-top" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'white', fontWeight: '500' }}>
          <div className="login-circle-icon" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#8b5cf6' }}></div>
          <span>Вхід</span>
        </Link>
      </header>

      <div className="auth-card-glass">
        <h2>Реєстрація</h2>
        <p className="auth-subtitle">Вітаємо Вас на нашому сайті!</p>

        <form onSubmit={handleSubmit} className="auth-form-glass">

          {error && (
            <div className="auth-error-box">
              <AlertCircle size={20} className="error-icon" />
              <span>{error}</span>
            </div>
          )}

          <div className="input-wrapper-glass dark">
            <input type="email" name="email" placeholder="Пошта" value={formData.email} onChange={handleChange} required />
          </div>

          <div className="input-wrapper-glass dark">
            <input type="text" name="username" placeholder="Нікнейм" value={formData.username} onChange={handleChange} required />
          </div>

          <div className="input-wrapper-glass dark">
            <input type={showPassword ? "text" : "password"} name="password" placeholder="Пароль" value={formData.password} onChange={handleChange} required />
            <button type="button" className="password-toggle-btn" onClick={() => setShowPassword(!showPassword)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`eye-icon-animated ${showPassword ? 'open' : 'closed'}`}>
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" className="eye-pupil" />
                <path d="M2 12s3-7 10-7 10 7 10 7" className="eye-lid" />
              </svg>
            </button>
          </div>

          <button type="submit" className="auth-submit-btn-glass" style={{ marginTop: '10px' }}>Зареєструватися</button>
        </form>

        <div className="auth-footer-link" style={{ marginTop: '25px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
          <span style={{ color: '#a1a1aa' }}>Вже є акаунт?</span>
          <Link to="/login" style={{ color: '#8b5cf6', textDecoration: 'none', fontWeight: '500' }}>Увійти</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;