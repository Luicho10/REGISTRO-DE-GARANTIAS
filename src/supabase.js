const SUPABASE_URL = 'https://layqqdkatatutmexoqrl.supabase.co';

// Clave publishable de Supabase para el cliente web.
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

// Las nuevas claves sb_publishable_* deben viajar mediante el encabezado
// apikey. No se envían como Bearer JWT.
const headersBase = {
  apikey: SUPABASE_PUBLISHABLE_KEY,
  'Content-Type': 'application/json'
};

async function leerRespuesta(response) {
  const texto = await response.text();
  let datos = null;
  try {
    datos = texto ? JSON.parse(texto) : null;
  } catch {
    datos = texto;
  }

  if (!response.ok) {
    const detalle =
      typeof datos === 'object' && datos?.message
        ? datos.message
        : typeof datos === 'object' && datos?.error_description
          ? datos.error_description
          : typeof datos === 'object' && datos?.error
            ? datos.error
            : `Error Supabase (${response.status}).`;
    throw new Error(detalle);
  }

  return datos;
}

export async function guardarExpediente(expediente) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/expedientes_garantias?on_conflict=ci_ruc`,
    {
      method: 'POST',
      headers: {
        ...headersBase,
        Prefer: 'resolution=merge-duplicates,return=representation'
      },
      body: JSON.stringify(expediente)
    }
  );

  const datos = await leerRespuesta(response);
  return Array.isArray(datos) ? datos[0] : datos;
}

export async function consultarExpediente(ciRuc) {
  const valor = encodeURIComponent(ciRuc.trim());
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/expedientes_garantias?ci_ruc=eq.${valor}&select=*`,
    {
      method: 'GET',
      headers: headersBase
    }
  );

  const datos = await leerRespuesta(response);
  return Array.isArray(datos) ? datos[0] || null : datos;
}
