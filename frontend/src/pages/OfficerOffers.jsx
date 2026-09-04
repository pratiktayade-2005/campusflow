import { useEffect, useState } from 'react';
import { api } from '../api';
import { StatusBadge, EmptyState, Loading, formatDate } from '../components/ui';

export default function OfficerOffers() {
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState([]);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    (async () => {
      setOffers(await api.get('/offers'));
      setLoading(false);
    })();
  }, []);

  const filtered = offers.filter((o) => filter === 'ALL' || o.status === filter);
  const accepted = offers.filter((o) => o.status === 'ACCEPTED').length;
  const avgPackage = offers.length ? (offers.reduce((s, o) => s + parseFloat(o.package_lpa), 0) / offers.length).toFixed(2) : 0;

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Offers</h2>
          <div className="desc">{offers.length} offers issued · {accepted} accepted · avg ₹{avgPackage} LPA</div>
        </div>
      </div>

      <div className="pill-filter" style={{ marginBottom: 18 }}>
        {['ALL', 'OFFERED', 'ACCEPTED', 'DECLINED'].map((s) => (
          <button key={s} className={filter === s ? 'active' : ''} onClick={() => setFilter(s)}>{s}</button>
        ))}
      </div>

      {loading ? <Loading /> : filtered.length === 0 ? (
        <EmptyState icon="🎉" title="No offers found" />
      ) : (
        <div className="table-wrap">
          <table className="dtable">
            <thead><tr><th>Student</th><th>Company</th><th>Role</th><th>Package</th><th>Issued</th><th>Status</th></tr></thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id}>
                  <td className="cell-title">{o.student_name}</td>
                  <td>{o.company_name}</td>
                  <td>{o.role}</td>
                  <td>₹{o.package_lpa} LPA</td>
                  <td>{formatDate(o.issued_at)}</td>
                  <td><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
