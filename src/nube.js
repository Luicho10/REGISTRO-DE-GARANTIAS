const URL_BASE = 'https://layqqdkatatutmexoqrl.supabase.co';
const CLAVE_PUBLICA = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
const encabezados = { apikey: CLAVE_PUBLICA, Authorization: `Bearer ${CLAVE_PUBLICA}`, 'Content-Type': 'application/json' };

async function respuesta(r) {
  const t = await r.text();
  let d = null;
  try { d = t ? JSON.parse(t) : null; } catch { d = t; }
  if (!r.ok) throw new Error(typeof d === 'object' && d?.message ? d.message : 'No fue posible completar la operación.');
  return d;
}

export async function guardarExpediente(expediente) {
  if (!CLAVE_PUBLICA) throw new Error('Falta configurar la clave pública para el despliegue.');
  const r = await fetch(`${URL_BASE}/rest/v1/expedientes_garantias?on_conflict=ci_ruc`, {
    method: 'POST', headers: { ...encabezados, Prefer: 'resolution=merge-duplicates,return=representation' }, body: JSON.stringify(expediente)
  });
  const d = await respuesta(r);
  return Array.isArray(d) ? d[0] : d;
}

export async function consultarExpediente(ciRuc) {
  if (!CLAVE_PUBLICA) throw new Error('Falta configurar la clave pública para el despliegue.');
  const r = await fetch(`${URL_BASE}/rest/v1/expedientes_garantias?ci_ruc=eq.${encodeURIComponent(ciRuc.trim())}&select=*`, { headers: encabezados });
  const d = await respuesta(r);
  return Array.isArray(d) ? d[0] || null : d;
}
