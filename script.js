// =====================================================
//  StockFlow — Lógica de negocio
//  Método de Costo Promedio Ponderado (CPP)
// =====================================================

const estado = {
  productos: {},
  recepciones: [],
  despachos: [],
  sortKey: null,
  sortAsc: true,
};

// ---- Helpers ----
const $ = (id) => document.getElementById(id);
const fmt = (n) => `S/${Number(n).toFixed(2)}`;
const numVal = (id) => parseFloat($(id).value) || 0;
const strVal = (id) => $(id).value.trim();
const hora = () => new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

// ---- Fecha en topbar ----
$('topbarDate').textContent = new Date().toLocaleDateString('es-PE', {
  weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
}).toUpperCase();

// ====================================================
//  NAVEGACIÓN
// ====================================================
const TITLES = {
  dashboard: 'Dashboard',
  productos: 'Nuevo Producto',
  recepcion: 'Recepción',
  despacho: 'Despacho',
  inventario: 'Inventario',
};

function switchTab(tab, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  $(`page-${tab}`).classList.add('active');
  if (el) el.classList.add('active');
  $('topbarTitle').textContent = TITLES[tab] || tab;

  if (tab === 'inventario') renderInventario();
  if (tab === 'recepcion' || tab === 'despacho') populateSelects();
  if (tab === 'dashboard') renderDashboard();

  // cerrar sidebar en móvil
  $('sidebar').classList.remove('open');
  return false;
}

function toggleSidebar() {
  $('sidebar').classList.toggle('open');
}

// ====================================================
//  STATS GLOBALES
// ====================================================
function updateGlobalStats() {
  const prods = Object.values(estado.productos);
  const totalStock = prods.reduce((s, p) => s + p.stock, 0);
  const totalValor = prods.reduce((s, p) => s + p.costo_total, 0);
  const totalMov = estado.recepciones.length + estado.despachos.length;

  // sidebar
  $('sf-productos').textContent = prods.length;
  $('sf-valor').textContent = fmt(totalValor);
  // badges
  $('badge-recepciones').textContent = estado.recepciones.length;
  $('badge-despachos').textContent = estado.despachos.length;
  // kpis dashboard
  $('kpi-productos').textContent = prods.length;
  $('kpi-unidades').textContent = totalStock;
  $('kpi-valor').textContent = fmt(totalValor);
  $('kpi-movimientos').textContent = totalMov;
}

function populateSelects() {
  ['r_codigo', 'd_codigo'].forEach(id => {
    const sel = $(id);
    const prev = sel.value;
    sel.innerHTML = '<option value="">Seleccionar producto</option>';
    Object.values(estado.productos).forEach(p => {
      const o = document.createElement('option');
      o.value = p.codigo;
      o.textContent = `${p.codigo} — ${p.nombre} (${p.stock} uds)`;
      sel.appendChild(o);
    });
    if (prev && estado.productos[prev]) sel.value = prev;
  });
}

// ====================================================
//  DASHBOARD
// ====================================================
function renderDashboard() {
  // Inventory list
  const invList = $('dash-inv-list');
  const prods = Object.values(estado.productos);
  if (prods.length === 0) {
    invList.innerHTML = '<div class="empty-dash">Registra productos para ver el estado aquí.</div>';
  } else {
    invList.innerHTML = prods.slice(0, 6).map(p => {
      const cls = p.stock === 0 ? 'out' : p.stock < 5 ? 'low' : 'ok';
      const label = p.stock === 0 ? 'Sin stock' : p.stock < 5 ? 'Stock bajo' : 'OK';
      return `
        <div class="inv-row">
          <span class="inv-row-code">${p.codigo}</span>
          <span class="inv-row-name">${p.nombre}</span>
          <span class="inv-row-stock" style="color:var(--${cls === 'ok' ? 'green' : cls === 'low' ? 'orange' : 'red'})">${p.stock} uds</span>
          <span class="status-tag ${cls}">${label}</span>
        </div>
      `;
    }).join('');
  }

  // Activity list
  const actList = $('dash-actividad');
  const allActividad = [
    ...estado.recepciones.map(r => ({ ...r, tipo: 'in' })),
    ...estado.despachos.map(d => ({ ...d, tipo: 'out' })),
  ].slice(0, 8);

  if (allActividad.length === 0) {
    actList.innerHTML = '<div class="empty-dash">Los movimientos aparecerán aquí.</div>';
  } else {
    actList.innerHTML = allActividad.map(a => `
      <div class="activity-item">
        <span class="activity-dot ${a.tipo}"></span>
        <span class="activity-text">
          <strong>${a.tipo === 'in' ? '↓ Recepción' : '↑ Despacho'}</strong> — 
          ${a.nombre} · <span style="font-family:var(--mono)">${a.tipo === 'in' ? '+' : '-'}${a.cantidad} uds</span>
        </span>
        <span class="activity-time">${a.hora}</span>
      </div>
    `).join('');
  }
}

// ====================================================
//  MÓDULO 1 — Registrar Producto
// ====================================================
function previewProducto() {
  const stock = numVal('p_stock');
  const costo = numVal('p_costo');
  const box = $('calcPreview');
  if (stock > 0 && costo > 0) {
    $('prev_total').textContent    = fmt(stock * costo);
    $('prev_promedio').textContent = fmt(costo);
    box.style.display = 'block';
  } else {
    box.style.display = 'none';
  }
}

function registrarProducto() {
  const codigo = strVal('p_codigo').toUpperCase();
  const nombre = strVal('p_nombre');
  const stock  = numVal('p_stock');
  const costo  = numVal('p_costo');

  if (!codigo || !nombre) return toast('Ingresa el código y nombre del producto.', 'error');
  if (costo <= 0) return toast('El costo unitario debe ser mayor a 0.', 'error');
  if (stock < 0)  return toast('El stock no puede ser negativo.', 'error');
  if (estado.productos[codigo]) return toast(`El código "${codigo}" ya existe.`, 'error');

  estado.productos[codigo] = { codigo, nombre, stock, costo_promedio: costo, costo_total: stock * costo };

  ['p_codigo','p_nombre','p_stock','p_costo'].forEach(id => $(id).value = '');
  $('calcPreview').style.display = 'none';

  renderProductGrid();
  populateSelects();
  updateGlobalStats();
  toast(`Producto "${nombre}" registrado correctamente.`, 'success');
}

function renderProductGrid() {
  const grid = $('productGrid');
  const prods = Object.values(estado.productos);
  if (prods.length === 0) {
    grid.innerHTML = '<div class="empty-card">Aún no hay productos. Registra el primero arriba.</div>';
    return;
  }
  grid.innerHTML = prods.map(p => `
    <div class="product-card">
      <span class="pcard-code">${p.codigo}</span>
      <div class="pcard-name">${p.nombre}</div>
      <div class="pcard-stats">
        <div class="pcard-stat">
          <span>Stock</span>
          <strong>${p.stock} uds</strong>
        </div>
        <div class="pcard-stat">
          <span>Costo prom.</span>
          <strong>${fmt(p.costo_promedio)}</strong>
        </div>
        <div class="pcard-stat" style="grid-column:1/-1">
          <span>Valor total</span>
          <strong style="color:var(--green-dark)">${fmt(p.costo_total)}</strong>
        </div>
      </div>
    </div>
  `).join('');
}

// ====================================================
//  MÓDULO 2 — Recepción
// ====================================================
function previewRecepcion() {
  const codigo = strVal('r_codigo');
  const cant   = numVal('r_cantidad');
  const costoN = numVal('r_costo');
  const panel  = $('infoRecepcion');

  if (!codigo || !estado.productos[codigo] || cant <= 0 || costoN <= 0) {
    panel.style.display = 'none'; return;
  }

  const p = estado.productos[codigo];
  const nuevoStock = p.stock + cant;
  const nuevoCT    = p.costo_total + cant * costoN;
  const nuevoCPP   = nuevoCT / nuevoStock;

  $('r_a_stock').textContent  = `${p.stock} uds`;
  $('r_a_cpp').textContent    = fmt(p.costo_promedio);
  $('r_a_total').textContent  = fmt(p.costo_total);
  $('r_d_stock').textContent  = `${nuevoStock} uds`;
  $('r_d_cpp').textContent    = fmt(nuevoCPP);
  $('r_d_total').textContent  = fmt(nuevoCT);

  panel.style.display = 'flex';
}

function registrarRecepcion() {
  const codigo = strVal('r_codigo');
  const cant   = numVal('r_cantidad');
  const costoN = numVal('r_costo');

  if (!codigo) return toast('Selecciona un producto.', 'error');
  if (!estado.productos[codigo]) return toast('Producto no encontrado.', 'error');
  if (cant <= 0) return toast('La cantidad debe ser mayor a 0.', 'error');
  if (costoN <= 0) return toast('El costo unitario debe ser mayor a 0.', 'error');

  const p = estado.productos[codigo];
  const nuevoStock = p.stock + cant;
  const nuevoCT    = p.costo_total + cant * costoN;
  const nuevoCPP   = nuevoCT / nuevoStock;

  estado.recepciones.unshift({
    codigo, nombre: p.nombre, cantidad: cant,
    costoUnit: costoN, costoTotal: cant * costoN,
    cppResultante: nuevoCPP, hora: hora()
  });

  p.stock = nuevoStock;
  p.costo_promedio = nuevoCPP;
  p.costo_total = nuevoCT;

  $('r_cantidad').value = '';
  $('r_costo').value = '';
  $('infoRecepcion').style.display = 'none';

  renderHistRecepcion();
  renderProductGrid();
  updateGlobalStats();
  toast(`Recepción confirmada: +${cant} uds de "${p.nombre}". Nuevo CPP: ${fmt(nuevoCPP)}`, 'success');
}

function renderHistRecepcion() {
  const c = $('histRecepcion');
  if (estado.recepciones.length === 0) {
    c.innerHTML = '<div class="hist-empty">No hay recepciones registradas aún.</div>';
    return;
  }
  c.innerHTML = estado.recepciones.map(r => `
    <div class="hist-item">
      <div class="hist-icon in">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v8M4 7l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      </div>
      <span class="hist-code">${r.codigo}</span>
      <div class="hist-info">
        <strong>${r.nombre}</strong>
        <span>CPP resultante: ${fmt(r.cppResultante)} · Costo unitario: ${fmt(r.costoUnit)}</span>
      </div>
      <div class="hist-amount in">
        <span class="qty">+${r.cantidad} uds</span>
        <span class="cost">${fmt(r.costoTotal)}</span>
      </div>
      <span class="hist-time">${r.hora}</span>
    </div>
  `).join('');
}

// ====================================================
//  MÓDULO 3 — Despacho
// ====================================================
function previewDespacho() {
  const codigo = strVal('d_codigo');
  const cant   = numVal('d_cantidad');
  const panel  = $('infoDespacho');
  const alert  = $('alertDespacho');

  alert.style.display = 'none';

  if (!codigo || !estado.productos[codigo] || cant <= 0) {
    panel.style.display = 'none'; return;
  }

  const p = estado.productos[codigo];
  const nuevoStock = p.stock - cant;
  const nuevoCT    = nuevoStock >= 0 ? nuevoStock * p.costo_promedio : 0;

  $('d_a_stock').textContent  = `${p.stock} uds`;
  $('d_a_cpp').textContent    = fmt(p.costo_promedio);
  $('d_a_total').textContent  = fmt(p.costo_total);

  if (nuevoStock < 0) {
    $('d_d_stock').textContent  = '⚠ Insuficiente';
    $('d_d_cpp').textContent    = '—';
    $('d_d_total').textContent  = '—';
    alert.textContent = `Stock insuficiente. Disponible: ${p.stock} uds. Solicitado: ${cant} uds.`;
    alert.style.display = 'block';
  } else {
    $('d_d_stock').textContent  = `${nuevoStock} uds`;
    $('d_d_cpp').textContent    = fmt(p.costo_promedio);
    $('d_d_total').textContent  = fmt(nuevoCT);
  }

  panel.style.display = 'flex';
}

function registrarDespacho() {
  const codigo = strVal('d_codigo');
  const cant   = numVal('d_cantidad');

  if (!codigo) return toast('Selecciona un producto.', 'error');
  if (!estado.productos[codigo]) return toast('Producto no encontrado.', 'error');
  if (cant <= 0) return toast('La cantidad debe ser mayor a 0.', 'error');

  const p = estado.productos[codigo];
  if (cant > p.stock) return toast(`Stock insuficiente. Disponible: ${p.stock} uds.`, 'error');

  const costoDespacho = cant * p.costo_promedio;

  estado.despachos.unshift({
    codigo, nombre: p.nombre, cantidad: cant,
    costoUnit: p.costo_promedio, costoTotal: costoDespacho, hora: hora()
  });

  p.stock -= cant;
  p.costo_total = p.stock * p.costo_promedio; // CPP no cambia

  $('d_cantidad').value = '';
  $('infoDespacho').style.display = 'none';
  $('alertDespacho').style.display = 'none';

  renderHistDespacho();
  renderProductGrid();
  updateGlobalStats();
  toast(`Despacho confirmado: -${cant} uds de "${p.nombre}" a ${fmt(p.costo_promedio)}/ud.`, 'warning');
}

function renderHistDespacho() {
  const c = $('histDespacho');
  if (estado.despachos.length === 0) {
    c.innerHTML = '<div class="hist-empty">No hay despachos registrados aún.</div>';
    return;
  }
  c.innerHTML = estado.despachos.map(d => `
    <div class="hist-item">
      <div class="hist-icon out">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 12V4M4 7l3-3 3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      </div>
      <span class="hist-code">${d.codigo}</span>
      <div class="hist-info">
        <strong>${d.nombre}</strong>
        <span>CPP usado: ${fmt(d.costoUnit)}</span>
      </div>
      <div class="hist-amount out">
        <span class="qty">-${d.cantidad} uds</span>
        <span class="cost">${fmt(d.costoTotal)}</span>
      </div>
      <span class="hist-time">${d.hora}</span>
    </div>
  `).join('');
}

// ====================================================
//  MÓDULO 4 — Inventario
// ====================================================
function renderInventario() {
  const query = ($('searchInv')?.value || '').toLowerCase();
  let items = Object.values(estado.productos).filter(p =>
    !query || p.codigo.toLowerCase().includes(query) || p.nombre.toLowerCase().includes(query)
  );

  if (estado.sortKey) {
    const k = estado.sortKey;
    items.sort((a, b) => {
      const va = a[k], vb = b[k];
      if (typeof va === 'string') return estado.sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
      return estado.sortAsc ? va - vb : vb - va;
    });
  }

  const tbody = $('invBody');
  if (items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-cell">${query ? `Sin resultados para "${query}"` : 'No hay productos registrados aún.'}</td></tr>`;
    return;
  }

  tbody.innerHTML = items.map(p => {
    const cls   = p.stock === 0 ? 'out' : p.stock < 5 ? 'low' : 'ok';
    const label = p.stock === 0 ? 'Sin stock' : p.stock < 5 ? 'Stock bajo' : 'Normal';
    return `
      <tr>
        <td><span class="td-code">${p.codigo}</span></td>
        <td class="td-name">${p.nombre}</td>
        <td class="td-num">${p.stock}</td>
        <td class="td-num">${fmt(p.costo_promedio)}</td>
        <td class="td-num td-total">${fmt(p.costo_total)}</td>
        <td><span class="status-tag ${cls}">${label}</span></td>
      </tr>
    `;
  }).join('');
}

function sortTable(key) {
  if (estado.sortKey === key) estado.sortAsc = !estado.sortAsc;
  else { estado.sortKey = key; estado.sortAsc = true; }

  // update arrows
  document.querySelectorAll('.sort-arrow').forEach(el => el.textContent = '↕');
  const arrow = $(`sort-${key}`);
  if (arrow) arrow.textContent = estado.sortAsc ? '↑' : '↓';

  renderInventario();
}

// ====================================================
//  EXPORTAR CSV
// ====================================================
function exportarCSV() {
  const prods = Object.values(estado.productos);
  if (prods.length === 0) return toast('No hay datos para exportar.', 'error');

  const rows = [
    ['Código', 'Nombre', 'Stock', 'Costo Promedio (S/)', 'Valor Total (S/)'],
    ...prods.map(p => [p.codigo, `"${p.nombre}"`, p.stock, p.costo_promedio.toFixed(2), p.costo_total.toFixed(2)])
  ];

  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `stockflow-inventario-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
  toast('Inventario exportado exitosamente.', 'success');
}

// ====================================================
//  TOAST
// ====================================================
let toastTimer;
function toast(msg, type = 'success') {
  const t = $('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3500);
}

// ====================================================
//  DATOS DE DEMO
// ====================================================
function cargarDemo() {
  estado.productos = {
    'LPT-001': { codigo: 'LPT-001', nombre: 'Laptop Dell Inspiron 15',   stock: 12, costo_promedio: 2850, costo_total: 34200 },
    'MON-002': { codigo: 'MON-002', nombre: 'Monitor LG 24" FHD',        stock: 25, costo_promedio: 680,  costo_total: 17000 },
    'TEC-003': { codigo: 'TEC-003', nombre: 'Teclado Mecánico Logitech', stock: 40, costo_promedio: 195,  costo_total: 7800  },
    'MOU-004': { codigo: 'MOU-004', nombre: 'Mouse Inalámbrico',         stock: 3,  costo_promedio: 90,   costo_total: 270   },
    'SSD-005': { codigo: 'SSD-005', nombre: 'SSD 1TB Samsung 870',       stock: 0,  costo_promedio: 430,  costo_total: 0     },
  };
  renderProductGrid();
  populateSelects();
  renderDashboard();
  updateGlobalStats();
  renderHistRecepcion();
  renderHistDespacho();
}

cargarDemo();
