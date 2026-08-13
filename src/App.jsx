import { useState } from 'react';

const tiposGarantia = [
  'Cheque',
  'Pagaré',
  'Contrato de granos',
  'Codeudoría solidaria',
  'Garantía real'
];

const garantiaInicial = {
  tipo: 'Cheque',
  descripcion: '',
  importe: '',
  vencimiento: '',
  observaciones: ''
};

export default function App() {
  const [cliente, setCliente] = useState({
    nombre: '',
    ciRuc: '',
    telefono: '',
    direccion: '',
    departamento: '',
    ciudad: '',
    latitud: '',
    longitud: '',
    responsable: '',
    fecha: new Date().toISOString().slice(0, 10)
  });

  const [garantias, setGarantias] = useState([garantiaInicial]);
  const [mensaje, setMensaje] = useState('');

  const cambiarCliente = (campo, valor) => {
    setCliente((actual) => ({ ...actual, [campo]: valor }));
  };

  const cambiarGarantia = (indice, campo, valor) => {
    setGarantias((actuales) => actuales.map((g, i) =>
      i === indice ? { ...g, [campo]: valor } : g
    ));
  };

  const agregarGarantia = () => {
    setGarantias((actuales) => [...actuales, { ...garantiaInicial }]);
  };

  const eliminarGarantia = (indice) => {
    setGarantias((actuales) => actuales.filter((_, i) => i !== indice));
  };

  const obtenerGPS = () => {
    if (!navigator.geolocation) {
      setMensaje('El navegador no permite obtener la ubicación GPS.');
      return;
    }

    setMensaje('Obteniendo ubicación...');
    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        setCliente((actual) => ({
          ...actual,
          latitud: posicion.coords.latitude.toFixed(6),
          longitud: posicion.coords.longitude.toFixed(6)
        }));
        setMensaje('Ubicación obtenida correctamente.');
      },
      () => setMensaje('No fue posible obtener la ubicación. Verifique el permiso del navegador.')
    );
  };

  const imprimir = () => window.print();

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <div className="brand">REGISTRO DE GARANTÍAS</div>
          <div className="subtitle">Registro ordenado de clientes, garantías y documentación</div>
        </div>
        <button className="btn btn-print no-print" onClick={imprimir}>Imprimir / PDF</button>
      </header>

      <main className="container">
        <section className="hero">
          <h1>REGISTRO DE GARANTÍAS</h1>
          <p>Ficha integral del cliente y sus garantías respaldatorias.</p>
        </section>

        <section className="card">
          <div className="section-title">1. IDENTIFICACIÓN DEL CLIENTE</div>
          <div className="form-grid">
            <label>Cliente / Razón Social<input value={cliente.nombre} onChange={(e) => cambiarCliente('nombre', e.target.value)} /></label>
            <label>CI / RUC<input value={cliente.ciRuc} onChange={(e) => cambiarCliente('ciRuc', e.target.value)} /></label>
            <label>Teléfono<input value={cliente.telefono} onChange={(e) => cambiarCliente('telefono', e.target.value)} /></label>
            <label>Responsable / Ejecutivo<input value={cliente.responsable} onChange={(e) => cambiarCliente('responsable', e.target.value)} /></label>
            <label className="wide">Dirección<input value={cliente.direccion} onChange={(e) => cambiarCliente('direccion', e.target.value)} /></label>
            <label>Departamento<input value={cliente.departamento} onChange={(e) => cambiarCliente('departamento', e.target.value)} /></label>
            <label>Ciudad / Distrito<input value={cliente.ciudad} onChange={(e) => cambiarCliente('ciudad', e.target.value)} /></label>
            <label>Fecha de registro<input type="date" value={cliente.fecha} onChange={(e) => cambiarCliente('fecha', e.target.value)} /></label>
          </div>
        </section>

        <section className="card">
          <div className="section-title gps-title">
            <span>2. UBICACIÓN GPS</span>
            <button className="btn btn-secondary no-print" onClick={obtenerGPS}>Obtener ubicación actual</button>
          </div>
          <div className="form-grid gps-grid">
            <label>Latitud<input value={cliente.latitud} onChange={(e) => cambiarCliente('latitud', e.target.value)} placeholder="Ej.: -25.2867" /></label>
            <label>Longitud<input value={cliente.longitud} onChange={(e) => cambiarCliente('longitud', e.target.value)} placeholder="Ej.: -57.6470" /></label>
            <div className="gps-status">{mensaje || 'Puede ingresar las coordenadas manualmente o utilizar el GPS del dispositivo.'}</div>
          </div>
        </section>

        <section className="card">
          <div className="section-title actions-title">
            <span>3. GARANTÍAS REGISTRADAS</span>
            <button className="btn btn-primary no-print" onClick={agregarGarantia}>+ Agregar garantía</button>
          </div>

          <div className="garantias-list">
            {garantias.map((garantia, indice) => (
              <div className="garantia-card" key={indice}>
                <div className="garantia-header">
                  <strong>Garantía {indice + 1}</strong>
                  {garantias.length > 1 && (
                    <button className="delete-btn no-print" onClick={() => eliminarGarantia(indice)}>×</button>
                  )}
                </div>
                <div className="form-grid">
                  <label>Tipo de garantía
                    <select value={garantia.tipo} onChange={(e) => cambiarGarantia(indice, 'tipo', e.target.value)}>
                      {tiposGarantia.map((tipo) => <option key={tipo}>{tipo}</option>)}
                    </select>
                  </label>
                  <label>Importe / Valor<input value={garantia.importe} onChange={(e) => cambiarGarantia(indice, 'importe', e.target.value)} placeholder="Importe de la garantía" /></label>
                  <label>Vencimiento<input type="date" value={garantia.vencimiento} onChange={(e) => cambiarGarantia(indice, 'vencimiento', e.target.value)} /></label>
                  <label className="wide">Descripción / Referencia<input value={garantia.descripcion} onChange={(e) => cambiarGarantia(indice, 'descripcion', e.target.value)} placeholder="Número, banco, finca, contrato, etc." /></label>
                  <label className="wide">Observaciones<textarea value={garantia.observaciones} onChange={(e) => cambiarGarantia(indice, 'observaciones', e.target.value)} rows="2" /></label>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card summary-card">
          <div className="section-title">4. RESUMEN DEL EXPEDIENTE</div>
          <div className="summary-header">
            <div><span>Cliente</span><strong>{cliente.nombre || '—'}</strong></div>
            <div><span>CI / RUC</span><strong>{cliente.ciRuc || '—'}</strong></div>
            <div><span>Ubicación</span><strong>{cliente.ciudad || cliente.departamento || '—'}</strong></div>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>#</th><th>Tipo</th><th>Descripción / Referencia</th><th>Importe / Valor</th><th>Vencimiento</th></tr></thead>
              <tbody>
                {garantias.map((g, i) => (
                  <tr key={i}><td>{i + 1}</td><td>{g.tipo}</td><td>{g.descripcion || '—'}</td><td>{g.importe || '—'}</td><td>{g.vencimiento || '—'}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="footer-actions no-print">
          <button className="btn btn-primary" onClick={imprimir}>Imprimir / PDF</button>
        </div>
      </main>

      <footer>Registro de Garantías · Versión 1.0</footer>
    </div>
  );
}
