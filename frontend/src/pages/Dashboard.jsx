import { useEffect, useState } from "react";
import api from "../api.js";
import StudentProfile from "./StudentProfile.jsx";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/auth/me")
      .then((response) => setUser(response.data))
      .catch(() => setError("Not logged in or session expired"));
  }, []);

  if (error) return <p style={{ padding: "40px" }}>{error}</p>;
  if (!user) return <p style={{ padding: "40px" }}>Loading...</p>;

  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif" }}>
      <h2>Welcome, {user.full_name}</h2>
      <p>Email: {user.email}</p>
      <p>Role: {user.role}</p>

      {user.role === "STUDENT" && <StudentProfile />}
    </div>
  );
}

export default Dashboard;