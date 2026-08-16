import { useEffect, useState } from "react";
import api from "../api.js";

function OfficerDashboard() {
  const [students, setStudents] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [applications, setApplications] = useState([]);

  const loadData = () => {
    api.get("/officer/students").then((res) => setStudents(res.data));
    api.get("/companies").then((res) => setCompanies(res.data));
    api.get("/officer/applications").then((res) => setApplications(res.data));
  };

  useEffect(() => {
    loadData();
  }, []);

  const approveCompany = async (id) => {
    await api.patch(`/companies/${id}/approve`);
    loadData();
  };

  const rejectCompany = async (id) => {
    await api.patch(`/companies/${id}/reject`);
    loadData();
  };

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h3>Companies ({companies.length})</h3>
      {companies.map((c) => (
        <div key={c.id} style={{ border: "1px solid #ccc", padding: "10px", marginBottom: "10px" }}>
          <p><strong>{c.name}</strong> — Status: {c.status}</p>
          <p>{c.description}</p>
          {c.status === "PENDING" && (
            <>
              <button onClick={() => approveCompany(c.id)}>Approve</button>{" "}
              <button onClick={() => rejectCompany(c.id)}>Reject</button>
            </>
          )}
        </div>
      ))}

      <h3>Students ({students.length})</h3>
      <table border="1" cellPadding="5">
        <thead>
          <tr>
            <th>Roll No</th>
            <th>Branch</th>
            <th>CGPA</th>
            <th>Backlogs</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s.id}>
              <td>{s.roll_number}</td>
              <td>{s.branch}</td>
              <td>{s.cgpa}</td>
              <td>{s.backlogs}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Applications ({applications.length})</h3>
      <table border="1" cellPadding="5">
        <thead>
          <tr>
            <th>Student ID</th>
            <th>Job ID</th>
            <th>Status</th>
            <th>Applied At</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((a) => (
            <tr key={a.id}>
              <td>{a.student_id}</td>
              <td>{a.job_id}</td>
              <td>{a.status}</td>
              <td>{new Date(a.applied_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default OfficerDashboard;