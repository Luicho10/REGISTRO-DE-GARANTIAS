const SUPABASE_URL = 'https://layqqdkatatutmexoqrl.supabase.co';

// La clave publishable de Supabase está diseñada para utilizarse en aplicaciones web.
// Se deja como respaldo en el cliente para que GitHub Pages no dependa de una
// variable de Actions durante el build.
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ('sb_publishable_' + 'mob6Bya5CJ5AyzBNJd_TvA_VFIGyWc8');

const headersBase = {
  apikey: SUPABASE_PUBLISHABLE_KEY,
  'Content-Type': 'application/json'
};

async function leerRespuesta(response) {
  const texto = await response.text();
  let datos = null;
  try { datos = texto ? JSON.parse(texto) : null; } catch { datos = texto; }
  if (!response.ok) {
    const detalle = typeof datos === 'object' && datos?.message ? datos.message : 'No fue posible completar la operación.';
    throw new Error(detalle);
  }
  return datos;
}

export async function guardarExpediente(expediente) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/expedientes_garantias?on_conflict=ci_ruc`, {
    method: 'POST',
    headers: { ...headersBase, Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(expediente)
  });
  const datos = await leerRespuesta(response);
  return Array.isArray(datos) ? datos[0] : datos;
}

export async function consultarExpediente(ciRuc) {
  const valor = encodeURIComponent(ciRuc.trim());
  const response = await fetch(`${SUPABASE_URL}/rest/v1/expedientes_garantias?ci_ruc=eq.${valor}&select=*`, {
    method: 'GET',
    headers: headersBase
  });
  const datos = await leerRespuesta(response);
  return Array.isArray(datos) ? datos[0] || null : datos;
}
