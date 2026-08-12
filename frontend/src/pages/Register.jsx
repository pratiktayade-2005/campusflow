import { useState } from "react";
import axios from "axios";

function Register() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "STUDENT",
  });
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://127.0.0.1:8000/auth/register", form);
      setMessage("Registered successfully! You can now log in.");
    } catch (error) {
      setMessage(error.response?.data?.detail || "Registration failed");
    }
  };

  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif" }}>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <input name="full_name" placeholder="Full Name" onChange={handleChange} required />
        <br />
        <input name="email" type="email" placeholder="Email" onChange={handleChange} required />
        <br />
        <input name="password" type="password" placeholder="Password" onChange={handleChange} required />
        <br />
        <select name="role" onChange={handleChange} value={form.role}>
          <option value="STUDENT">Student</option>
          <option value="FACULTY">Faculty</option>
          <option value="PLACEMENT_OFFICER">Placement Officer</option>
          <option value="RECRUITER">Recruiter</option>
        </select>
        <br />
        <button type="submit">Register</button>
      </form>
      <p>{message}</p>
    </div>
  );
}

export default Register;