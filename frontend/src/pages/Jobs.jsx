import { useEffect, useState } from "react";
import api from "../api.js";

function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [results, setResults] = useState({});

  useEffect(() => {
    api.get("/jobs").then((res) => setJobs(res.data));
  }, []);

  const checkEligibility = async (jobId) => {
    try {
      const res = await api.get(`/jobs/${jobId}/check-eligibility`);
      setResults({ ...results, [jobId]: res.data });
    } catch (error) {
      setResults({
        ...results,
        [jobId]: { error: error.response?.data?.detail || "Failed to check" },
      });
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h3>Available Jobs</h3>
      {jobs.map((job) => (
        <div key={job.id} style={{ border: "1px solid #ccc", padding: "10px", marginBottom: "10px" }}>
          <p><strong>{job.title}</strong></p>
          <p>Package: {job.package_lpa} LPA | Location: {job.location}</p>
          <p>Min CGPA: {job.min_cgpa} | Max Backlogs: {job.max_backlogs}</p>
          <p>Allowed Branches: {job.allowed_branches}</p>
          <button onClick={() => checkEligibility(job.id)}>Check My Eligibility</button>

          {results[job.id] && (
            <div style={{ marginTop: "10px" }}>
              {results[job.id].error ? (
                <p style={{ color: "red" }}>{results[job.id].error}</p>
              ) : results[job.id].eligible ? (
                <p style={{ color: "green" }}>✅ You are eligible!</p>
              ) : (
                <div style={{ color: "red" }}>
                  <p>❌ Not eligible:</p>
                  <ul>
                    {results[job.id].reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default Jobs;