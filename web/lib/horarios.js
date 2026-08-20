// Cálculo de horario/estado "abierto ahora" para la página pública.
// Asume zona horaria fija (Nicaragua) porque Barberia no tiene campo de timezone en el schema.
export const TIMEZONE = "America/Managua";
const OFFSET_MANAGUA = "-06:00"; // Nicaragua no observa horario de verano
const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const DIA_CORTO = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function ahoraEnZona() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE, weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(now);
  const map = {};
  parts.forEach((p) => { map[p.type] = p.value; });
  return { diaSemana: DIA_CORTO[map.weekday], horaMin: Number(map.hour) * 60 + Number(map.minute) };
}

function toMin(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function formatearHora(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

export function nombreDia(diaSemana) {
  return DIAS[diaSemana];
}

export function ordenarHorarios(horarios) {
  return [...horarios].sort((a, b) => a.diaSemana - b.diaSemana);
}

// Construye un ISO string con el offset fijo de Nicaragua para que la hora elegida
// (que siempre es "hora local de la barbería") no se reinterprete con la zona del
// navegador o del servidor al guardarla.
export function aIsoManagua(fechaStr, horaStr) {
  return `${fechaStr}T${horaStr}:00${OFFSET_MANAGUA}`;
}

export function calcularEstado(horarios) {
  if (!horarios || horarios.length === 0) return { abierto: null, texto: null };
  const { diaSemana, horaMin } = ahoraEnZona();

  const hoy = horarios.find((h) => h.diaSemana === diaSemana);
  if (hoy?.abierto) {
    const ini = toMin(hoy.apertura);
    const fin = toMin(hoy.cierre);
    if (horaMin >= ini && horaMin < fin) return { abierto: true, texto: "Abierto ahora" };
  }

  for (let i = 0; i < 7; i++) {
    const dia = (diaSemana + i) % 7;
    const h = horarios.find((x) => x.diaSemana === dia);
    if (!h?.abierto) continue;
    if (i === 0 && horaMin >= toMin(h.apertura)) continue;
    const etiqueta = i === 0 ? "hoy" : i === 1 ? "mañana" : nombreDia(dia);
    return { abierto: false, texto: `Cerrado — abre ${etiqueta} ${formatearHora(h.apertura)}` };
  }
  return { abierto: false, texto: "Cerrado" };
}
