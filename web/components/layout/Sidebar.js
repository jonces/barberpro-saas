"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  { href: "/dashboard", icon: "▦", label: "Dashboard" },
  { href: "/pos", icon: "🖥", label: "Punto de Venta" },
  { href: "/citas", icon: "📅", label: "Citas" },
  { href: "/clientes", icon: "👤", label: "Clientes" },
  { href: "/servicios", icon: "✂️", label: "Servicios" },
  { href: "/inventario", icon: "📦", label: "Inventario" },
  { href: "/caja", icon: "💰", label: "Caja" },
  { href: "/equipo", icon: "👥", label: "Equipo" },
  { href: "/reportes", icon: "📊", label: "Reportes" },
];
const NAV_SUPER = [
  { href: "/superadmin", icon: "🌐", label: "Super Admin" },
];

export default function Sidebar() {
  const path = usePathname();
  const router = useRouter();

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    router.replace("/login");
  }

  const usuario = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("usuario") || "{}") : {};

  return (
    <aside style={{ width: 220, minHeight: "100vh", background: "var(--surface)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, zIndex: 50 }}>
      {/* Logo */}
      <div style={{ padding: "20px 16px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>✂️</div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>BarberPro</p>
            <p style={{ fontSize: 11, color: "var(--text2)" }}>{usuario.barberia?.nombre || "Panel"}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
        {NAV.map(item => {
          const active = path === item.href || path.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
              borderRadius: 8, fontSize: 14, fontWeight: active ? 600 : 400, textDecoration: "none",
              background: active ? "var(--accent-dim)" : "transparent",
              color: active ? "var(--accent)" : "var(--text2)",
              transition: "all .15s",
            }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
        {usuario.rol === "SUPERADMIN" && (
          <>
            <div style={{ height: 1, background: "var(--border)", margin: "8px 4px" }} />
            {NAV_SUPER.map(item => {
              const active = path === item.href || path.startsWith(item.href + "/");
              return (
                <Link key={item.href} href={item.href} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
                  borderRadius: 8, fontSize: 14, fontWeight: active ? 600 : 400, textDecoration: "none",
                  background: active ? "var(--accent-dim)" : "transparent",
                  color: active ? "var(--accent)" : "var(--text2)",
                  transition: "all .15s",
                }}>
                  <span style={{ fontSize: 16 }}>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Usuario */}
      <div style={{ padding: "12px 8px", borderTop: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, marginBottom: 4 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#333", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "var(--accent)" }}>
            {(usuario.nombre || "U")[0]}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{usuario.nombre || "Usuario"}</p>
            <p style={{ fontSize: 11, color: "var(--text2)" }}>{usuario.rol || ""}</p>
          </div>
        </div>
        <button onClick={logout} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, background: "none", border: "none", color: "var(--text2)", fontSize: 13, cursor: "pointer" }}>
          ↩ Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
