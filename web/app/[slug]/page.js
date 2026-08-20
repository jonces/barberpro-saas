import { notFound } from "next/navigation";
import PublicBarberiaPage from "@/components/public/PublicBarberiaPage";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

async function getBarberia(slug) {
  try {
    const res = await fetch(`${BASE}/publico/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const barberia = await getBarberia(slug);
  if (!barberia) return { title: "Barbería no encontrada | BarberPro" };

  const titulo = `${barberia.nombre}${barberia.ciudad ? ` | Cortes y Barbería en ${barberia.ciudad}` : " | Barbería"}`;
  const descripcion = barberia.descripcion || `Reserva tu cita en ${barberia.nombre}. Cortes, barbas y productos de calidad profesional.`;

  return {
    title: titulo,
    description: descripcion,
    openGraph: {
      title: titulo,
      description: descripcion,
      ...(barberia.logo ? { images: [{ url: barberia.logo }] } : {}),
    },
  };
}

export default async function Page({ params }) {
  const { slug } = await params;
  const barberia = await getBarberia(slug);
  if (!barberia) notFound();

  return <PublicBarberiaPage slug={slug} inicial={barberia} />;
}
