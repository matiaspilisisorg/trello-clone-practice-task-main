import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth.js';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/boards');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* Radial glows */}
      <div style={{
        position: 'fixed', top: '-20%', right: '-15%',
        width: '55%', height: '55%', pointerEvents: 'none',
        background: 'radial-gradient(ellipse, rgba(6,182,212,0.1) 0%, transparent 70%)',
      }} />
      <div style={{
        position: 'fixed', bottom: '-20%', left: '-15%',
        width: '50%', height: '50%', pointerEvents: 'none',
        background: 'radial-gradient(ellipse, rgba(99,102,241,0.11) 0%, transparent 70%)',
      }} />

      {/* Grid overlay */}
      <div className="bg-grid fixed inset-0 pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        {/* Brand mark */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-5">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                boxShadow: '0 0 28px rgba(99,102,241,0.5), 0 0 56px rgba(99,102,241,0.2)',
              }}
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            </div>
            <span className="font-display text-2xl font-bold text-gradient">Taskboard</span>
          </div>
          <h1 className="font-display text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Create account
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Get started with your free workspace
          </p>
        </div>

        {/* Form card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'var(--bg-form-card)',
            backdropFilter: 'blur(24px)',
            border: '1px solid var(--border-form)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.15), 0 0 0 1px rgba(6,182,212,0.07)',
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="section-label block mb-2">
                Full name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
                className="input-cyber w-full rounded-xl px-4 py-3 text-sm"
              />
            </div>

            <div>
              <label htmlFor="email" className="section-label block mb-2">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="input-cyber w-full rounded-xl px-4 py-3 text-sm"
              />
            </div>

            <div>
              <label htmlFor="password" className="section-label block mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                className="input-cyber w-full rounded-xl px-4 py-3 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-cyber w-full py-3 rounded-xl text-sm mt-2"
              style={{ marginTop: '0.75rem' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account...
                </span>
              ) : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold transition-colors duration-150"
              style={{ color: 'var(--text-link)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-link-hover)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-link)')}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
