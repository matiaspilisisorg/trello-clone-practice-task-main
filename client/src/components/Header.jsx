import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useTheme } from '../context/ThemeContext.jsx';

export default function Header() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <header
      className="glass h-12 flex items-center justify-between px-5 fixed top-0 left-0 right-0 z-50"
      style={{ borderBottom: '1px solid var(--border-subtle)' }}
    >
      {/* Logo */}
      <Link to="/boards" className="flex items-center gap-2.5 no-underline group">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
            boxShadow: '0 0 12px rgba(99,102,241,0.5)',
          }}
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
              d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
          </svg>
        </div>
        <span className="font-display font-bold text-base tracking-tight text-gradient">
          Taskboard
        </span>
      </Link>

      {/* Right side: theme toggle + user menu */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200"
          style={{
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--bg-hover)';
            e.currentTarget.style.borderColor = 'var(--border-muted)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'var(--bg-subtle)';
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            /* Sun icon */
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            /* Moon icon */
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        {/* User menu */}
        {user && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition-all duration-150"
              style={{
                background: dropdownOpen ? 'rgba(99,102,241,0.12)' : 'transparent',
                border: '1px solid',
                borderColor: dropdownOpen ? 'rgba(99,102,241,0.25)' : 'transparent',
              }}
              onMouseEnter={e => {
                if (!dropdownOpen) e.currentTarget.style.background = 'var(--bg-hover)';
              }}
              onMouseLeave={e => {
                if (!dropdownOpen) e.currentTarget.style.background = 'transparent';
              }}
            >
              {/* Avatar */}
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                  boxShadow: '0 0 10px rgba(99,102,241,0.45)',
                }}
              >
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium" style={{ color: 'var(--text-card)' }}>
                {user.name}
              </span>
              <svg
                className={`w-3.5 h-3.5 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
                style={{ color: 'var(--text-muted)' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {dropdownOpen && (
              <div
                className="absolute right-0 mt-1.5 w-56 rounded-xl py-1.5 overflow-hidden"
                style={{
                  background: 'var(--bg-dropdown)',
                  backdropFilter: 'blur(24px)',
                  border: '1px solid var(--border-muted)',
                  boxShadow: '0 16px 40px rgba(0,0,0,0.25), 0 0 0 1px rgba(99,102,241,0.1)',
                }}
              >
                <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <p className="section-label mb-0.5">Signed in as</p>
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-secondary)' }}>
                    {user.email}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 transition-colors duration-100"
                  style={{ color: 'var(--text-danger)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
