import { useState } from "react";
import Register from "./pages/Register.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";

function App() {
  const [page, setPage] = useState("login");
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem("access_token"));

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    setLoggedIn(false);
    setPage("login");
  };

  if (loggedIn) {
    return (
      <div>
        <nav style={{ padding: "10px", background: "#eee" }}>
          <button onClick={handleLogout}>Logout</button>
        </nav>
        <Dashboard />
      </div>
    );
  }

  return (
    <div>
      <nav style={{ padding: "10px", background: "#eee" }}>
        <button onClick={() => setPage("login")}>Login</button>
        <button onClick={() => setPage("register")}>Register</button>
      </nav>

      {page === "login" ? (
        <Login onLoginSuccess={() => setLoggedIn(true)} />
      ) : (
        <Register />
      )}
    </div>
  );
}

export default App;