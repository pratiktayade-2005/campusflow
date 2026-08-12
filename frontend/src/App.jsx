import { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/")
      .then((response) => setMessage(response.data.message))
      .catch(() => setMessage("Could not connect to backend"));
  }, []);

  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif" }}>
      <h1>CampusFlow</h1>
      <p>Backend says: {message}</p>
    </div>
  );
}

export default App;