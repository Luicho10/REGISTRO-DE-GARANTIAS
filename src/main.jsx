import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

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
      if (numeroValido(latInput.value) && numeroValido(lngInput.value)) {
        actualizarMarcador(false);
      }
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
  const observer = new MutationObserver(() => instalarMapaGPS());
  observer.observe(document.getElementById('root'), { childList: true, subtree: true });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

window.addEventListener('load', () => setTimeout(iniciarMapaGPS, 250));
