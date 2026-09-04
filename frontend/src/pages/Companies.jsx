import { useEffect, useState } from 'react';
import { api } from '../api';
import { StatusBadge, EmptyState, Loading } from '../components/ui';

export default function Companies() {
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setCompanies(await api.get('/companies'));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const setStatus = async (id, status) => {
    setError('');
    try {
      await api.put(`/companies/${id}/status`, { status });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Companies</h2>
          <div className="desc">Approve recruiting partners and keep an eye on your company roster.</div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? <Loading /> : companies.length === 0 ? (
        <EmptyState icon="🏢" title="No companies yet" />
      ) : (
        <div className="grid grid-3">
          {companies.map((c) => (
            <div className="card" key={c.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                {c.logo_path ? (
                  <img src={api.fileUrl(c.logo_path)} alt={c.name} className="company-mark-img" style={{ width: 48, height: 48 }} />
                ) : (
                  <div className="company-mark">{c.name.slice(0, 2).toUpperCase()}</div>
                )}
                <StatusBadge status={c.status} />
              </div>
              <h3 style={{ fontSize: 15.5, marginBottom: 3 }}>{c.name}</h3>
              <div className="cell-sub" style={{ marginBottom: 10 }}>{c.industry || 'Industry not specified'} · {c.location || 'Location N/A'}</div>
              <p style={{ fontSize: 12.5, color: 'var(--ink-500)', lineHeight: 1.5, marginBottom: 14, minHeight: 34 }}>
                {c.description || 'No description provided.'}
              </p>
              {c.status !== 'APPROVED' && (
                <button className="btn btn-primary btn-sm" style={{ marginRight: 8 }} onClick={() => setStatus(c.id, 'APPROVED')}>Approve</button>
              )}
              {c.status !== 'REJECTED' && (
                <button className="btn btn-danger btn-sm" onClick={() => setStatus(c.id, 'REJECTED')}>Reject</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
