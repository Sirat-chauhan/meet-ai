import React, { useState } from "react";

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" style={{ verticalAlign: "middle" }}>
    <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.2-1.4 3.6-5.4 3.6-3.2 0-5.9-2.7-5.9-5.9s2.7-5.9 5.9-5.9c1.8 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.4 14.5 2.4 12 2.4 6.8 2.4 2.6 6.6 2.6 11.8S6.8 21.2 12 21.2c6.9 0 9.2-4.8 9.2-7.3 0-.5 0-.9-.1-1.3H12z"/>
  </svg>
);

const GithubIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ verticalAlign: "middle" }}>
    <path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.2.8-.6v-2.2c-3.3.7-4-1.4-4-1.4-.6-1.4-1.3-1.8-1.3-1.8-1.1-.8.1-.8.1-.8 1.2.1 1.8 1.2 1.8 1.2 1.1 1.9 2.9 1.3 3.6 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.4-1.3-5.4-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.7 11.7 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.8.1 3.1.8 9.1 1.2 1.9 1.2 3.2 0 4.6-2.8 5.5-5.5 5.8.5.4.8 1.1.8 2.3v3.4c0 .3.2.7.8.6A12 12 0 0 0 12 .5z"/>
  </svg>
);

export function AuthPage({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!form.email || !form.password) {
      setError("Please fill in all required fields.");
      return;
    }
    if (mode === "signup" && form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (onLogin) onLogin();
    }, 500);
  };

  return (
    <div style={{
      minHeight: "100vh", display: "grid", placeItems: "center", padding: 20,
      background: "#f1f1ee", fontFamily: "system-ui, -apple-system, sans-serif"
    }}>
      <div style={{
        width: "min(840px, 100%)", display: "grid", gridTemplateColumns: "1.75fr 1fr",
        borderRadius: 24, overflow: "hidden", border: "1px solid #e2e5ea", background: "#fff",
        boxShadow: "0 22px 55px rgba(0, 0, 0, 0.18)"
      }}>
        {/* Left Form Pane */}
        <div style={{ padding: "48px 44px" }}>
          {mode === "login" ? (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <h1 style={{ margin: 0, fontSize: 44, fontWeight: 800, lineHeight: 1.05, color: "#101828" }}>Welcome back</h1>
              <p style={{ margin: "8px 0 26px", color: "#8b90a0", fontSize: 19 }}>Login to your account</p>

              {error && (
                <p style={{ margin: "0 0 14px", color: "#b42318", fontSize: 14 }}>{error}</p>
              )}

              <label style={{ fontSize: 14, color: "#61727b", fontWeight: 600 }}>Email</label>
              <input
                type="email"
                placeholder="m@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                style={{
                  background: "#030c08", border: "1px solid #071910", borderRadius: 12,
                  color: "#f4f8f5", fontSize: 17, padding: "14px 16px", outline: "none", width: "100%", boxSizing: "border-box"
                }}
              />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6, marginBottom: 2 }}>
                <label style={{ fontSize: 14, color: "#61727b", fontWeight: 600 }}>Password</label>
                <a href="#forgot" onClick={(e) => { e.preventDefault(); alert("Password reset link requested."); }} style={{ fontSize: 12, color: "#21ac56", fontWeight: 600, textDecoration: "none" }}>Forgot password?</a>
              </div>
              <input
                type="password"
                placeholder="********"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                style={{
                  background: "#030c08", border: "1px solid #071910", borderRadius: 12,
                  color: "#f4f8f5", fontSize: 17, padding: "14px 16px", outline: "none", width: "100%", boxSizing: "border-box"
                }}
              />

              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: 14, background: "#2fc564", color: "#03150b", borderRadius: 12,
                  fontSize: 31, fontWeight: 700, padding: "13px 18px", border: "none", cursor: "pointer", width: "100%"
                }}
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>

              <p style={{ margin: "18px 0 6px", textAlign: "center", color: "#a5abb7", fontSize: 13 }}>Or continue with</p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <a
                  href="https://siratchuahan-meet-ai.hf.space/auth/oauth/google/start"
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                    fontSize: 14, fontWeight: 600, borderRadius: 12, padding: "12px 16px",
                    border: "1px solid #e2e5ea", background: "#fff", color: "#101828", textDecoration: "none"
                  }}
                >
                  <span style={{ width: 20, height: 20, display: "inline-flex", alignItems: "center", justifyContent: "center" }}><GoogleIcon /></span>
                  <span>Continue with Google</span>
                </a>
                <a
                  href="https://siratchuahan-meet-ai.hf.space/auth/oauth/github/start"
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                    fontSize: 14, fontWeight: 600, borderRadius: 12, padding: "12px 16px",
                    border: "1px solid #e2e5ea", background: "#fff", color: "#101828", textDecoration: "none"
                  }}
                >
                  <span style={{ width: 20, height: 20, display: "inline-flex", alignItems: "center", justifyContent: "center" }}><GithubIcon /></span>
                  <span>Continue with GitHub</span>
                </a>
              </div>

              <p style={{ margin: "22px 0 0", fontSize: 14, textAlign: "center", color: "#8a919f" }}>
                Don't have an account?{" "}
                <a href="#signup" onClick={(e) => { e.preventDefault(); setMode("signup"); setError(""); }} style={{ color: "#21ac56", fontWeight: 600, textDecoration: "none" }}>Sign up</a>
              </p>
            </form>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <h1 style={{ margin: 0, fontSize: 44, fontWeight: 800, lineHeight: 1.05, color: "#101828" }}>Let's get started</h1>
              <p style={{ margin: "8px 0 26px", color: "#8b90a0", fontSize: 19 }}>Create your account</p>

              {error && (
                <p style={{ margin: "0 0 14px", color: "#b42318", fontSize: 14 }}>{error}</p>
              )}

              <label style={{ fontSize: 14, color: "#61727b", fontWeight: 600 }}>Name</label>
              <input
                type="text"
                placeholder="John Doe"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                style={{
                  background: "#030c08", border: "1px solid #071910", borderRadius: 12,
                  color: "#f4f8f5", fontSize: 17, padding: "14px 16px", outline: "none", width: "100%", boxSizing: "border-box"
                }}
              />

              <label style={{ fontSize: 14, color: "#61727b", fontWeight: 600 }}>Email</label>
              <input
                type="email"
                placeholder="m@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                style={{
                  background: "#030c08", border: "1px solid #071910", borderRadius: 12,
                  color: "#f4f8f5", fontSize: 17, padding: "14px 16px", outline: "none", width: "100%", boxSizing: "border-box"
                }}
              />

              <label style={{ fontSize: 14, color: "#61727b", fontWeight: 600 }}>Password</label>
              <input
                type="password"
                placeholder="Password (8+ chars)"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                style={{
                  background: "#030c08", border: "1px solid #071910", borderRadius: 12,
                  color: "#f4f8f5", fontSize: 17, padding: "14px 16px", outline: "none", width: "100%", boxSizing: "border-box"
                }}
              />

              <label style={{ fontSize: 14, color: "#61727b", fontWeight: 600 }}>Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm password"
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                required
                style={{
                  background: "#030c08", border: "1px solid #071910", borderRadius: 12,
                  color: "#f4f8f5", fontSize: 17, padding: "14px 16px", outline: "none", width: "100%", boxSizing: "border-box"
                }}
              />

              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: 14, background: "#2fc564", color: "#03150b", borderRadius: 12,
                  fontSize: 31, fontWeight: 700, padding: "13px 18px", border: "none", cursor: "pointer", width: "100%"
                }}
              >
                {loading ? "Creating account..." : "Create account"}
              </button>

              <p style={{ margin: "22px 0 0", fontSize: 14, textAlign: "center", color: "#8a919f" }}>
                Already have an account?{" "}
                <a href="#login" onClick={(e) => { e.preventDefault(); setMode("login"); setError(""); }} style={{ color: "#21ac56", fontWeight: 600, textDecoration: "none" }}>Log in</a>
              </p>
            </form>
          )}
        </div>

        {/* Right Brand Pane */}
        <div style={{
          background: "radial-gradient(circle at 20% 20%, #05482f 0%, #032a1d 42%, #03160f 100%)",
          display: "grid", placeItems: "center", alignContent: "center", textAlign: "center",
          color: "#fff", padding: 26
        }}>
          <div style={{
            width: 82, height: 82, borderRadius: "50%",
            background: "linear-gradient(135deg, #2dc861, #1faa50)",
            display: "grid", placeItems: "center", fontSize: 45, margin: "0 auto 12px"
          }}>🎯</div>
          <h3 style={{ margin: "0 0 10px", fontSize: 44, color: "#fff", fontWeight: 800 }}>Meet.AI</h3>
          <p style={{ margin: 0, color: "#5fc08a", lineHeight: 1.6, fontSize: 14, maxWidth: 220 }}>
            AI-powered meetings with real-time intelligence
          </p>
        </div>
      </div>
    </div>
  );
}
