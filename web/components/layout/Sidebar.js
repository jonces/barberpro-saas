"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid, ShoppingCart, CalendarDays, Users, Scissors, Package,
  Wallet, UserCog, BarChart3, Globe, ChevronDown, LogOut, Store, HandCoins,
} from "lucide-react";

const SECCIONES = [
  {
    titulo: "OPERACIÓN",
    items: [
      { href: "/dashboard", icon: LayoutGrid, label: "Dashboard" },
      { href: "/pos", icon: ShoppingCart, label: "Punto de Venta" },
      { href: "/citas", icon: CalendarDays, label: "Citas" },
      { href: "/clientes", icon: Users, label: "Clientes" },
    ],
  },
  {
    titulo: "NEGOCIO",
    items: [
      { href: "/servicios", icon: Scissors, label: "Servicios" },
      { href: "/inventario", icon: Package, label: "Inventario" },
      { href: "/caja", icon: Wallet, label: "Caja" },
    ],
  },
  {
    titulo: "PERSONAL",
    items: [
      { href: "/equipo", icon: UserCog, label: "Equipo" },
      { href: "/liquidaciones", icon: HandCoins, label: "Liquidaciones" },
    ],
  },
  {
    titulo: "ANÁLISIS",
    items: [{ href: "/reportes", icon: BarChart3, label: "Reportes" }],
  },
];
const NAV_SUPER = [{ href: "/superadmin", icon: Globe, label: "Super Admin" }];

export default function Sidebar({ open, onClose }) {
  const path = usePathname();
  const router = useRouter();

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    router.replace("/login");
  }

  const usuario = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("usuario") || "{}") : {};
  const nombreCompleto = [usuario.nombre, usuario.apellido].filter(Boolean).join(" ") || "Usuario";

  function isActive(href) {
    return path === href || path.startsWith(href + "/");
  }

  function NavLink({ href, icon: Icon, label }) {
    const active = isActive(href);
    return (
      <Link href={href} onClick={onClose} className={`nav-link${active ? " active" : ""}`}>
        <Icon size={17} strokeWidth={2} />
        {label}
      </Link>
    );
  }

  return (
    <>
      <div className={`sidebar-scrim ${open ? "open" : ""}`} onClick={onClose} />
      <aside
        className={`app-sidebar ${open ? "open" : ""}`}
        style={{
          width: 232, minHeight: "100vh", background: "rgba(9,9,10,0.74)", backdropFilter: "blur(18px)",
          borderRight: "1px solid var(--glass-border, var(--border))", display: "flex", flexDirection: "column",
          position: "fixed", top: 0, left: 0, zIndex: 50,
        }}
      >
        {/* Logo + barbería */}
        <div style={{ padding: "18px 16px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: usuario.barberia ? 14 : 0 }}>
            <Scissors size={20} color="var(--accent)" strokeWidth={2.4} />
            <p style={{ fontWeight: 700, fontSize: 16, letterSpacing: .2 }}>
              <span style={{ color: "#fff" }}>Barber</span><span style={{ color: "var(--accent)" }}>Pro</span>
            </p>
          </div>
          {usuario.barberia && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                {usuario.barberia.logo
                  ? <img src={usuario.barberia.logo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <Store size={16} color="var(--accent)" />}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{usuario.barberia.nombre}</p>
                <p style={{ fontSize: 11, color: "var(--text2)", display: "flex", alignItems: "center", gap: 4 }}>
                  <Store size={11} />{usuario.sucursal?.nombre || "Sucursal Principal"}
                  <ChevronDown size={12} />
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
          {SECCIONES.map((sec) => (
            <div key={sec.titulo} style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: .8, color: "#555", padding: "4px 12px 6px" }}>{sec.titulo}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {sec.items.map((item) => <NavLink key={item.href} {...item} />)}
              </div>
            </div>
          ))}
          {usuario.rol === "SUPERADMIN" && (
            <>
              <div style={{ height: 1, background: "var(--border)", margin: "8px 4px" }} />
              {NAV_SUPER.map((item) => <NavLink key={item.href} {...item} />)}
            </>
          )}
        </nav>

        {/* Usuario */}
        <div style={{ padding: "12px 8px", borderTop: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, marginBottom: 4 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "var(--accent)", flexShrink: 0, overflow: "hidden" }}>
              {usuario.foto ? <img src={usuario.foto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (nombreCompleto[0] || "U")}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{nombreCompleto}</p>
              <p style={{ fontSize: 11, color: "var(--text2)" }}>{usuario.rol === "ADMIN" ? "Administrador" : (usuario.rol || "")}</p>
            </div>
            <ChevronDown size={14} color="var(--text2)" />
          </div>
          <button onClick={logout} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, background: "none", border: "none", color: "var(--text2)", fontSize: 13, cursor: "pointer" }}>
            <LogOut size={15} /> Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}
