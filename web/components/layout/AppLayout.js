"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";

export default function AppLayout({ children, title, actions }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.replace("/login");
    else setReady(true);
  }, []);

  if (!ready) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <div style={{ width: 32, height: 32, border: "2px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: 220, padding: 28, minHeight: "100vh" }}>
        {(title || actions) && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            {title && <h1 style={{ fontSize: 22, fontWeight: 700 }}>{title}</h1>}
            {actions && <div style={{ display: "flex", gap: 10 }}>{actions}</div>}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
