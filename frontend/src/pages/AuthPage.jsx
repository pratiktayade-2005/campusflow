import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  { value: 'STUDENT', label: 'Student', icon: '🎓' },
  { value: 'RECRUITER', label: 'Recruiter', icon: '🏢' },
  { value: 'FACULTY', label: 'Faculty', icon: '📘' },
  { value: 'PLACEMENT_OFFICER', label: 'Placement Officer', icon: '🧭' },
];

export default function AuthPage({ mode }) {
  const isLogin = mode === 'login';
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    email: '', password: '', full_name: '', role: 'STUDENT',
    roll_number: '', branch: '', graduation_year: '', department: '', company_name: '',
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(form.email, form.password);
      } else {
        const payload = { email: form.email, password: form.password, full_name: form.full_name, role: form.role };
        if (form.role === 'STUDENT') {
          Object.assign(payload, {
            roll_number: form.roll_number, branch: form.branch,
            graduation_year: form.graduation_year ? parseInt(form.graduation_year, 10) : undefined,
          });
        } else if (form.role === 'FACULTY') {
          payload.department = form.department;
        } else if (form.role === 'RECRUITER') {
          payload.company_name = form.company_name;
        }
        await register(payload);
      }
      navigate('/');
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <div className="logo-mark"><span className="logo-icon">CF</span>CampusFlow</div>
        <div>
          <h1>Where campus placements actually run smoothly.</h1>
          <p className="sub">
            One platform for students, recruiters, faculty, and placement cells to manage
            jobs, applications, interviews, and offers — end to end.
          </p>
          <div className="auth-stats">
            <div className="stat"><b>2,400+</b><span>Students placed</span></div>
            <div className="stat"><b>180+</b><span>Partner companies</span></div>
            <div className="stat"><b>96%</b><span>Placement rate</span></div>
          </div>
        </div>
        <div className="auth-quote">"CampusFlow cut our placement coordination time by more than half." — Placement Cell, demo college</div>
      </div>

      <div className="auth-panel">
        <div className="auth-card">
          <div className="auth-tabs">
            <button className={isLogin ? 'active' : ''} onClick={() => navigate('/login')}>Sign in</button>
            <button className={!isLogin ? 'active' : ''} onClick={() => navigate('/register')}>Create account</button>
          </div>
          <h2>{isLogin ? 'Welcome back' : 'Get started'}</h2>
          <p className="lede">{isLogin ? 'Sign in to continue to your dashboard.' : 'Set up your CampusFlow account in a minute.'}</p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={submit}>
            {!isLogin && (
              <>
                <div className="field">
                  <label>I am a…</label>
                  <div className="role-grid">
                    {ROLES.map((r) => (
                      <button
                        type="button"
                        key={r.value}
                        className={`role-option${form.role === r.value ? ' active' : ''}`}
                        onClick={() => set('role', r.value)}
                      >
                        <span className="r-icon">{r.icon}</span>
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="field">
                  <label>Full name</label>
                  <input required value={form.full_name} onChange={(e) => set('full_name', e.target.value)} placeholder="Jordan Lee" />
                </div>
              </>
            )}

            <div className="field">
              <label>Email address</label>
              <input required type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="field">
              <label>Password</label>
              <input required type="password" minLength={6} value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="••••••••" />
            </div>

            {!isLogin && form.role === 'STUDENT' && (
              <>
                <div className="field-row">
                  <div className="field">
                    <label>Roll number</label>
                    <input required value={form.roll_number} onChange={(e) => set('roll_number', e.target.value)} placeholder="CS21001" />
                  </div>
                  <div className="field">
                    <label>Graduation year</label>
                    <input required type="number" value={form.graduation_year} onChange={(e) => set('graduation_year', e.target.value)} placeholder="2026" />
                  </div>
                </div>
                <div className="field">
                  <label>Branch</label>
                  <input required value={form.branch} onChange={(e) => set('branch', e.target.value)} placeholder="Computer Science" />
                </div>
              </>
            )}

            {!isLogin && form.role === 'FACULTY' && (
              <div className="field">
                <label>Department</label>
                <input value={form.department} onChange={(e) => set('department', e.target.value)} placeholder="Computer Science" />
              </div>
            )}

            {!isLogin && form.role === 'RECRUITER' && (
              <div className="field">
                <label>Company name</label>
                <input required value={form.company_name} onChange={(e) => set('company_name', e.target.value)} placeholder="TechCorp Solutions" />
                <div className="field-hint">If your company already has an account, contact your placement cell instead.</div>
              </div>
            )}

            <button className="btn btn-primary btn-block" disabled={loading} type="submit">
              {loading ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'}
            </button>
          </form>

          {isLogin && (
            <div className="field-hint" style={{ marginTop: 16, textAlign: 'center' }}>
              Demo logins (password <code>password123</code>): officer@campusflow.edu · faculty@campusflow.edu ·
              aisha.khan@student.edu · recruiter@techcorp.com
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
