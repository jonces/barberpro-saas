const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

async function api(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error del servidor");
  return data;
}

export const auth = {
  login: (body) => api("/auth/login", { method: "POST", body }),
  me: () => api("/auth/me"),
};
export const dashboard = {
  get: () => api("/dashboard"),
  superadmin: () => api("/dashboard/superadmin"),
};
export const barberias = {
  list: () => api("/barberias"),
  get: (id) => api(`/barberias/${id}`),
  create: (body) => api("/barberias", { method: "POST", body }),
  update: (id, body) => api(`/barberias/${id}`, { method: "PUT", body }),
  setEstado: (id, estado) => api(`/barberias/${id}/estado`, { method: "PATCH", body: { estado } }),
};
export const usuarios = {
  list: () => api("/usuarios"),
  create: (body) => api("/usuarios", { method: "POST", body }),
  update: (id, body) => api(`/usuarios/${id}`, { method: "PUT", body }),
  remove: (id) => api(`/usuarios/${id}`, { method: "DELETE" }),
};
export const clientes = {
  list: (q) => api(`/clientes${q ? `?q=${q}` : ""}`),
  get: (id) => api(`/clientes/${id}`),
  create: (body) => api("/clientes", { method: "POST", body }),
  update: (id, body) => api(`/clientes/${id}`, { method: "PUT", body }),
};
export const servicios = {
  list: () => api("/servicios"),
  create: (body) => api("/servicios", { method: "POST", body }),
  update: (id, body) => api(`/servicios/${id}`, { method: "PUT", body }),
  remove: (id) => api(`/servicios/${id}`, { method: "DELETE" }),
  categorias: { list: () => api("/servicios/categorias"), create: (body) => api("/servicios/categorias", { method: "POST", body }) },
};
export const productos = {
  list: () => api("/productos"),
  create: (body) => api("/productos", { method: "POST", body }),
  update: (id, body) => api(`/productos/${id}`, { method: "PUT", body }),
  remove: (id) => api(`/productos/${id}`, { method: "DELETE" }),
  ajustarStock: (id, body) => api(`/productos/${id}/stock`, { method: "POST", body }),
  categorias: { list: () => api("/productos/categorias"), create: (body) => api("/productos/categorias", { method: "POST", body }) },
};
export const ventas = {
  list: (params = {}) => api(`/ventas?${new URLSearchParams(params)}`),
  get: (id) => api(`/ventas/${id}`),
  create: (body) => api("/ventas", { method: "POST", body }),
};
export const caja = {
  activa: () => api("/caja/activa"),
  abrir: (body) => api("/caja/abrir", { method: "POST", body }),
  cerrar: (id, body) => api(`/caja/${id}/cerrar`, { method: "POST", body }),
  movimientos: (id) => api(`/caja/${id}/movimientos`),
};
export const upload = {
  file: async (file) => {
    const token = getToken();
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${BASE}/upload`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al subir archivo");
    return data;
  },
};
export const ai = {
  descripcion: (nombre, tipo = "servicio") => api("/ai/descripcion", { method: "POST", body: { nombre, tipo } }),
};
export const citas = {
  list: (params = {}) => api(`/citas?${new URLSearchParams(params)}`),
  create: (body) => api("/citas", { method: "POST", body }),
  update: (id, body) => api(`/citas/${id}`, { method: "PUT", body }),
  setEstado: (id, estado) => api(`/citas/${id}/estado`, { method: "PATCH", body: { estado } }),
};
