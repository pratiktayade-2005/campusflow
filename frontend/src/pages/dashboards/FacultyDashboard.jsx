import { useEffect, useState } from 'react';
import { api } from '../../api';
import { StatCard, EmptyState, Loading } from '../../components/ui';

export default function FacultyDashboard() {
  const [loading, setLoading] = useState(true);
  const [dept, setDept] = useState([]);

  useEffect(() => {
    (async () => {
      setDept(await api.get('/faculty/department-stats'));
      setLoading(false);
    })();
  }, []);

  if (loading) return <Loading />;

  const totalStudents = dept.reduce((s, d) => s + d.student_count, 0);
  const totalPlaced = dept.reduce((s, d) => s + d.placed, 0);
  const avgCgpa = dept.length ? (dept.reduce((s, d) => s + d.avg_cgpa, 0) / dept.length).toFixed(2) : '0.00';
  const maxCount = Math.max(1, ...dept.map((d) => d.student_count));

  return (
    <div>
      <div className="grid grid-3" style={{ marginBottom: 24 }}>
        <StatCard icon="🎓" label="Total students" value={totalStudents} tint="brand" />
        <StatCard icon="🎉" label="Students placed" value={totalPlaced} tint="success" />
        <StatCard icon="📊" label="Average CGPA" value={avgCgpa} tint="violet" />
      </div>

      <div className="card">
        <div className="section-title">Branch-wise overview</div>
        {dept.length === 0 ? (
          <EmptyState icon="🎓" title="No student records yet" />
        ) : (
          <div className="table-wrap" style={{ border: 'none' }}>
            <table className="dtable">
              <thead>
                <tr><th>Branch</th><th>Students</th><th>Avg. CGPA</th><th>Placed</th><th>Distribution</th></tr>
              </thead>
              <tbody>
                {dept.map((d) => (
                  <tr key={d.branch}>
                    <td className="cell-title">{d.branch}</td>
                    <td>{d.student_count}</td>
                    <td>{d.avg_cgpa}</td>
                    <td>{d.placed}</td>
                    <td style={{ minWidth: 160 }}>
                      <div className="progress-track"><div className="progress-fill" style={{ width: `${(d.student_count / maxCount) * 100}%` }} /></div>
                    </td>
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
