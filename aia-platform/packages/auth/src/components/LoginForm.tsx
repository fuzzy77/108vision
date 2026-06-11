/**
 * @aia/auth — Reusable Login Form component.
 *
 * A React login form with:
 * - Email + password inputs
 * - "Accedi" submit button
 * - "Password dimenticata?" link
 * - Error display
 * - Loading state
 * - 108 logo placeholder at top
 *
 * Can be imported by both the dashboard and client apps.
 */

import { useState, type FormEvent, type CSSProperties } from 'react';

export interface LoginFormProps {
  /** Called when the user submits the form. Should return an error message or null on success. */
  onSubmit: (email: string, password: string) => Promise<string | null>;
  /** Called when "Password dimenticata?" is clicked. */
  onForgotPassword?: () => void;
  /** Optional logo element to render at the top. Defaults to "108" text. */
  logo?: React.ReactNode;
  /** Optional additional class name for the form container. */
  className?: string;
  /** Optional inline styles for the form container. */
  style?: CSSProperties;
}

const defaultStyles: Record<string, CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '2rem',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: '#f8fafc',
  },
  card: {
    width: '100%',
    maxWidth: '400px',
    padding: '2.5rem',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  },
  logo: {
    textAlign: 'center' as const,
    marginBottom: '2rem',
    fontSize: '2rem',
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: '-0.025em',
  },
  title: {
    textAlign: 'center' as const,
    marginBottom: '1.5rem',
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#334155',
  },
  inputGroup: {
    marginBottom: '1rem',
  },
  label: {
    display: 'block',
    marginBottom: '0.375rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#475569',
  },
  input: {
    width: '100%',
    padding: '0.75rem 1rem',
    fontSize: '1rem',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    boxSizing: 'border-box' as const,
  },
  button: {
    width: '100%',
    padding: '0.75rem 1rem',
    marginTop: '1.5rem',
    fontSize: '1rem',
    fontWeight: '600',
    color: '#ffffff',
    backgroundColor: '#2563eb',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },
  buttonDisabled: {
    backgroundColor: '#93c5fd',
    cursor: 'not-allowed',
  },
  error: {
    marginTop: '1rem',
    padding: '0.75rem 1rem',
    fontSize: '0.875rem',
    color: '#dc2626',
    backgroundColor: '#fef2f2',
    borderRadius: '8px',
    border: '1px solid #fecaca',
  },
  forgotLink: {
    display: 'block',
    marginTop: '1rem',
    textAlign: 'center' as const,
    fontSize: '0.875rem',
    color: '#2563eb',
    textDecoration: 'none',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    padding: 0,
  },
};

export function LoginForm({
  onSubmit,
  onForgotPassword,
  logo,
  className,
  style,
}: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Inserisci un indirizzo email.');
      return;
    }

    if (!password) {
      setError('Inserisci la password.');
      return;
    }

    setLoading(true);

    try {
      const errorMessage = await onSubmit(email.trim(), password);
      if (errorMessage) {
        setError(errorMessage);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Si è verificato un errore. Riprova.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={className} style={{ ...defaultStyles.container, ...style }}>
      <div style={defaultStyles.card}>
        {/* Logo */}
        <div style={defaultStyles.logo}>
          {logo ?? <span>108</span>}
        </div>

        {/* Title */}
        <h1 style={defaultStyles.title}>Accedi alla piattaforma</h1>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={defaultStyles.inputGroup}>
            <label htmlFor="login-email" style={defaultStyles.label}>
              Email
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="nome@azienda.it"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              style={defaultStyles.input}
            />
          </div>

          {/* Password */}
          <div style={defaultStyles.inputGroup}>
            <label htmlFor="login-password" style={defaultStyles.label}>
              Password
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              placeholder="La tua password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              style={defaultStyles.input}
            />
          </div>

          {/* Error */}
          {error && (
            <div style={defaultStyles.error} role="alert">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              ...defaultStyles.button,
              ...(loading ? defaultStyles.buttonDisabled : {}),
            }}
          >
            {loading ? 'Accesso in corso...' : 'Accedi'}
          </button>
        </form>

        {/* Forgot password */}
        {onForgotPassword && (
          <button
            type="button"
            onClick={onForgotPassword}
            style={defaultStyles.forgotLink}
          >
            Password dimenticata?
          </button>
        )}
      </div>
    </div>
  );
}

export default LoginForm;
