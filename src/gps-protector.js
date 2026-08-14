const normalizar = texto => String(texto || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function setterInput(input, valor) {
  if (!input) return;
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  if (setter) setter.call(input, String(valor ?? ''));
  else input.value = String(valor ?? '');
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

function obtenerCampos() {
  const gps = document.querySelector('.gps-grid');
  if (!gps) return null;
  const labels = [...gps.querySelectorAll('label')];
  const buscarInput = texto => labels.find(label => normalizar(label.firstChild?.textContent || label.textContent).includes(texto))?.querySelector('input') || null;
  const latitud = buscarInput('latitud');
  const longitud = buscarInput('longitud');
  const clienteCard = document.querySelectorAll('.card')[0];
  const clienteLabels = clienteCard ? [...clienteCard.querySelectorAll('label')] : [];
  const buscarCliente = texto => clienteLabels.find(label => normalizar(label.firstChild?.textContent || label.textContent).includes(texto))?.querySelector('input') || null;
  return {
    latitud,
    longitud,
    direccion: buscarCliente('direccion'),
    departamento: buscarCliente('departamento'),
    ciudad: buscarCliente('ciudad / distrito') || buscarCliente('ciudad')
  };
}

async function buscarSinMoverCoordenadas(boton) {
  const campos = obtenerCampos();
  if (!campos?.latitud || !campos?.longitud) {
    window.alert('No se encontraron los campos de Latitud y Longitud.');
    return;
  }

  const latOriginal = String(campos.latitud.value || '').trim();
  const lonOriginal = String(campos.longitud.value || '').trim();
  const lat = Number(latOriginal.replace(',', '.'));
  const lon = Number(lonOriginal.replace(',', '.'));

  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    window.alert('Ingrese una latitud y longitud válidas antes de buscar.');
    return;
  }

  const textoOriginal = boton.textContent;
  boton.disabled = true;
  boton.textContent = 'Buscando ubicación...';

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&zoom=18&addressdetails=1&accept-language=es`;
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Servicio de ubicación respondió ${response.status}.`);

    const data = await response.json();
    const a = data.address || {};
    const ciudad = a.city || a.town || a.village || a.municipality || a.county || a.suburb || a.locality || '';
    const departamento = a.state || a.state_district || a.region || a.county || '';
    const direccion = data.display_name || [a.road, a.house_number, a.neighbourhood, a.suburb].filter(Boolean).join(', ');

    if (direccion) setterInput(campos.direccion, direccion);
    if (departamento) setterInput(campos.departamento, departamento);
    if (ciudad) setterInput(campos.ciudad, ciudad);

    // Regla fundamental: la búsqueda inversa NO puede reemplazar las coordenadas ingresadas.
    setterInput(campos.latitud, latOriginal);
    setterInput(campos.longitud, lonOriginal);

    const panel = document.querySelector('.pluscode-panel');
    const status = panel?.querySelector('[data-plus-status]');
    if (status) status.textContent = `Ubicación encontrada. Coordenadas preservadas: ${latOriginal}, ${lonOriginal}.`;
  } catch (error) {
    const panel = document.querySelector('.pluscode-panel');
    const status = panel?.querySelector('[data-plus-status]');
    if (status) status.textContent = `No fue posible buscar la ubicación. ${error?.message || 'Intente nuevamente.'}`;
    else window.alert(`No fue posible buscar la ubicación. ${error?.message || 'Intente nuevamente.'}`);
  } finally {
    boton.disabled = false;
    boton.textContent = textoOriginal;
  }
}

function protegerBotonBusqueda() {
  const botones = [...document.querySelectorAll('.gps-search-row button')];
  const boton = botones.find(b => normalizar(b.textContent).includes('buscar ubicacion por coordenadas'));
  if (!boton || boton.dataset.gpsProtegido === 'true') return;

  const reemplazo = boton.cloneNode(true);
  reemplazo.dataset.gpsProtegido = 'true';
  boton.replaceWith(reemplazo);
  reemplazo.addEventListener('click', evento => {
    evento.preventDefault();
    evento.stopPropagation();
    evento.stopImmediatePropagation();
    buscarSinMoverCoordenadas(reemplazo);
  });
}

function iniciarProteccionGPS() {
  protegerBotonBusqueda();
  const observer = new MutationObserver(() => protegerBotonBusqueda());
  observer.observe(document.getElementById('root') || document.body, { childList: true, subtree: true });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciarProteccionGPS);
else iniciarProteccionGPS();
