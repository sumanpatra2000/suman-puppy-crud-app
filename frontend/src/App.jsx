import { useAuthContext } from "@asgardeo/auth-react";
import Header from "./components/Header";
import Body from "./components/Body";
import Footer from "./components/Footer";
import "./App.css";

function App() {
  const { state, signIn, signOut } = useAuthContext();

  if (state.isLoading) {
    return <p className="loading-text">Loading...</p>;
  }

  if (!state.isAuthenticated) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1 className="login-title">Puppy CRUD App</h1>
          <p className="login-subtitle">Login to manage your own puppy records</p>
          <button className="login-btn" onClick={() => signIn()}>
            Login with Asgardeo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="top-bar">
        <button className="logout-btn" onClick={() => signOut()}>
          Logout
        </button>
      </div>

      <Header />
      <Body />
      <Footer />
    </div>
  );
}

export default App;