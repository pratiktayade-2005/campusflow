import { useEffect, useState } from 'react';
import { api } from '../../api';
import { StatCard, EmptyState, Loading } from '../../components/ui';

export default function OfficerDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    (async () => {
      setStats(await api.get('/analytics/officer'));
      setLoading(false);
    })();
  }, []);

  if (loading) return <Loading />;

  const maxBranch = Math.max(1, ...stats.branch_wise.map((b) => b.count));
  const maxMonthly = Math.max(1, ...stats.monthly_offers.map((m) => m.count));

  return (
    <div>
      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        <StatCard icon="🎓" label="Total students" value={stats.total_students} tint="brand" />
        <StatCard icon="🏢" label="Partner companies" value={stats.total_companies} tint="info" />
        <StatCard icon="💼" label="Open jobs" value={`${stats.open_jobs}/${stats.total_jobs}`} tint="violet" />
        <StatCard icon="🎉" label="Placement rate" value={`${stats.placement_rate}%`} tint="success" />
      </div>

      <div className="grid grid-3" style={{ marginBottom: 20 }}>
        <StatCard icon="📄" label="Total applications" value={stats.total_applications} tint="info" />
        <StatCard icon="💰" label="Average package" value={`₹${stats.avg_package} LPA`} tint="brand" />
        <StatCard icon="🏆" label="Highest package" value={`₹${stats.max_package} LPA`} tint="success" />
      </div>

      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <div className="card">
          <div className="section-title">Students by branch</div>
          {stats.branch_wise.length === 0 ? <EmptyState title="No student data yet" /> : stats.branch_wise.map((b) => (
            <div className="bar-row" key={b.branch}>
              <div className="b-label">{b.branch}</div>
              <div className="b-track"><div className="b-fill" style={{ width: `${(b.count / maxBranch) * 100}%` }} /></div>
              <div className="b-value">{b.count}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="section-title">Top hiring companies</div>
          {stats.top_companies.length === 0 ? (
            <EmptyState icon="🏢" title="No offers made yet" />
          ) : (
            stats.top_companies.map((c) => (
              <div className="list-item-row" key={c.company}>
                <div className="cell-title">{c.company}</div>
                <div className="badge badge-brand" style={{ background: 'var(--brand-50)', color: 'var(--brand-700)' }}>{c.offers} offers</div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="section-title">Offers issued by month</div>
        {stats.monthly_offers.length === 0 ? (
          <EmptyState icon="📈" title="No offers issued yet" />
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, height: 140, padding: '0 4px' }}>
            {stats.monthly_offers.map((m) => (
              <div key={m.month} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <div style={{
                  width: '100%', maxWidth: 40, borderRadius: '8px 8px 0 0',
                  background: 'linear-gradient(180deg, var(--brand-400), var(--brand-600))',
                  height: `${(m.count / maxMonthly) * 100}px`, minHeight: 6,
                }} title={`${m.count} offers`} />
                <div style={{ fontSize: 11, color: 'var(--ink-400)', marginTop: 6 }}>{m.month}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
