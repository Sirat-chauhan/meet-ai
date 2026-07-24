import React from "react";
import { COLORS } from "../../utils/constants";

export const Button = ({ children, onClick, variant = "primary", style: s }) => (
  <button onClick={onClick} style={{
    padding: "10px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer",
    border: variant === "primary" ? "none" : `1px solid ${COLORS.border}`,
    background: variant === "primary" ? COLORS.green : "transparent",
    color: variant === "primary" ? "#0a0f0a" : COLORS.muted,
    transition: "all 0.2s", fontFamily: "inherit", ...s
  }}>{children}</button>
);
