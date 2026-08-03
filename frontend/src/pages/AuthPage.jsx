import React, { useState } from "react";
import { COLORS } from "../utils/constants";
import { Input } from "../components/ui/Input";
import { Button as Btn } from "../components/ui/Button";

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
    }, 600);
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#f4f4f0", display: "flex", alignItems: "center",
      justifyContent: "center", padding: 20, fontFamily: "system-ui, -apple-system, sans-serif"
    }}>
      <div style={{
        display: "flex", borderRadius: 20, overflow: "hidden", width: "100%", maxWidth: 780,
        boxShadow: "0 32px 80px rgba(0,0,0,0.12)", background: "#fff"
      }}>
        <div style={{ flex: 1, padding: "48px 40px" }}>
          {mode === "login" ? (
            <form onSubmit={handleSubmit}>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: "#111", margin: "0 0 6px" }}>Welcome back</h1>
              <p style={{ color: "#666", fontSize: 14, margin: "0 0 28px" }}>Login to your account</p>

              {error && (
                <div style={{
                  padding: "10px 14px", borderRadius: 8, background: "#fef2f2", color: "#b91c1c",
                  fontSize: 13, marginBottom: 18, border: "1px solid #fecaca"
                }}>
                  {error}
                </div>
              )}

              <Input label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="m@example.com" type="email" />
              
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>Password</label>
                  <a href="#forgot" onClick={(e) => { e.preventDefault(); alert("Password reset link requested."); }} style={{ fontSize: 12, color: "#16a34a", fontWeight: 600, textDecoration: "none" }}>Forgot password?</a>
                </div>
                <Input value={form.password} onChange={(v) => setForm({ ...form, password: v })} placeholder="••••••••" type="password" />
              </div>

              <Btn type="submit" disabled={loading} style={{ width: "100%", padding: "13px 20px", borderRadius: 8, fontSize: 15, fontWeight: 600, marginTop: 8 }}>
                {loading ? "Signing in..." : "Sign in"}
              </Btn>

              <div style={{ textAlign: "center", margin: "20px 0", color: "#888", fontSize: 13, display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ flex: 1, height: 1, background: "#e5e7eb" }}></span>
                <span>Or continue with</span>
                <span style={{ flex: 1, height: 1, background: "#e5e7eb" }}></span>
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button type="button" onClick={() => window.location.href = "https://siratchuahan-meet-ai.hf.space/auth/oauth/google/start"} style={{
                  flex: 1, padding: "11px", background: "#fff", border: "1px solid #d1d5db",
                  borderRadius: 8, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center",
                  justifyContent: "center", gap: 8, fontWeight: 500, color: "#374151"
                }}>
                  <GoogleIcon /> Google
                </button>
                <button type="button" onClick={() => window.location.href = "https://siratchuahan-meet-ai.hf.space/auth/oauth/github/start"} style={{
                  flex: 1, padding: "11px", background: "#fff", border: "1px solid #d1d5db",
                  borderRadius: 8, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center",
                  justifyContent: "center", gap: 8, fontWeight: 500, color: "#374151"
                }}>
                  <GithubIcon /> GitHub
                </button>
              </div>

              <p style={{ textAlign: "center", marginTop: 28, fontSize: 14, color: "#666" }}>
                Don't have an account?{" "}
                <button type="button" onClick={() => { setMode("signup"); setError(""); }} style={{ background: "none", border: "none", color: "#16a34a", cursor: "pointer", fontWeight: 600, fontSize: 14 }}>Sign up</button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleSubmit}>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: "#111", margin: "0 0 6px" }}>Let's get started</h1>
              <p style={{ color: "#666", fontSize: 14, margin: "0 0 28px" }}>Create your account</p>

              {error && (
                <div style={{
                  padding: "10px 14px", borderRadius: 8, background: "#fef2f2", color: "#b91c1c",
                  fontSize: 13, marginBottom: 18, border: "1px solid #fecaca"
                }}>
                  {error}
                </div>
              )}

              <Input label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="John Doe" />
              <Input label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="m@example.com" type="email" />
              <Input label="Password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} placeholder="Password (8+ chars)" type="password" />
              <Input label="Confirm Password" value={form.confirm} onChange={(v) => setForm({ ...form, confirm: v })} placeholder="Confirm password" type="password" />

              <Btn type="submit" disabled={loading} style={{ width: "100%", padding: "13px 20px", borderRadius: 8, fontSize: 15, fontWeight: 600, marginTop: 8 }}>
                {loading ? "Creating account..." : "Create account"}
              </Btn>

              <div style={{ textAlign: "center", margin: "20px 0", color: "#888", fontSize: 13, display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ flex: 1, height: 1, background: "#e5e7eb" }}></span>
                <span>Or continue with</span>
                <span style={{ flex: 1, height: 1, background: "#e5e7eb" }}></span>
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button type="button" onClick={() => window.location.href = "https://siratchuahan-meet-ai.hf.space/auth/oauth/google/start"} style={{
                  flex: 1, padding: "11px", background: "#fff", border: "1px solid #d1d5db",
                  borderRadius: 8, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center",
                  justifyContent: "center", gap: 8, fontWeight: 500, color: "#374151"
                }}>
                  <GoogleIcon /> Google
                </button>
                <button type="button" onClick={() => window.location.href = "https://siratchuahan-meet-ai.hf.space/auth/oauth/github/start"} style={{
                  flex: 1, padding: "11px", background: "#fff", border: "1px solid #d1d5db",
                  borderRadius: 8, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center",
                  justifyContent: "center", gap: 8, fontWeight: 500, color: "#374151"
                }}>
                  <GithubIcon /> GitHub
                </button>
              </div>

              <p style={{ textAlign: "center", marginTop: 28, fontSize: 14, color: "#666" }}>
                Already have an account?{" "}
                <button type="button" onClick={() => { setMode("login"); setError(""); }} style={{ background: "none", border: "none", color: "#16a34a", cursor: "pointer", fontWeight: 600, fontSize: 14 }}>Sign in</button>
              </p>
            </form>
          )}
        </div>
        <div style={{
          width: 300, background: "linear-gradient(160deg, #0d2015 0%, #0a1a0f 100%)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16,
          padding: 24
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "linear-gradient(135deg, #22c55e, #16a34a)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36,
            boxShadow: "0 10px 25px rgba(34, 197, 94, 0.3)"
          }}>🎯</div>
          <span style={{ color: "#ffffff", fontSize: 26, fontWeight: 800, letterSpacing: "-0.5px" }}>Meet.AI</span>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, textAlign: "center", padding: "0 12px", lineHeight: 1.6 }}>
            AI-powered meetings with real-time intelligence
          </p>
        </div>
      </div>
    </div>
  );
}
