import { useEffect, useState } from "react";
import api from "../api.js";

function StudentProfile() {
  const [profile, setProfile] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [form, setForm] = useState({
    roll_number: "",
    branch: "",
    graduation_year: "",
    cgpa: "",
    backlogs: 0,
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    api
      .get("/students/me")
      .then((res) => setProfile(res.data))
      .catch(() => setNotFound(true));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/students/me", form);
      setProfile(res.data);
      setNotFound(false);
    } catch (error) {
      setMessage(error.response?.data?.detail || "Failed to create profile");
    }
  };

  if (profile) {
    return (
      <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
        <h3>My Student Profile</h3>
        <p>Roll Number: {profile.roll_number}</p>
        <p>Branch: {profile.branch}</p>
        <p>Graduation Year: {profile.graduation_year}</p>
        <p>CGPA: {profile.cgpa}</p>
        <p>Backlogs: {profile.backlogs}</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
        <h3>Create Your Student Profile</h3>
        <form onSubmit={handleSubmit}>
          <input name="roll_number" placeholder="Roll Number" onChange={handleChange} required />
          <br />
          <input name="branch" placeholder="Branch (e.g. CSE)" onChange={handleChange} required />
          <br />
          <input name="graduation_year" type="number" placeholder="Graduation Year" onChange={handleChange} required />
          <br />
          <input name="cgpa" type="number" step="0.01" placeholder="CGPA" onChange={handleChange} required />
          <br />
          <button type="submit">Save Profile</button>
        </form>
        <p>{message}</p>
      </div>
    );
  }

  return <p style={{ padding: "20px" }}>Loading...</p>;
}

export default StudentProfile;