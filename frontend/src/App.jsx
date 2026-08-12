import { useState } from "react";
import Register from "./pages/Register.jsx";
import Login from "./pages/Login.jsx";

function App() {
  const [page, setPage] = useState("login");

  return (
    <div>
      <nav style={{ padding: "10px", background: "#eee" }}>
        <button onClick={() => setPage("login")}>Login</button>
        <button onClick={() => setPage("register")}>Register</button>
      </nav>

      {page === "login" ? <Login /> : <Register />}
    </div>
  );
}

export default App;