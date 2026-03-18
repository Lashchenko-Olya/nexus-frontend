import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Gamepad2, Users,
    MessageSquare, Settings, LogOut, ShieldAlert, Wrench
} from 'lucide-react';
import './AdminSettings.css';

function AdminSettings() {
    const navigate = useNavigate();

    // Стейти для перемикачів
    const [maintenance, setMaintenance] = useState(false);
    const [blockReg, setBlockReg] = useState(false);
    const [disableModeration, setDisableModeration] = useState(false);
    const [blockReviews, setBlockReviews] = useState(false);

    // 🔥 ДОДАНО: Завантажуємо дані з СЕРВЕРА при відкритті сторінки
    useEffect(() => {
        fetch('https://nexus-api-server-9g9o.onrender.com/api/settings')
            .then(res => res.json())
            .then(data => {
                if (data) {
                    setMaintenance(data.maintenance || false);
                    setBlockReg(data.blockReg || false);
                    setDisableModeration(data.autoApprove || false); // В базі це autoApprove
                    setBlockReviews(data.blockComments || false); // В базі це blockComments
                }
            })
            .catch(err => console.error("Помилка завантаження налаштувань:", err));
    }, []);

    // 🔥 ДОДАНО: Функція, яка зберігає зміни В БАЗУ ДАНИХ
    const saveToBackend = async (updates) => {
        try {
            await fetch('https://nexus-api-server-9g9o.onrender.com/api/settings/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
        } catch (err) {
            console.error("Помилка збереження налаштувань:", err);
        }
    };

    // Логіка увімкнення Тех. Обслуговування
    const toggleMaintenance = () => {
        const newValue = !maintenance;
        setMaintenance(newValue);

        let updates = { maintenance: newValue };
        if (newValue) {
            setBlockReg(true);
            updates.blockReg = true;
        }
        saveToBackend(updates);
    };

    // Логіка блокування реєстрації
    const toggleRegistration = () => {
        if (maintenance) return;
        const newValue = !blockReg;
        setBlockReg(newValue);
        saveToBackend({ blockReg: newValue });
    };

    // Логіка вимкнення модерації
    const toggleModeration = () => {
        if (blockReviews) return;
        const newValue = !disableModeration;
        setDisableModeration(newValue);
        saveToBackend({ autoApprove: newValue });
    };

    // Логіка анти-спам режиму
    const toggleBlockReviews = () => {
        const newValue = !blockReviews;
        setBlockReviews(newValue);

        let updates = { blockComments: newValue };
        if (newValue) {
            setDisableModeration(false);
            updates.autoApprove = false;
        }
        saveToBackend(updates);
    };

    return (
        <div className="admin-dashboard-container">
            <aside className="admin-sidebar">
                <div className="admin-logo-section">
                    <div className="auth-logo-text">Ne<span>x</span>us</div>
                    <span className="admin-badge">Admin</span>
                </div>

                <nav className="admin-nav">
                    <div className="nav-item" onClick={() => navigate('/admin-dashboard')}>
                        <LayoutDashboard size={20} />
                        <span>Дашборд</span>
                    </div>
                    <div className="nav-item" onClick={() => navigate('/admin-games')}>
                        <Gamepad2 size={20} />
                        <span>Ігри</span>
                    </div>
                    <div className="nav-item" onClick={() => navigate('/admin-users')}>
                        <Users size={20} />
                        <span>Користувачі</span>
                    </div>
                    <div className="nav-item" onClick={() => navigate('/admin-reviews')}>
                        <MessageSquare size={20} />
                        <span>Рецензії</span>
                    </div>
                    <div className="nav-item active">
                        <Settings size={20} />
                        <span>Налаштування</span>
                    </div>
                </nav>

                <div className="admin-logout-section" onClick={() => navigate('/login')}>
                    <LogOut size={20} />
                    <span>Вихід</span>
                </div>
            </aside>

            <main className="admin-main-content">
                <h2 className="admin-page-title">Налаштування системи</h2>

                <div className="settings-layout">
                    {/* БЛОК 1: БЕЗПЕКА ТА ДОСТУП */}
                    <section className="settings-section">
                        <h3 className="settings-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Wrench size={18} /> Доступ та Обслуговування
                        </h3>

                        <div className="settings-card">
                            <label className="settings-switch-row">
                                <div>
                                    <span style={{ display: 'block', color: maintenance ? '#ef4444' : '#e4e4e7', transition: '0.3s' }}>
                                        Режим технічного обслуговування
                                    </span>
                                    <span style={{ fontSize: '12px', color: '#71717a' }}>Закриває доступ для всіх, крім адміністраторів</span>
                                </div>
                                <div className={`toggle-switch ${maintenance ? 'active' : ''}`} onClick={toggleMaintenance}>
                                    <div className="toggle-circle"></div>
                                </div>
                            </label>

                            <label className="settings-switch-row" style={{ opacity: maintenance ? 0.5 : 1 }}>
                                <div>
                                    <span style={{ display: 'block', color: '#e4e4e7' }}>Заблокувати реєстрацію нових користувачів</span>
                                    <span style={{ fontSize: '12px', color: '#71717a' }}>
                                        {maintenance ? 'Заблоковано автоматично через техроботи' : 'Тимчасово зупинити створення акаунтів'}
                                    </span>
                                </div>
                                <div className={`toggle-switch ${blockReg ? 'active' : ''}`} onClick={toggleRegistration} style={{ cursor: maintenance ? 'not-allowed' : 'pointer' }}>
                                    <div className="toggle-circle"></div>
                                </div>
                            </label>
                        </div>
                    </section>

                    {/* БЛОК 2: МОДЕРАЦІЯ */}
                    <section className="settings-section">
                        <h3 className="settings-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <ShieldAlert size={18} /> Керування рецензіями
                        </h3>

                        <div className="settings-card">
                            <label className="settings-switch-row">
                                <div>
                                    <span style={{ display: 'block', color: '#e4e4e7' }}>Вимкнути ручну модерацію</span>
                                    <span style={{ fontSize: '12px', color: '#71717a' }}>Всі нові рецензії публікуватимуться автоматично</span>
                                </div>
                                <div className={`toggle-switch ${disableModeration ? 'active' : ''}`} onClick={toggleModeration} style={{ opacity: blockReviews ? 0.5 : 1, cursor: blockReviews ? 'not-allowed' : 'pointer' }}>
                                    <div className="toggle-circle"></div>
                                </div>
                            </label>

                            <label className="settings-switch-row">
                                <div>
                                    <span style={{ display: 'block', color: blockReviews ? '#ef4444' : '#e4e4e7', transition: '0.3s' }}>
                                        Режим "Анти-спам" (Заблокувати коментарі)
                                    </span>
                                    <span style={{ fontSize: '12px', color: '#71717a' }}>Ніхто не зможе залишати нові рецензії</span>
                                </div>
                                <div className={`toggle-switch ${blockReviews ? 'active' : ''}`} onClick={toggleBlockReviews}>
                                    <div className="toggle-circle"></div>
                                </div>
                            </label>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}

export default AdminSettings;