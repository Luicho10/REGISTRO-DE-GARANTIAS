const SUPABASE_URL = 'https://layqqdkatatutmexoqrl.supabase.co';

// Clave PUBLICABLE de Supabase.
// Se deja un respaldo explícito porque GitHub Pages estaba compilando
// el valor de la variable VITE_SUPABASE_PUBLISHABLE_KEY como
// "sb_publishable_...", provocando el error "Invalid API key".
const CLAVE_PUBLICA_FIJA = 'sb_publishable_mob6Bya5CJ5AyzBNJd_TvA_VFIGyWc8';
const CLAVE_PUBLICA_ENV = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
const SUPABASE_PUBLISHABLE_KEY =
  CLAVE_PUBLICA_ENV && CLAVE_PUBLICA_ENV !== 'sb_publishable_...'
    ? CLAVE_PUBLICA_ENV
    : CLAVE_PUBLICA_FIJA;

// Las claves sb_publishable_* se envían mediante el encabezado apikey.
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
