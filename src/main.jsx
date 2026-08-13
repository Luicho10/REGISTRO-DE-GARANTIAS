import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles.css';
import { guardarExpediente, consultarExpediente } from './nube.js';

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

function cargarLeaflet() {
  return new Promise((resolve, reject) => {
    if (window.L) return resolve(window.L);
    if (!document.querySelector('link[data-leaflet]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = LEAFLET_CSS;
      link.dataset.leaflet = 'true';
      document.head.appendChild(link);
    }
    const existente = document.querySelector('script[data-leaflet]');
    if (existente) {
      existente.addEventListener('load', () => resolve(window.L));
      existente.addEventListener('error', reject);
      return;
    }
    const script = document.createElement('script');
    script.src = LEAFLET_JS;
    script.async = true;
    script.dataset.leaflet = 'true';
    script.onload = () => resolve(window.L);
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

function numeroValido(v) {
  return v !== '' && Number.isFinite(Number(v));
}

function ponerValor(input, valor) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  if (setter) setter.call(input, valor);
  else input.value = valor;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

function ponerControl(control, valor) {
  const proto = control.tagName === 'SELECT' ? HTMLSelectElement.prototype : control.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  if (setter) setter.call(control, valor ?? '');
  else control.value = valor ?? '';
  control.dispatchEvent(new Event('input', { bubbles: true }));
  control.dispatchEvent(new Event('change', { bubbles: true }));
}

function leerFormulario() {
  const secciones = document.querySelectorAll('.card');
  const clienteCard = secciones[0];
  const clienteControls = clienteCard ? [...clienteCard.querySelectorAll('input')] : [];
  const cliente = {
    nombre: clienteControls[0]?.value || '', ciRuc: clienteControls[1]?.value || '', telefono: clienteControls[2]?.value || '',
    responsable: clienteControls[3]?.value || '', direccion: clienteControls[4]?.value || '', departamento: clienteControls[5]?.value || '',
    ciudad: clienteControls[6]?.value || '', fecha: clienteControls[7]?.value || '', latitud: '', longitud: ''
  };
  const gpsCard = secciones[1];
  const gpsControls = gpsCard ? [...gpsCard.querySelectorAll('input')] : [];
  cliente.latitud = gpsControls[0]?.value || '';
  cliente.longitud = gpsControls[1]?.value || '';

  const garantias = [...document.querySelectorAll('.garantia-card')].map(card => {
    const controls = [...card.querySelectorAll('input, select, textarea')];
    const tipo = controls[0]?.value || 'Cheque';
    const observaciones = controls[1]?.value || '';
    return { tipo, observaciones, controles: controls.slice(2).map(c => c.value || '') };
  });
  return { cliente, garantias };
}

async function restaurarFormulario(datos) {
  if (!datos) return;
  const cliente = datos.cliente || {};
  const clienteCard = document.querySelectorAll('.card')[0];
  const clienteControls = clienteCard ? [...clienteCard.querySelectorAll('input')] : [];
  const valoresCliente = [cliente.nombre, cliente.ciRuc, cliente.telefono, cliente.responsable, cliente.direccion, cliente.departamento, cliente.ciudad, cliente.fecha];
  clienteControls.slice(0, 8).forEach((c, i) => ponerControl(c, valoresCliente[i] || ''));
  const gpsCard = document.querySelectorAll('.card')[1];
  const gpsControls = gpsCard ? [...gpsCard.querySelectorAll('input')] : [];
  ponerControl(gpsControls[0], cliente.latitud || '');
  ponerControl(gpsControls[1], cliente.longitud || '');

  const garantias = Array.isArray(datos.garantias) && datos.garantias.length ? datos.garantias : [];
  const esperar = ms => new Promise(resolve => setTimeout(resolve, ms));
  let cards = [...document.querySelectorAll('.garantia-card')];
  while (cards.length < garantias.length) {
    const boton = [...document.querySelectorAll('.btn')].find(b => b.textContent.includes('Agregar garantía'));
    if (!boton) break;
    boton.click();
    await esperar(120);
    cards = [...document.querySelectorAll('.garantia-card')];
  }
  while (cards.length > garantias.length && cards.length > 1) {
    const botonEliminar = cards[cards.length - 1]?.querySelector('.delete-btn');
    if (!botonEliminar) break;
    botonEliminar.click();
    await esperar(120);
    cards = [...document.querySelectorAll('.garantia-card')];
  }

  for (let i = 0; i < garantias.length; i++) {
    cards = [...document.querySelectorAll('.garantia-card')];
    const card = cards[i];
    const datosGarantia = garantias[i];
    if (!card) continue;
    const controls = [...card.querySelectorAll('input, select, textarea')];
    if (controls[0]) {
      ponerControl(controls[0], datosGarantia.tipo || 'Cheque');
      await esperar(80);
    }
    const controlesActualizados = [...card.querySelectorAll('input, select, textarea')];
    if (controlesActualizados[1]) ponerControl(controlesActualizados[1], datosGarantia.observaciones || '');
    const valores = Array.isArray(datosGarantia.controles) ? datosGarantia.controles : [];
    controlesActualizados.slice(2).forEach((c, n) => ponerControl(c, valores[n] || ''));
  }
}

function crearBotonesPersistencia() {
  if (document.querySelector('.nube-actions')) return;
  const topbar = document.querySelector('.topbar');
  if (!topbar) return;
  const imprimir = topbar.querySelector('.btn-print');
  const acciones = document.createElement('div');
  acciones.className = 'nube-actions no-print';
  acciones.style.display = 'flex';
  acciones.style.gap = '8px';
  acciones.style.alignItems = 'center';

  const consultar = document.createElement('button');
  consultar.className = 'btn btn-secondary';
  consultar.textContent = 'Consultar por CI / RUC';
  consultar.type = 'button';
  consultar.onclick = async () => {
    const ci = window.prompt('Ingrese el CI / RUC del cliente:');
    if (!ci || !ci.trim()) return;
    consultar.disabled = true;
    consultar.textContent = 'Consultando...';
    try {
      const expediente = await consultarExpediente(ci);
      if (!expediente) {
        window.alert('No se encontró un expediente con ese CI / RUC.');
        return;
      }
      await restaurarFormulario(expediente.datos_formulario || {});
      window.alert('Expediente cargado correctamente.');
    } catch (error) {
      window.alert(`No fue posible consultar el expediente. ${error.message}`);
    } finally {
      consultar.disabled = false;
      consultar.textContent = 'Consultar por CI / RUC';
    }
  };

  const guardar = document.createElement('button');
  guardar.className = 'btn btn-primary';
  guardar.textContent = 'Guardar formulario';
  guardar.type = 'button';
  guardar.onclick = async () => {
    const datos = leerFormulario();
    const ci = (datos.cliente.ciRuc || '').trim();
    if (!ci) {
      window.alert('Ingrese el CI / RUC antes de guardar.');
      return;
    }
    guardar.disabled = true;
    guardar.textContent = 'Guardando...';
    try {
      await guardarExpediente({
        ci_ruc: ci,
        cliente_razon_social: datos.cliente.nombre,
        telefono: datos.cliente.telefono,
        responsable_ejecutivo: datos.cliente.responsable,
        direccion: datos.cliente.direccion,
        departamento: datos.cliente.departamento,
        ciudad_distrito: datos.cliente.ciudad,
        latitud: datos.cliente.latitud !== '' ? Number(datos.cliente.latitud) : null,
        longitud: datos.cliente.longitud !== '' ? Number(datos.cliente.longitud) : null,
        fecha_registro: datos.cliente.fecha || null,
        datos_formulario: datos
      });
      window.alert('Expediente guardado correctamente.');
    } catch (error) {
      window.alert(`No fue posible guardar el expediente. ${error.message}`);
    } finally {
      guardar.disabled = false;
      guardar.textContent = 'Guardar formulario';
    }
  };

  acciones.appendChild(consultar);
  acciones.appendChild(guardar);
  if (imprimir) imprimir.parentNode.insertBefore(acciones, imprimir);
  else topbar.appendChild(acciones);
}

function instalarMapaGPS() {
  const grid = document.querySelector('.gps-grid');
  if (!grid || grid.querySelector('.gps-map-wrapper')) return;

  const inputs = grid.querySelectorAll('input');
  if (inputs.length < 2) return;
  const latInput = inputs[0];
  const lngInput = inputs[1];

  const wrapper = document.createElement('div');
  wrapper.className = 'gps-map-wrapper wide';
  wrapper.innerHTML = `
    <div class="gps-map-heading">
      <div>
        <strong>VERIFICACIÓN DE UBICACIÓN</strong>
        <span>Haga clic sobre el mapa para marcar manualmente la ubicación.</span>
      </div>
      <span class="gps-map-badge">Mapa interactivo</span>
    </div>
    <div class="gps-map" aria-label="Mapa para verificar y seleccionar ubicación"></div>
    <div class="gps-map-help">La posición del marcador se sincroniza con Latitud y Longitud. También se actualizará cuando utilice «Obtener ubicación actual».</div>
  `;
  grid.appendChild(wrapper);

  cargarLeaflet().then(L => {
    const mapElement = wrapper.querySelector('.gps-map');
    const lat = numeroValido(latInput.value) ? Number(latInput.value) : -23.4425;
    const lng = numeroValido(lngInput.value) ? Number(lngInput.value) : -58.4438;
    const zoom = numeroValido(latInput.value) && numeroValido(lngInput.value) ? 16 : 6;

    const map = L.map(mapElement, { scrollWheelZoom: true }).setView([lat, lng], zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    let marker = null;
    const actualizarMarcador = (centrar = false) => {
      if (!numeroValido(latInput.value) || !numeroValido(lngInput.value)) return;
      const nueva = [Number(latInput.value), Number(lngInput.value)];
      if (!marker) marker = L.marker(nueva, { draggable: true }).addTo(map);
      else marker.setLatLng(nueva);
      marker.bindPopup(`Ubicación registrada<br><strong>${nueva[0].toFixed(6)}, ${nueva[1].toFixed(6)}</strong>`);
      if (centrar) map.setView(nueva, 17);
    };

    actualizarMarcador();
    map.on('click', e => {
      const lat = e.latlng.lat.toFixed(6);
      const lng = e.latlng.lng.toFixed(6);
      ponerValor(latInput, lat);
      ponerValor(lngInput, lng);
      actualizarMarcador(false);
      if (marker) marker.openPopup();
    });

    const sincronizarDesdeInputs = () => {
      if (numeroValido(latInput.value) && numeroValido(lngInput.value)) actualizarMarcador(false);
    };
    latInput.addEventListener('input', sincronizarDesdeInputs);
    lngInput.addEventListener('input', sincronizarDesdeInputs);

    marker?.on('dragend', () => {
      const p = marker.getLatLng();
      ponerValor(latInput, p.lat.toFixed(6));
      ponerValor(lngInput, p.lng.toFixed(6));
    });

    let ultima = `${latInput.value}|${lngInput.value}`;
    const timer = window.setInterval(() => {
      const actual = `${latInput.value}|${lngInput.value}`;
      if (actual !== ultima) {
        ultima = actual;
        actualizarMarcador(true);
      }
    }, 700);

    wrapper.dataset.mapReady = 'true';
    wrapper._gpsCleanup = () => window.clearInterval(timer);
    setTimeout(() => map.invalidateSize(), 100);
  }).catch(() => {
    wrapper.querySelector('.gps-map').innerHTML = '<div class="gps-map-error">No se pudo cargar el mapa. Verifique su conexión a Internet.</div>';
  });
}

function iniciarMapaGPS() {
  instalarMapaGPS();
  crearBotonesPersistencia();
  const observer = new MutationObserver(() => {
    instalarMapaGPS();
    crearBotonesPersistencia();
  });
  observer.observe(document.getElementById('root'), { childList: true, subtree: true });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

window.addEventListener('load', () => setTimeout(iniciarMapaGPS, 250));
