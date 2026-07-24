import React, { useState } from "react";
import { COLORS } from "../utils/constants";
import { Input } from "../components/ui/Input";
import { Button as Btn } from "../components/ui/Button";

export function AuthPage({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "John Doe", email: "john.doe@test.com", password: "••••••••", confirm: "••••••••" });

  return (
    <div style={{
      minHeight: "100vh", background: "#f4f4f0", display: "flex", alignItems: "center",
      justifyContent: "center", padding: 20
    }}>
      <div style={{
        display: "flex", borderRadius: 20, overflow: "hidden", width: "100%", maxWidth: 760,
        boxShadow: "0 32px 80px #0004"
      }}>
        <div style={{ flex: 1, background: "#fff", padding: "48px 40px" }}>
          {mode === "login" ? (
            <>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: "#111", margin: "0 0 6px" }}>Welcome back</h1>
              <p style={{ color: "#888", fontSize: 14, margin: "0 0 32px" }}>Login to your account</p>
              <Input label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="m@example.com" />
              <Input label="Password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} placeholder="••••••••" />
              <Btn onClick={onLogin} style={{ width: "100%", padding: "13px 20px", borderRadius: 8, fontSize: 15 }}>Sign in</Btn>
              <div style={{ textAlign: "center", margin: "20px 0", color: "#aaa", fontSize: 13 }}>Or continue with</div>
              <div style={{ display: "flex", gap: 12 }}>
                {["G", "⌥"].map((icon) => (
                  <button key={icon} style={{
                    flex: 1, padding: "11px", background: "#fff", border: "1px solid #e0e0e0",
                    borderRadius: 8, fontSize: 18, cursor: "pointer"
                  }}>{icon}</button>
                ))}
              </div>
              <p style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: "#888" }}>
                Don't have an account?{" "}
                <button onClick={() => setMode("signup")} style={{ background: "none", border: "none", color: COLORS.green, cursor: "pointer", fontWeight: 600, fontSize: 14 }}>Sign up</button>
              </p>
            </>
          ) : (
            <>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: "#111", margin: "0 0 6px" }}>Let's get started</h1>
              <p style={{ color: "#888", fontSize: 14, margin: "0 0 32px" }}>Create your account</p>
              <Input label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="John Doe" />
              <Input label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="m@example.com" />
              <Input label="Password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} />
              <Input label="Confirm Password" value={form.confirm} onChange={(v) => setForm({ ...form, confirm: v })} />
              <Btn onClick={onLogin} style={{ width: "100%", padding: "13px 20px", borderRadius: 8, fontSize: 15 }}>Sign up</Btn>
              <div style={{ textAlign: "center", margin: "20px 0", color: "#aaa", fontSize: 13 }}>Or continue with</div>
              <div style={{ display: "flex", gap: 10 }}>
                {["🍎", "G", "∞"].map((icon) => (
                  <button key={icon} style={{
                    flex: 1, padding: "11px", background: "#fff", border: "1px solid #e0e0e0",
                    borderRadius: 8, fontSize: 18, cursor: "pointer"
                  }}>{icon}</button>
                ))}
              </div>
              <p style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: "#888" }}>
                Already have an account?{" "}
                <button onClick={() => setMode("login")} style={{ background: "none", border: "none", color: COLORS.green, cursor: "pointer", fontWeight: 600, fontSize: 14 }}>Sign in</button>
              </p>
            </>
          )}
        </div>
        <div style={{
          width: 280, background: "linear-gradient(160deg, #0d2015 0%, #0a1a0f 100%)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "linear-gradient(135deg, #22c55e, #16a34a)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36
          }}>🎯</div>
          <span style={{ color: "#e8f5e9", fontSize: 24, fontWeight: 800, letterSpacing: "-0.5px" }}>Meet.AI</span>
          <p style={{ color: "#4ade8088", fontSize: 13, textAlign: "center", padding: "0 24px", lineHeight: 1.6 }}>
            AI-powered meetings with real-time intelligence
          </p>
        </div>
      </div>
    </div>
  );
}
