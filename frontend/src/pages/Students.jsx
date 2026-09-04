import { useEffect, useState } from 'react';
import { api } from '../api';
import { EmptyState, Loading } from '../components/ui';

export default function Students() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [branch, setBranch] = useState('ALL');

  const load = async () => {
    setLoading(true);
    setStudents(await api.get('/students'));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const branches = ['ALL', ...new Set(students.map((s) => s.branch))];
  const filtered = students
    .filter((s) => branch === 'ALL' || s.branch === branch)
    .filter((s) => !search || s.full_name.toLowerCase().includes(search.toLowerCase()) || s.roll_number.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Students</h2>
          <div className="desc">{students.length} students on the platform.</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ maxWidth: 300 }}>
          🔎<input placeholder="Search by name or roll number…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="pill-filter">
          {branches.map((b) => (
            <button key={b} className={branch === b ? 'active' : ''} onClick={() => setBranch(b)}>{b}</button>
          ))}
        </div>
      </div>

      {loading ? <Loading /> : filtered.length === 0 ? (
        <EmptyState icon="🎓" title="No students found" />
      ) : (
        <div className="table-wrap">
          <table className="dtable">
            <thead><tr><th>Name</th><th>Roll no.</th><th>Branch</th><th>CGPA</th><th>Backlogs</th><th>Resume</th></tr></thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div className="cell-title">{s.full_name}</div>
                    <div className="cell-sub">{s.email}</div>
                  </td>
                  <td>{s.roll_number}</td>
                  <td>{s.branch}</td>
                  <td>{s.cgpa}</td>
                  <td>{s.backlogs}</td>
                  <td>
                    {s.resume_path
                      ? <a className="btn btn-ghost btn-sm" href={api.fileUrl(s.resume_path)} target="_blank" rel="noreferrer">View</a>
                      : <span className="cell-sub">Not uploaded</span>}
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
