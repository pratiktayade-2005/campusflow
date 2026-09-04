import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { StatCard, StatusBadge, EmptyState, Loading, formatDate } from '../../components/ui';

export default function StudentDashboard() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [apps, setApps] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [interviews, setInterviews] = useState([]);

  useEffect(() => {
    (async () => {
      const [p, a, j, i] = await Promise.all([
        api.get('/students/me'),
        api.get('/applications/mine'),
        api.get('/jobs?status_filter=OPEN'),
        api.get('/interviews/mine'),
      ]);
      setProfile(p);
      setApps(a);
      setJobs(j);
      setInterviews(i);
      setLoading(false);
    })();
  }, []);

  if (loading) return <Loading />;

  const offered = apps.filter((a) => a.status === 'OFFERED').length;
  const shortlisted = apps.filter((a) => ['SHORTLISTED', 'INTERVIEWING'].includes(a.status)).length;
  const eligibleJobs = jobs.filter((j) => j.eligible && !j.already_applied).slice(0, 4);
  const upcomingInterviews = interviews.filter((i) => i.status === 'SCHEDULED').slice(0, 3);

  const profileComplete = [profile.cgpa > 0, profile.skills, profile.resume_path].filter(Boolean).length;

  return (
    <div>
      {profileComplete < 3 && (
        <div className="card" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div className="section-title" style={{ marginBottom: 4 }}>Complete your profile to unlock more matches</div>
            <div className="progress-track" style={{ width: 260, marginTop: 6 }}>
              <div className="progress-fill" style={{ width: `${(profileComplete / 3) * 100}%` }} />
            </div>
          </div>
          <Link to="/profile" className="btn btn-primary btn-sm">Complete profile</Link>
        </div>
      )}

      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        <StatCard icon="📄" label="Applications sent" value={apps.length} tint="brand" />
        <StatCard icon="✅" label="Shortlisted / interviewing" value={shortlisted} tint="violet" />
        <StatCard icon="🎉" label="Offers received" value={offered} tint="success" />
        <StatCard icon="💼" label="Open jobs to explore" value={jobs.length} tint="info" />
      </div>

      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <div className="card">
          <div className="section-title">
            Recommended for you
            <Link to="/jobs" className="btn btn-ghost btn-sm">View all jobs</Link>
          </div>
          {eligibleJobs.length === 0 ? (
            <EmptyState icon="🔍" title="No new matches right now" desc="Check back soon or broaden your search in Browse Jobs." />
          ) : (
            eligibleJobs.map((j) => (
              <div className="list-item-row" key={j.id}>
                <div>
                  <div className="cell-title">{j.title}</div>
                  <div className="cell-sub">{j.company_name} · {j.location || 'Location flexible'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="pkg-tag">{j.package_lpa ? `₹${j.package_lpa} LPA` : '—'}</div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <div className="section-title">
            Upcoming interviews
            <Link to="/interviews" className="btn btn-ghost btn-sm">View all</Link>
          </div>
          {upcomingInterviews.length === 0 ? (
            <EmptyState icon="🎯" title="No interviews scheduled" desc="Keep applying — your interviews will show up here." />
          ) : (
            upcomingInterviews.map((iv) => (
              <div className="list-item-row" key={iv.id}>
                <div>
                  <div className="cell-title">{iv.round_name} — {iv.company_name}</div>
                  <div className="cell-sub">{iv.job_title} · {iv.mode}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="cell-title" style={{ fontSize: 13 }}>{formatDate(iv.scheduled_at)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="section-title">
          Recent applications
          <Link to="/applications" className="btn btn-ghost btn-sm">View all</Link>
        </div>
        {apps.length === 0 ? (
          <EmptyState icon="📄" title="You haven't applied to anything yet" desc="Browse open roles and apply in a couple of clicks." />
        ) : (
          <div className="table-wrap" style={{ border: 'none' }}>
            <table className="dtable">
              <thead><tr><th>Role</th><th>Company</th><th>Applied</th><th>Status</th></tr></thead>
              <tbody>
                {apps.slice(0, 5).map((a) => (
                  <tr key={a.id}>
                    <td className="cell-title">{a.job_title}</td>
                    <td>{a.company_name}</td>
                    <td>{formatDate(a.applied_at)}</td>
                    <td><StatusBadge status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
