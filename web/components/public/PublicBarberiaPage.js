"use client";
import { useEffect, useState } from "react";
import { Scissors } from "lucide-react";
import { publico } from "@/lib/api";
import { T } from "./theme";
import PublicHeader from "./PublicHeader";
import PublicHero from "./PublicHero";
import PublicQuickInfo from "./PublicQuickInfo";
import PublicServicios from "./PublicServicios";
import PublicProductos from "./PublicProductos";
import PublicBarberos from "./PublicBarberos";
import PublicGaleria from "./PublicGaleria";
import PublicUbicacionHorario from "./PublicUbicacionHorario";
import PublicContacto from "./PublicContacto";
import CartSidebar from "./CartSidebar";
import CartMobileBar from "./CartMobileBar";
import CartBottomSheet from "./CartBottomSheet";
import BookingFlow from "./BookingFlow";
import { WhatsAppCard, TrustPanel, ReservaCTA } from "./PublicSidebarExtras";

export default function PublicBarberiaPage({ slug, inicial }) {
  const [barberia, setBarberia] = useState(inicial || null);
  const [servicios, setServicios] = useState([]);
  const [productos, setProductos] = useState([]);
  const [barberos, setBarberos] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [seleccionados, setSeleccionados] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [vista, setVista] = useState("pagina");
  const [barberoPreferido, setBarberoPreferido] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [loading, setLoading] = useState(!inicial);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      inicial ? Promise.resolve(inicial) : publico.get(slug),
      publico.servicios(slug),
      publico.productos(slug),
      publico.barberos(slug),
      publico.horarios(slug),
    ]).then(([b, s, p, ba, h]) => {
      setBarberia(b);
      setServicios(s);
      setProductos(p);
      setBarberos(ba);
      setHorarios(h);
    }).catch((e) => setError(e.message)).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  function toggleServicio(s) {
    setSeleccionados((prev) => (prev.find((x) => x.id === s.id) ? prev.filter((x) => x.id !== s.id) : [...prev, s]));
  }
  function toggleProducto(p) {
    setCarrito((prev) => (prev.find((x) => x.id === p.id) ? prev.filter((x) => x.id !== p.id) : [...prev, p]));
  }

  function irAReserva(barbero) {
    setBarberoPreferido(barbero || null);
    setVista("reserva");
    setSheetOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function volverAPagina() {
    setVista("pagina");
    setBarberoPreferido(null);
  }

  function irASeccion(id) {
    if (vista !== "pagina") setVista("pagina");
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, vista !== "pagina" ? 60 : 0);
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: T.bg }}>
        <Scissors size={26} color="var(--accent)" className="auth-spin" />
      </div>
    );
  }

  if (error || !barberia) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: T.bg, color: T.text, textAlign: "center", padding: 24 }}>
        <Scissors size={40} color="var(--accent)" style={{ marginBottom: 16 }} />
        <h1 style={{ fontSize: 20, marginBottom: 8 }}>Barbería no encontrada</h1>
        <p style={{ color: T.text2, fontSize: 14 }}>{error}</p>
      </div>
    );
  }

  const cartCount = seleccionados.length + carrito.length;

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "system-ui, sans-serif" }}>
      <PublicHeader barberia={barberia} cartCount={cartCount} onCartClick={() => setSheetOpen(true)} onNav={irASeccion} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 20px" }}>
        {vista === "reserva" ? (
          <BookingFlow
            slug={slug}
            servicios={servicios}
            barberos={barberos}
            horarios={horarios}
            seleccionados={seleccionados}
            carrito={carrito}
            barberoPreferido={barberoPreferido}
            onToggleServicio={toggleServicio}
            onVolver={volverAPagina}
            onCompletado={() => { setSeleccionados([]); setCarrito([]); volverAPagina(); }}
          />
        ) : (
          <div className="public-main-grid" style={{ display: "grid", gap: 28, alignItems: "start", paddingBottom: 40 }}>
            <div>
              <PublicHero barberia={barberia} onReservar={() => irAReserva(null)} onVerServicios={() => irASeccion("servicios")} />
              <PublicQuickInfo />
              <PublicServicios servicios={servicios} seleccionados={seleccionados} onToggle={toggleServicio} />
              <PublicProductos productos={productos} carrito={carrito} onToggle={toggleProducto} />
              <PublicBarberos barberos={barberos} onReservar={irAReserva} />
              <PublicGaleria fotos={barberia?.configuracion?.galeria} />
              <PublicUbicacionHorario barberia={barberia} horarios={horarios} />
              <PublicContacto barberia={barberia} />
            </div>

            <div className="public-sidebar-col" style={{ position: "sticky", top: 82, display: "flex", flexDirection: "column", gap: 14 }}>
              <CartSidebar
                seleccionados={seleccionados}
                carrito={carrito}
                onQuitarServicio={toggleServicio}
                onQuitarProducto={toggleProducto}
                onContinuar={() => irAReserva(null)}
              />
              <WhatsAppCard barberia={barberia} />
              <TrustPanel />
              <ReservaCTA onClick={() => irAReserva(null)} />
            </div>
          </div>
        )}
      </div>

      <footer style={{ borderTop: `1px solid ${T.border}`, marginTop: 20 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "20px 20px 90px", textAlign: "center" }}>
          <p style={{ fontSize: 12, color: T.text2, margin: 0 }}>{barberia.nombre} · powered by BarberPro</p>
        </div>
      </footer>

      <CartMobileBar seleccionados={seleccionados} carrito={carrito} onOpen={() => setSheetOpen(true)} />
      <CartBottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        seleccionados={seleccionados}
        carrito={carrito}
        onQuitarServicio={toggleServicio}
        onQuitarProducto={toggleProducto}
        onContinuar={() => irAReserva(null)}
      />
    </div>
  );
}
