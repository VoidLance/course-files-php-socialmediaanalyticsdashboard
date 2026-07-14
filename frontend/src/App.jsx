import { useEffect, useState } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import AuthPage from './pages/AuthPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import CalendarPage from './pages/CalendarPage.jsx';
import ConnectionsPage from './pages/ConnectionsPage.jsx';
import InsightsPage from './pages/InsightsPage.jsx';
import IntelligencePage from './pages/IntelligencePage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import { getCurrentUser, setToken } from './services/api.js';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function boot() {
      try {
        const current = await getCurrentUser();
        setUser(current);
      } catch (_err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    boot();
  }, []);

  if (loading) {
    return <main className="content"><p>Loading workspace...</p></main>;
  }

  if (!user) {
    return (
      <div className="layout single-column">
        <main className="content">
          <AuthPage onAuthenticated={setUser} />
        </main>
      </div>
    );
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <h1>Social IQ</h1>
        <p className="meta">{user.fullName} ({user.role})</p>
        <nav>
          <Link to="/">Dashboard</Link>
          <Link to="/insights">Platform Insights</Link>
          <Link to="/connections">Connections</Link>
          <Link to="/calendar">Content Calendar</Link>
          <Link to="/intelligence">Intelligence</Link>
          <Link to="/reports">Reports and Alerts</Link>
          <button
            type="button"
            className="link-button"
            onClick={() => {
              setToken('');
              setUser(null);
            }}
          >
            Sign Out
          </button>
        </nav>
      </aside>
      <main className="content">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/insights" element={<InsightsPage />} />
          <Route path="/connections" element={<ConnectionsPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/intelligence" element={<IntelligencePage />} />
          <Route path="/reports" element={<ReportsPage />} />
        </Routes>
      </main>
    </div>
  );
}
