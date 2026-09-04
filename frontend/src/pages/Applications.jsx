import { useEffect, useState } from 'react';
import { api } from '../api';
import { StatusBadge, EmptyState, Loading, formatDate } from '../components/ui';

const STAGES = ['APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEWING', 'OFFERED'];

export default function Applications() {
  const [loading, setLoading] = useState(true);
  const [apps, setApps] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    setLoading(true);
    setApps(await api.get('/applications/mine'));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const withdraw = async (id, title) => {
    if (!window.confirm(`Withdraw your application for ${title}?`)) return;
    setError('');
    try {
      await api.put(`/applications/${id}/withdraw`);
      setNotice('Application withdrawn.');
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const filtered = apps.filter((a) => filter === 'ALL' || a.status === filter);

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>My applications</h2>
          <div className="desc">Track every role you've applied to, from submission to offer.</div>
        </div>
      </div>

      {notice && <div className="alert alert-success">{notice}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="pill-filter" style={{ marginBottom: 18 }}>
        <button className={filter === 'ALL' ? 'active' : ''} onClick={() => setFilter('ALL')}>All ({apps.length})</button>
        {STAGES.map((s) => (
          <button key={s} className={filter === s ? 'active' : ''} onClick={() => setFilter(s)}>
            {s.replace('_', ' ')} ({apps.filter((a) => a.status === s).length})
          </button>
        ))}
      </div>

      {loading ? <Loading /> : filtered.length === 0 ? (
        <EmptyState icon="📄" title="No applications here" desc="Head to Browse Jobs to apply for your first role." />
      ) : (
        <div className="table-wrap">
          <table className="dtable">
            <thead><tr><th>Role</th><th>Company</th><th>Package</th><th>Applied</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id}>
                  <td className="cell-title">{a.job_title}</td>
                  <td>{a.company_name}</td>
                  <td>{a.package_lpa ? `₹${a.package_lpa} LPA` : '—'}</td>
                  <td>{formatDate(a.applied_at)}</td>
                  <td><StatusBadge status={a.status} /></td>
                  <td>
                    {!['WITHDRAWN', 'REJECTED', 'OFFERED'].includes(a.status) && (
                      <button className="btn btn-ghost btn-sm" onClick={() => withdraw(a.id, a.job_title)}>Withdraw</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
