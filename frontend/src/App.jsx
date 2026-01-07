import { useState, useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import Profile from './components/Profile';
import Activities from './components/Activities';
import Goals from './components/Goals';
import Dashboard from './components/Dashboard';
import Users from './components/Users';
import api from './services/api';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('login');
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    if (api.token) {
      checkAuth();
    }
  }, []);

  const checkAuth = async () => {
    try {
      const profile = await api.getProfile();
      setUser(profile);
      setCurrentView('activities');
    } catch (err) {
      console.error('Erreur vérification auth:', err);
      api.setToken(null);
      setUser(null);
      setCurrentView('login');
    }
  };

  const handleLogin = (data) => {
    setUser(data.user);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    api.setToken(null);
    setUser(null);
    setCurrentView('login');
  };

  const handleRegister = () => {
    setShowRegister(true);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="logo-section">
            <h1>🏃 BasicFit2</h1>
          </div>
          {user && (
            <>
              <nav className="nav-menu">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className={currentView === 'dashboard' ? 'active' : ''}
                >
                  📊 Tableau de bord
                </button>
                <button
                  onClick={() => setCurrentView('activities')}
                  className={currentView === 'activities' ? 'active' : ''}
                >
                  🏋️ Activités
                </button>
                <button
                  onClick={() => setCurrentView('goals')}
                  className={currentView === 'goals' ? 'active' : ''}
                >
                  🎯 Objectifs
                </button>
                <button
                  onClick={() => setCurrentView('profile')}
                  className={currentView === 'profile' ? 'active' : ''}
                >
                  👤 Profil
                </button>
                {user.role === 'admin' && (
                  <button
                    onClick={() => setCurrentView('users')}
                    className={currentView === 'users' ? 'active' : ''}
                  >
                    👥 Utilisateurs
                  </button>
                )}
              </nav>
              <div className="user-actions">
                <span className="user-name">
                  {user.email}
                  {user.role === 'admin' && (
                    <span style={{ 
                      marginLeft: '8px', 
                      fontSize: '12px', 
                      color: '#f44336',
                      fontWeight: 'bold'
                    }}>
                      Admin
                    </span>
                  )}
                </span>
                <button onClick={handleLogout} className="btn-logout">
                  Déconnexion
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      <main className="app-main">
        {!user ? (
          <div className="auth-section">
            {!showRegister ? (
              <>
                <Login onLogin={handleLogin} />
                <p className="auth-switch">
                  Pas encore de compte ?{' '}
                  <button onClick={handleRegister} className="link-btn">
                    S'inscrire
                  </button>
                </p>
              </>
            ) : (
              <>
                <Register onRegister={() => setShowRegister(false)} />
                <p className="auth-switch">
                  Déjà un compte ?{' '}
                  <button onClick={() => setShowRegister(false)} className="link-btn">
                    Se connecter
                  </button>
                </p>
              </>
            )}
          </div>
        ) : (
          <>
            {currentView === 'dashboard' && <Dashboard />}
            {currentView === 'activities' && <Activities />}
            {currentView === 'goals' && <Goals />}
            {currentView === 'profile' && <Profile onLogout={handleLogout} />}
            {currentView === 'users' && user.role === 'admin' && <Users />}
          </>
        )}
      </main>

      {user && (
        <footer className="app-footer">
          <div className="footer-content">
            <div className="footer-section">
              <h3>BasicFit2</h3>
              <p>Suivez vos activités sportives et atteignez vos objectifs</p>
            </div>
            <div className="footer-section">
              <h4>Navigation</h4>
              <ul>
                <li><button onClick={() => setCurrentView('dashboard')}>Tableau de bord</button></li>
                <li><button onClick={() => setCurrentView('activities')}>Activités</button></li>
                <li><button onClick={() => setCurrentView('goals')}>Objectifs</button></li>
                <li><button onClick={() => setCurrentView('profile')}>Profil</button></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Informations</h4>
              <p>© 2025 BasicFit2. Tous droits réservés.</p>
              <p>Version 1.0.0</p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

export default App;
