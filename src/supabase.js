const SUPABASE_URL = 'https://layqqdkatatutmexoqrl.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_mob6Bya5CJ5AyzBNJd_TvA_VFIGyWc8';

const headersBase = {
  apikey: SUPABASE_PUBLISHABLE_KEY,
  Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
  'Content-Type': 'application/json'
};

export async function guardarExpediente(expediente) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/expedientes_garantias?on_conflict=ci_ruc`, {
    method: 'POST',
    headers: {
      ...headersBase,
      Prefer: 'resolution=merge-duplicates,return=representation'
    },
    body: JSON.stringify(expediente)
  });

  const texto = await response.text();
  let datos = null;
  try {
    datos = texto ? JSON.parse(texto) : null;
  } catch {
    datos = texto;
  }

  if (!response.ok) {
    const detalle = typeof datos === 'object' && datos?.message ? datos.message : 'No fue posible guardar el expediente.';
    throw new Error(detalle);
  }

  return Array.isArray(datos) ? datos[0] : datos;
}
