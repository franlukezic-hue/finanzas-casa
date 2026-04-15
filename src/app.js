import { sb } from './main.js'

const CATS = ['Alquiler / Hipoteca','Expensas','Supermercado','Servicios (luz, gas, agua)','Internet / Cable','Salud','Transporte','Restaurante / Delivery','Ropa','Entretenimiento','Limpieza / Hogar','Mascota','Ahorro','Otro']

let gastos = [], config = { ingresos: { el: 0, ella: 0 }, presupuestos: {} }

async function cargarGastos() {
  const { data } = await sb.from('gastos').select('*').order('fecha', { ascending: false })
  gastos = data || []
}

async function cargarConfig() {
  const { data } = await sb.from('config').select('*')
  if (data) {
    data.forEach(row => {
      try { config[row.clave] = JSON.parse(row.valor) } catch { config[row.clave] = row.valor }
    })
  }
}

async function guardarConfig() {
  const ingresos = JSON.stringify(config.ingresos)
  const presupuestos = JSON.stringify(config.presupuestos)
  await sb.from('config').upsert({ clave: 'ingresos', valor: ingresos })
  await sb.from('config').upsert({ clave: 'presupuestos', valor: presupuestos })
}

const fmt = n => Math.round(n).toLocaleString('es-AR')
const fD = d => { if (!d) return ''; const [y, m, dy] = d.split('-'); return `${dy}/${m}/${y}` }
const mL = d => { if (!d) return ''; const [y, m] = d.split('-'); return ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][+m - 1] + ' ' + y }
function addM(ds, n) { const d = new Date(ds + 'T12:00:00'); d.setMonth(d.getMonth() + n); return d.toISOString().split('T')[0] }
function aporte(g, p) { if (g.persona === p) return g.monto; if (g.persona === 'ambos') return g.monto / 2; return 0 }
function getMeses() { return [...new Set(gastos.map(g => g.fecha))].map(f => f.slice(0, 7)).filter((v, i, a) => a.indexOf(v) === i).sort().reverse() }

function sw(t) {
  document.querySelectorAll('.tab').forEach((b, i) => {
    b.classList.toggle('active', ['nuevo','cuotas-tab','gastos','resumen','comparar','config'][i] === t)
  })
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'))
  document.getElementById('tab-' + t).classList.add('active')
  if (t === 'gastos') renderGastos()
  if (t === 'resumen') renderResumen()
  if (t === 'comparar') renderComparar()
  if (t === 'config') renderConfig()
}

async function agregarGasto() {
  const monto = parseFloat(document.getElementById('monto').value)
  if (!monto || monto <= 0) { alert('Ingresá un monto válido.'); return }
  const desc = document.getElementById('descripcion').value.trim() || document.getElementById('categoria').value
  const g = {
    persona: document.getElementById('persona').value,
    categoria: document.getElementById('categoria').value,
    descripcion: desc,
    monto,
    fecha: document.getElementById('fecha').value,
    metodo: document.getElementById('metodo').value,
    tipo: document.getElementById('tipo').value,
    nota: document.getElementById('nota').value.trim(),
    es_cuota: false
  }
  await sb.from('gastos').insert(g)
  await cargarGastos()
  document.getElementById('monto').value = ''
  document.getElementById('descripcion').value = ''
  document.getElementById('nota').value = ''
  sw('gastos')
}

async function agregarCuotas() {
  const total = parseFloat(document.getElementById('cmt').value)
  const n = parseInt(document.getElementById('cn').value)
  const fecha = document.getElementById('cf').value
  if (!total || !n || !fecha) { alert('Completá todos los campos.'); return }
  const gid = Date.now()
  const desc = document.getElementById('cd').value.trim() || document.getElementById('cc').value
  const rows = []
  for (let i = 0; i < n; i++) {
    rows.push({
      persona: document.getElementById('cp').value,
      categoria: document.getElementById('cc').value,
      descripcion: `${desc} (${i + 1}/${n})`,
      monto: total / n,
      fecha: addM(fecha, i),
      metodo: document.getElementById('cm').value,
      tipo: 'fijo',
      nota: `Cuota ${i + 1} de ${n}`,
      es_cuota: true,
      grupo_id: gid
    })
  }
  await sb.from('gastos').insert(rows)
  await cargarGastos()
  document.getElementById('cmt').value = ''
  document.getElementById('cd').value = ''
  sw('gastos')
}

async function deleteG(id, grupoId, esCuota) {
  if (esCuota && grupoId) {
    if (confirm('¿Eliminar TODAS las cuotas de este gasto?\nAceptar = todas | Cancelar = solo esta')) {
      await sb.from('gastos').delete().eq('grupo_id', grupoId)
    } else {
      await sb.from('gastos').delete().eq('id', id)
    }
  } else {
    await sb.from('gastos').delete().eq('id', id)
  }
  await cargarGastos()
  renderGastos()
}

function renderGastos() {
  const fp = document.getElementById('fp').value
  const fcEl = document.getElementById('fc'); const pC = fcEl.value
  fcEl.innerHTML = '<option value="todas">Todas las categorías</option>' + [...new Set(gastos.map(g => g.categoria))].map(c => `<option ${c === pC ? 'selected' : ''}>${c}</option>`).join('')
  const fmEl = document.getElementById('fm'); const pM = fmEl.value
  const meses = getMeses()
  fmEl.innerHTML = '<option value="todos">Todos los meses</option>' + meses.map(m => `<option ${m === pM ? 'selected' : ''} value="${m}">${mL(m)}</option>`).join('')
  const fc = document.getElementById('fc').value
  const fm = document.getElementById('fm').value
  let f = gastos.filter(g => (fp === 'todos' || g.persona === fp) && (fc === 'todas' || g.categoria === fc) && (fm === 'todos' || g.fecha.startsWith(fm)))
  const li = document.getElementById('lista-gastos')
  if (!f.length) { li.innerHTML = '<div class="empty">Sin gastos.</div>'; return }
  li.innerHTML = f.map(g => `<div class="er">
    <div class="av ${g.persona === 'ella' ? 'avf' : g.persona === 'ambos' ? 'ava' : 'avm'}">${g.persona === 'el' ? 'ÉL' : g.persona === 'ella' ? 'ELLA' : 'AMB'}</div>
    <div class="ei"><div class="ed">${g.descripcion}<span class="badge ${g.es_cuota ? 'bc' : g.tipo === 'fijo' ? 'bf' : 'bv'}">${g.es_cuota ? 'cuota' : g.tipo}</span></div>
    <div class="em">${g.categoria} · ${g.metodo} · ${fD(g.fecha)}${g.nota ? ' · ' + g.nota : ''}</div></div>
    <div class="ea">$${fmt(g.monto)}</div>
    <button class="db" onclick="window._deleteG(${g.id}, ${g.grupo_id || 'null'}, ${g.es_cuota})">✕</button>
  </div>`).join('')
}

function getFiltrado(mesKey) { return mesKey && mesKey !== 'todos' ? gastos.filter(g => g.fecha.startsWith(mesKey)) : gastos }

function renderResumen() {
  const meses = getMeses()
  const rEl = document.getElementById('rmes'); const pv = rEl.value
  rEl.innerHTML = '<option value="todos">Todo el tiempo</option>' + meses.map(m => `<option ${m === pv ? 'selected' : ''} value="${m}">${mL(m)}</option>`).join('')
  const mesKey = rEl.value === 'todos' ? null : rEl.value
  const f = getFiltrado(mesKey)
  const tot = f.reduce((s, g) => s + Number(g.monto), 0)
  const tEl = f.reduce((s, g) => s + aporte(g, 'el'), 0)
  const tElla = f.reduce((s, g) => s + aporte(g, 'ella'), 0)
  const iEl = config.ingresos?.el || 0, iElla = config.ingresos?.ella || 0, iT = iEl + iElla
  document.getElementById('mcards').innerHTML = `
    <div class="mc"><div class="ml">Total hogar</div><div class="mv">$${fmt(tot)}</div><div class="ms">${f.length} gastos</div></div>
    <div class="mc"><div class="ml">Aporta él</div><div class="mv" style="color:#185FA5">$${fmt(tEl)}</div><div class="ms">${tot > 0 ? Math.round(tEl / tot * 100) : 0}%</div></div>
    <div class="mc"><div class="ml">Aporta ella</div><div class="mv" style="color:#993556">$${fmt(tElla)}</div><div class="ms">${tot > 0 ? Math.round(tElla / tot * 100) : 0}%</div></div>`
  let im = ''
  if (iEl || iElla) {
    const pEl = iEl > 0 ? Math.min(Math.round(tEl / iEl * 100), 999) : 0
    const pElla = iElla > 0 ? Math.min(Math.round(tElla / iElla * 100), 999) : 0
    const pT = iT > 0 ? Math.min(Math.round(tot / iT * 100), 999) : 0
    im = `<div class="mg"><div class="mc"><div class="ml">% sueldo él</div><div class="mv ${pEl > 80 ? 'over' : 'ok'}">${pEl}%</div><div class="ms">$${fmt(tEl)} / $${fmt(iEl)}</div></div>
    <div class="mc"><div class="ml">% sueldo ella</div><div class="mv ${pElla > 80 ? 'over' : 'ok'}">${pElla}%</div><div class="ms">$${fmt(tElla)} / $${fmt(iElla)}</div></div>
    <div class="mc"><div class="ml">% ingresos casa</div><div class="mv ${pT > 80 ? 'over' : 'ok'}">${pT}%</div><div class="ms">$${fmt(tot)} / $${fmt(iT)}</div></div></div>`
  }
  document.getElementById('ingmeter').innerHTML = im
  let dh = ''
  ;['el', 'ella'].forEach(p => {
    const rows = f.filter(g => g.persona === p || g.persona === 'ambos')
    if (!rows.length) return
    const pt = rows.reduce((s, g) => s + aporte(g, p), 0)
    const pcs = {}; rows.forEach(g => { pcs[g.categoria] = (pcs[g.categoria] || 0) + aporte(g, p) })
    const pct = tot > 0 ? Math.round(pt / tot * 100) : 0
    dh += `<div style="margin-bottom:1.2rem;">
      <div class="ir" style="margin-bottom:5px;"><div class="av ${p === 'ella' ? 'avf' : 'avm'}">${p === 'el' ? 'ÉL' : 'ELLA'}</div><span style="font-size:13px;font-weight:500;">${p === 'el' ? 'Él' : 'Ella'} — $${fmt(pt)}</span></div>
      <div class="pw"><div class="pi" style="width:${pct}%;background:${p === 'el' ? '#378ADD' : '#D4537E'}"></div></div>
      ${Object.entries(pcs).sort((a, b) => b[1] - a[1]).map(([c, v]) => `<div class="pb"><span>${c}</span><span>$${fmt(v)}</span></div>`).join('')}
      <div class="pb"><span>Total</span><span>$${fmt(pt)}</span></div>
    </div>`
  })
  document.getElementById('resdet').innerHTML = dh || '<div class="empty">Sin datos.</div>'
  const presp = config.presupuestos || {}
  let ah = ''
  const als = []
  CATS.forEach(cat => {
    const lim = parseFloat(presp[cat]) || 0; if (!lim) return
    const gast = f.filter(g => g.categoria === cat).reduce((s, g) => s + Number(g.monto), 0)
    const pct = Math.round(gast / lim * 100)
    const col = pct >= 100 ? '#A32D2D' : pct >= 80 ? '#854F0B' : '#3B6D11'
    als.push(`<div style="margin-bottom:7px;font-size:11px;"><div style="display:flex;justify-content:space-between;margin-bottom:2px;"><span>${cat}</span><span style="color:${col};font-weight:500;">$${fmt(gast)} / $${fmt(lim)} (${pct}%)</span></div><div class="pw" style="margin:0;"><div class="pi" style="width:${Math.min(pct, 100)}%;background:${col};"></div></div></div>`)
  })
  if (als.length) ah = `<hr class="dv"><div class="st">Presupuesto por categoría</div>${als.join('')}`
  document.getElementById('balerts').innerHTML = ah
}

function renderComparar() {
  const meses = getMeses()
  const aEl = document.getElementById('cmpA'); const bEl = document.getElementById('cmpB')
  const pA = aEl.value, pB = bEl.value
  aEl.innerHTML = '<option value="">— elegir —</option>' + meses.map(m => `<option value="${m}" ${m === pA ? 'selected' : ''}>${mL(m)}</option>`).join('')
  bEl.innerHTML = '<option value="">— elegir —</option>' + meses.map(m => `<option value="${m}" ${m === pB ? 'selected' : ''}>${mL(m)}</option>`).join('')
  const mA = aEl.value, mB = bEl.value
  if (!mA || !mB) { document.getElementById('cmp-result').innerHTML = '<div class="empty">Seleccioná dos meses para comparar.</div>'; return }
  const fA = gastos.filter(g => g.fecha.startsWith(mA))
  const fB = gastos.filter(g => g.fecha.startsWith(mB))
  const tA = fA.reduce((s, g) => s + Number(g.monto), 0)
  const tB = fB.reduce((s, g) => s + Number(g.monto), 0)
  const diff = tB - tA
  const diffPct = tA > 0 ? Math.round(Math.abs(diff) / tA * 100) : 0
  const diffStr = diff === 0 ? 'Sin cambio' : diff > 0 ? `+$${fmt(Math.abs(diff))} (+${diffPct}%)` : `-$${fmt(Math.abs(diff))} (-${diffPct}%)`
  const diffCol = diff === 0 ? '#888' : diff > 0 ? '#A32D2D' : '#3B6D11'
  const allCats = [...new Set([...fA, ...fB].map(g => g.categoria))]
  const catRows = allCats.map(cat => {
    const vA = fA.filter(g => g.categoria === cat).reduce((s, g) => s + Number(g.monto), 0)
    const vB = fB.filter(g => g.categoria === cat).reduce((s, g) => s + Number(g.monto), 0)
    const d = vB - vA
    const cls = d > 0 ? 'diff-up' : d < 0 ? 'diff-down' : 'diff-eq'
    const ds = d === 0 ? '—' : d > 0 ? `+$${fmt(Math.abs(d))}` : `-$${fmt(Math.abs(d))}`
    return `<div class="diff-row"><span>${cat}</span><span>$${fmt(vA)}</span><span>$${fmt(vB)}</span><span class="${cls}">${ds}</span></div>`
  }).join('')
  document.getElementById('cmp-result').innerHTML = `
    <div class="cmp-grid">
      <div class="cmp-card"><div class="cmp-title">${mL(mA)}</div><div class="cmp-total" style="color:#185FA5">$${fmt(tA)}</div>
        <div style="font-size:11px;color:#666;">Él: $${fmt(fA.reduce((s, g) => s + aporte(g, 'el'), 0))}</div>
        <div style="font-size:11px;color:#666;">Ella: $${fmt(fA.reduce((s, g) => s + aporte(g, 'ella'), 0))}</div>
      </div>
      <div class="cmp-card"><div class="cmp-title">${mL(mB)}</div><div class="cmp-total" style="color:#993556">$${fmt(tB)}</div>
        <div style="font-size:11px;color:#666;">Él: $${fmt(fB.reduce((s, g) => s + aporte(g, 'el'), 0))}</div>
        <div style="font-size:11px;color:#666;">Ella: $${fmt(fB.reduce((s, g) => s + aporte(g, 'ella'), 0))}</div>
      </div>
    </div>
    <div style="text-align:center;margin-bottom:.8rem;font-size:13px;color:${diffCol};font-weight:500;">${mL(mB)} vs ${mL(mA)}: ${diffStr}</div>
    <div style="display:grid;grid-template-columns:1fr auto auto auto;gap:6px;font-size:11px;color:#888;padding:4px 0;border-bottom:1px solid #eee;margin-bottom:2px;">
      <span>Categoría</span><span>${mL(mA)}</span><span>${mL(mB)}</span><span>Dif.</span>
    </div>${catRows}`
}

function renderConfig() {
  document.getElementById('iel').value = config.ingresos?.el || ''
  document.getElementById('iella').value = config.ingresos?.ella || ''
  document.getElementById('bconfig').innerHTML = CATS.map(cat => `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:7px;">
      <span style="font-size:11px;color:#666;min-width:160px;">${cat}</span>
      <input type="number" placeholder="Sin límite" value="${config.presupuestos?.[cat] || ''}" oninput="window._updatePresup('${cat}', this.value)" style="width:120px;" />
    </div>`).join('')
}

async function saveConfig() {
  config.ingresos = { el: parseFloat(document.getElementById('iel').value) || 0, ella: parseFloat(document.getElementById('iella').value) || 0 }
  await guardarConfig()
  alert('Configuración guardada.')
}

window._deleteG = deleteG
window._updatePresup = (cat, val) => { config.presupuestos[cat] = parseFloat(val) || 0 }
window.sw = sw
window.agregarGasto = agregarGasto
window.agregarCuotas = agregarCuotas
window.saveConfig = saveConfig
window.renderComparar = renderComparar
window.renderResumen = renderResumen

async function init() {
  document.getElementById('app').innerHTML = await getHTML()
  document.getElementById('fecha').value = new Date().toISOString().split('T')[0]
  document.getElementById('cf').value = new Date().toISOString().split('T')[0]
  await cargarConfig()
  await cargarGastos()
}

function getHTML() {
  return `<div class="app">
<div class="tabs">
  <button class="tab active" onclick="sw('nuevo')">+ Gasto</button>
  <button class="tab" onclick="sw('cuotas-tab')">+ Cuotas</button>
  <button class="tab" onclick="sw('gastos')">Gastos</button>
  <button class="tab" onclick="sw('resumen')">Resumen</button>
  <button class="tab" onclick="sw('comparar')">Comparar</button>
  <button class="tab" onclick="sw('config')">Config</button>
</div>
<div class="section active" id="tab-nuevo">
  <div class="form-grid">
    <div class="fg"><label>¿Quién pagó?</label><select id="persona"><option value="el">Él</option><option value="ella">Ella</option><option value="ambos">Ambos</option></select></div>
    <div class="fg"><label>Categoría</label><select id="categoria">${CATS.map(c => `<option>${c}</option>`).join('')}</select></div>
    <div class="fg full"><label>Descripción</label><input type="text" id="descripcion" placeholder="Ej: Alquiler abril" /></div>
    <div class="fg"><label>Monto ($)</label><input type="number" id="monto" placeholder="0" min="0" step="1" /></div>
    <div class="fg"><label>Fecha</label><input type="date" id="fecha" /></div>
    <div class="fg"><label>Método de pago</label><select id="metodo"><option>Efectivo</option><option>Débito</option><option>Crédito</option><option>Transferencia</option><option>Billetera virtual</option></select></div>
    <div class="fg"><label>Tipo</label><select id="tipo"><option value="fijo">Fijo</option><option value="variable">Variable</option></select></div>
    <div class="fg full"><label>Nota (opcional)</label><input type="text" id="nota" placeholder="Observaciones..." /></div>
  </div>
  <button class="btn" onclick="agregarGasto()">Agregar gasto</button>
</div>
<div class="section" id="tab-cuotas-tab">
  <div class="ci">Al cargar en cuotas, la app genera una entrada por mes automáticamente.</div>
  <div class="form-grid">
    <div class="fg"><label>¿Quién pagó?</label><select id="cp"><option value="el">Él</option><option value="ella">Ella</option><option value="ambos">Ambos</option></select></div>
    <div class="fg"><label>Categoría</label><select id="cc">${CATS.map(c => `<option>${c}</option>`).join('')}</select></div>
    <div class="fg full"><label>Descripción</label><input type="text" id="cd" placeholder="Ej: Heladera nueva" /></div>
    <div class="fg"><label>Monto total ($)</label><input type="number" id="cmt" placeholder="0" min="0" step="1" /></div>
    <div class="fg"><label>Cantidad de cuotas</label><input type="number" id="cn" value="12" min="2" max="120" /></div>
    <div class="fg"><label>Fecha 1ra cuota</label><input type="date" id="cf" /></div>
    <div class="fg"><label>Método de pago</label><select id="cm"><option>Efectivo</option><option>Débito</option><option selected>Crédito</option><option>Transferencia</option><option>Billetera virtual</option></select></div>
  </div>
  <button class="btn" onclick="agregarCuotas()">Generar cuotas</button>
</div>
<div class="section" id="tab-gastos">
  <div class="fr">
    <select id="fp" onchange="renderGastos()"><option value="todos">Todos</option><option value="el">Él</option><option value="ella">Ella</option><option value="ambos">Ambos</option></select>
    <select id="fc" onchange="renderGastos()"><option value="todas">Todas las categorías</option></select>
    <select id="fm" onchange="renderGastos()"><option value="todos">Todos los meses</option></select>
  </div>
  <div id="lista-gastos"></div>
</div>
<div class="section" id="tab-resumen">
  <div class="ms-sel"><label>Período:</label><select id="rmes" onchange="renderResumen()"><option value="todos">Todo el tiempo</option></select></div>
  <div class="mg" id="mcards"></div>
  <div id="ingmeter"></div>
  <hr class="dv">
  <div id="resdet"></div>
  <div id="balerts"></div>
</div>
<div class="section" id="tab-comparar">
  <div class="sel-row">
    <label>Mes A:</label><select id="cmpA" onchange="renderComparar()"><option value="">— elegir —</option></select>
    <label>Mes B:</label><select id="cmpB" onchange="renderComparar()"><option value="">— elegir —</option></select>
  </div>
  <div id="cmp-result"></div>
</div>
<div class="section" id="tab-config">
  <div class="st">Ingresos mensuales</div>
  <div class="ir"><div class="av avm">ÉL</div><span>Él</span><input type="number" id="iel" placeholder="0" style="flex:1;" /></div>
  <div class="ir"><div class="av avf">ELLA</div><span>Ella</span><input type="number" id="iella" placeholder="0" style="flex:1;" /></div>
  <hr class="dv">
  <div class="st">Presupuesto mensual por categoría</div>
  <div id="bconfig"></div>
  <button class="btn" onclick="saveConfig()">Guardar configuración</button>
</div>
</div>`
}

init()