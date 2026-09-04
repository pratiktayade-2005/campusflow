import { useEffect, useState } from 'react';
import { api } from '../api';
import { StatusBadge, EmptyState, Loading, formatDateTime, formatDate } from '../components/ui';

export default function InterviewsOffers() {
  const [tab, setTab] = useState('interviews');
  const [loading, setLoading] = useState(true);
  const [interviews, setInterviews] = useState([]);
  const [offers, setOffers] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    setLoading(true);
    const [iv, of] = await Promise.all([api.get('/interviews/mine'), api.get('/offers/mine')]);
    setInterviews(iv);
    setOffers(of);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const respond = async (offerId, accept, company) => {
    setError('');
    try {
      await api.put(`/offers/${offerId}/respond`, { accept });
      setNotice(accept ? `You accepted the offer from ${company}!` : `You declined the offer from ${company}.`);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <Loading />;

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Interviews &amp; offers</h2>
          <div className="desc">Everything scheduled and offered to you, in one place.</div>
        </div>
      </div>

      {notice && <div className="alert alert-success">{notice}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="tabs-row">
        <button className={`tab-btn${tab === 'interviews' ? ' active' : ''}`} onClick={() => setTab('interviews')}>
          Interviews <span className="count">{interviews.length}</span>
        </button>
        <button className={`tab-btn${tab === 'offers' ? ' active' : ''}`} onClick={() => setTab('offers')}>
          Offers <span className="count">{offers.length}</span>
        </button>
      </div>

      {tab === 'interviews' && (
        interviews.length === 0 ? (
          <EmptyState icon="🎯" title="No interviews yet" desc="Interviews scheduled by recruiters will appear here." />
        ) : (
          <div className="grid grid-2">
            {interviews.map((iv) => (
              <div className="card" key={iv.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div className="cell-title">{iv.round_name} · Round {iv.round_number}</div>
                    <div className="cell-sub">{iv.job_title} — {iv.company_name}</div>
                  </div>
                  <StatusBadge status={iv.status} />
                </div>
                <div className="job-meta">
                  <span>📅 {formatDateTime(iv.scheduled_at)}</span>
                  <span>💻 {iv.mode}</span>
                </div>
                {iv.feedback && (
                  <div style={{ marginTop: 12, padding: 12, background: 'var(--ink-50)', borderRadius: 10, fontSize: 12.5 }}>
                    <strong>Feedback: </strong>{iv.feedback} {iv.result && <StatusBadge status={iv.result} />}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'offers' && (
        offers.length === 0 ? (
          <EmptyState icon="🎉" title="No offers yet" desc="Keep going — your hard work will pay off." />
        ) : (
          <div className="grid grid-2">
            {offers.map((o) => (
              <div className="card" key={o.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div className="cell-title">{o.role}</div>
                    <div className="cell-sub">{o.company_name}</div>
                  </div>
                  <StatusBadge status={o.status} />
                </div>
                <div className="pkg-tag" style={{ fontSize: 20, marginBottom: 8 }}>₹{o.package_lpa} LPA</div>
                <div className="job-meta"><span>📅 Issued {formatDate(o.issued_at)}</span></div>
                {o.status === 'OFFERED' && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                    <button className="btn btn-primary btn-sm" onClick={() => respond(o.id, true, o.company_name)}>Accept</button>
                    <button className="btn btn-danger btn-sm" onClick={() => respond(o.id, false, o.company_name)}>Decline</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
