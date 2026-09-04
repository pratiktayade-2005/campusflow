import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { StatCard, EmptyState, Loading } from '../../components/ui';

export default function RecruiterDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [company, setCompany] = useState(null);

  useEffect(() => {
    (async () => {
      const [s, j] = await Promise.all([
        api.get('/analytics/recruiter'),
        api.get('/jobs/mine'),
      ]);
      setStats(s);
      setJobs(j);
      try {
        setCompany(await api.get('/companies/mine'));
      } catch (e) { /* no company yet */ }
      setLoading(false);
    })();
  }, []);

  if (loading) return <Loading />;

  const maxFunnel = Math.max(1, ...stats.funnel.map((f) => f.count));

  return (
    <div>
      {!company && (
        <div className="alert alert-info">
          Set up your <Link to="/company" style={{ textDecoration: 'underline', fontWeight: 700 }}>company profile</Link> to start posting jobs.
        </div>
      )}
      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        <StatCard icon="💼" label="Open positions" value={stats.open_jobs} tint="brand" />
        <StatCard icon="👥" label="Total applicants" value={stats.total_applicants} tint="info" />
        <StatCard icon="✅" label="Shortlisted" value={stats.shortlisted} tint="violet" />
        <StatCard icon="🎉" label="Offers extended" value={stats.offers_made} tint="success" />
      </div>

      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <div className="card">
          <div className="section-title">Hiring funnel</div>
          {stats.funnel.map((f) => (
            <div className="bar-row" key={f.stage}>
              <div className="b-label">{f.stage}</div>
              <div className="b-track"><div className="b-fill" style={{ width: `${(f.count / maxFunnel) * 100}%` }} /></div>
              <div className="b-value">{f.count}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="section-title">
            Your job postings
            <Link to="/jobs" className="btn btn-ghost btn-sm">Manage</Link>
          </div>
          {jobs.length === 0 ? (
            <EmptyState icon="💼" title="No jobs posted yet" desc="Post your first opening to start receiving applications." />
          ) : (
            jobs.slice(0, 5).map((j) => (
              <div className="list-item-row" key={j.id}>
                <div>
                  <div className="cell-title">{j.title}</div>
                  <div className="cell-sub">{j.applicant_count} applicant{j.applicant_count === 1 ? '' : 's'} · {j.status}</div>
                </div>
                <div className="pkg-tag">{j.package_lpa ? `₹${j.package_lpa} LPA` : '—'}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
