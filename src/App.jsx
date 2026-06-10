import { BrowserRouter, Routes, Route, useLocation, Link } from 'react-router-dom';
import BottomNav from './components/layout/BottomNav.jsx';
import { ToastProvider } from './components/ui/Toast.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Log from './pages/Log.jsx';
import Weight from './pages/Weight.jsx';
import Stats from './pages/Stats.jsx';
import Profile from './pages/Profile.jsx';
import Foods from './pages/Foods.jsx';
import './styles/index.css';

// Page header — gradient logo + contextual actions
function PageHeader() {
  const location = useLocation();

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 'var(--header-height)',
        background: 'var(--color-bg)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 var(--space-5)',
        zIndex: 150,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <span
        style={{
          fontSize: 'var(--font-md)',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          background: 'linear-gradient(135deg, var(--color-accent), #67e8f9)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        MyKalory
      </span>

      {/* Quick link to food database from log page or home screen */}
      {(location.pathname === '/' || location.pathname === '/log') && (
        <Link
          to="/foods"
          style={{
            marginLeft: 'auto',
            fontSize: 'var(--font-sm)',
            color: 'var(--color-accent)',
            fontWeight: 500,
          }}
        >
          Mis alimentos
        </Link>
      )}
    </header>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider />
      <PageHeader />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/"        element={<Dashboard />} />
          <Route path="/log"     element={<Log />} />
          <Route path="/weight"  element={<Weight />} />
          <Route path="/stats"   element={<Stats />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/foods"   element={<Foods />} />
        </Routes>
      </main>
      <BottomNav />
    </BrowserRouter>
  );
}
