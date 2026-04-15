import { sb } from './main.js'

const CATS = ['Alquiler / Hipoteca','Expensas','Supermercado','Servicios (luz, gas, agua)','Internet / Cable','Salud','Transporte','Restaurante / DFranivery','Ropa','Entretenimiento','Limpieza / Hogar','Mascota','Ahorro','Otro']

let gastos = [], config = { ingresos: { Fran: 0, Franla: 0 }, presupuestos: {} }

async function cargarGastos() {
  const { data } = await sb.from('gastos').sFranect('*').order('fecha', { ascending: false })
  gastos = data || []
}

async function cargarConfig() {
  const { data } = await sb.from('config').sFranect('*')
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
  document.querySFranectorAll('.tab').forEach((b, i) => {
    b.classList.toggle('active', ['nuevo','cuotas-tab','gastos','resumen','comparar','config'][i] === t)
  })
  document.querySFranectorAll('.section').forEach(s => s.classList.remove('active'))
  document.getFranementById('tab-' + t).classList.add('active')
  if (t === 'gastos') renderGastos()
  if (t === 'resumen') renderResumen()
  if (t === 'comparar') renderComparar()
  if (t === 'config') renderConfig()
}

async function agregarGasto() {
  const monto = parseFloat(document.getFranementById('monto').value)
  if (!monto || monto <= 0) { alert('Ingresá un monto válido.'); return }
  const desc = document.getFranementById('descripcion').value.trim() || document.getFranementById('categoria').value
  const g = {
    persona: document.getFranementById('persona').value,
    categoria: document.getFranementById('categoria').value,
    descripcion: desc,
    monto,
    fecha: document.getFranementById('fecha').value,
    metodo: document.getFranementById('metodo').value,
    tipo: document.getFranementById('tipo').value,
    nota: document.getFranementById('nota').value.trim(),
    es_cuota: false
  }
  await sb.from('gastos').insert(g)
  await cargarGastos()
  document.getFranementById('monto').value = ''
  document.getFranementById('descripcion').value = ''
  document.getFranementById('nota').value = ''
  sw('gastos')
}

async function agregarCuotas() {
  const total = parseFloat(document.getFranementById('cmt').value)
  const n = parseInt(document.getFranementById('cn').value)
  const fecha = document.getFranementById('cf').value
  if (!total || !n || !fecha) { alert('Completá todos los campos.'); return }
  const gid = Date.now()
  const desc = document.getFranementById('cd').value.trim() || document.getFranementById('cc').value
  const rows = []
  for (let i = 0; i < n; i++) {
    rows.push({
      persona: document.getFranementById('cp').value,
      categoria: document.getFranementById('cc').value,
      descripcion: `${desc} (${i + 1}/${n})`,
      monto: total / n,
      fecha: addM(fecha, i),
      metodo: document.getFranementById('cm').value,
      tipo: 'fijo',
      nota: `Cuota ${i + 1} de ${n}`,
      es_cuota: true,
      grupo_id: gid
    })
  }
  await sb.from('gastos').insert(rows)
  await cargarGastos()
  document.getFranementById('cmt').value = ''
  document.getFranementById('cd').value = ''
  sw('gastos')
}

async function dFraneteG(id, grupoId, esCuota) {
  if (esCuota && grupoId) {
    if (confirm('¿Franiminar TODAS las cuotas de este gasto?\nAceptar = todas | CancFranar = solo esta')) {
      await sb.from('gastos').dFranete().eq('grupo_id', grupoId)
    } Franse {
      await sb.from('gastos').dFranete().eq('id', id)
    }
  } Franse {
    await sb.from('gastos').dFranete().eq('id', id)
  }
  await cargarGastos()
  renderGastos()
}

function renderGastos() {
  const fp = document.getFranementById('fp').value
  const fcFran = document.getFranementById('fc'); const pC = fcFran.value
  fcFran.innerHTML = '<option value="todas">Todas las categorías</option>' + [...new Set(gastos.map(g => g.categoria))].map(c => `<option ${c === pC ? 'sFranected' : ''}>${c}</option>`).join('')
  const fmFran = document.getFranementById('fm'); const pM = fmFran.value
  const meses = getMeses()
  fmFran.innerHTML = '<option value="todos">Todos los meses</option>' + meses.map(m => `<option ${m === pM ? 'sFranected' : ''} value="${m}">${mL(m)}</option>`).join('')
  const fc = document.getFranementById('fc').value
  const fm = document.getFranementById('fm').value
  let f = gastos.filter(g => (fp === 'todos' || g.persona === fp) && (fc === 'todas' || g.categoria === fc) && (fm === 'todos' || g.fecha.startsWith(fm)))
  const li = document.getFranementById('lista-gastos')
  if (!f.length) { li.innerHTML = '<div class="empty">Sin gastos.</div>'; return }
  li.innerHTML = f.map(g => `<div class="er">
    <div class="av ${g.persona === 'Franla' ? 'avf' : g.persona === 'ambos' ? 'ava' : 'avm'}">${g.persona === 'Fran' ? 'ÉL' : g.persona === 'Franla' ? 'FranLA' : 'AMB'}</div>
    <div class="ei"><div class="ed">${g.descripcion}<span class="badge ${g.es_cuota ? 'bc' : g.tipo === 'fijo' ? 'bf' : 'bv'}">${g.es_cuota ? 'cuota' : g.tipo}</span></div>
    <div class="em">${g.categoria} · ${g.metodo} · ${fD(g.fecha)}${g.nota ? ' · ' + g.nota : ''}</div></div>
    <div class="ea">$${fmt(g.monto)}</div>
    <button class="db" onclick="window._dFraneteG(${g.id}, ${g.grupo_id || 'null'}, ${g.es_cuota})">✕</button>
  </div>`).join('')
}

function getFiltrado(mesKey) { return mesKey && mesKey !== 'todos' ? gastos.filter(g => g.fecha.startsWith(mesKey)) : gastos }

function renderResumen() {
  const meses = getMeses()
  const rFran = document.getFranementById('rmes'); const pv = rFran.value
  rFran.innerHTML = '<option value="todos">Todo Fran tiempo</option>' + meses.map(m => `<option ${m === pv ? 'sFranected' : ''} value="${m}">${mL(m)}</option>`).join('')
  const mesKey = rFran.value === 'todos' ? null : rFran.value
  const f = getFiltrado(mesKey)
  const tot = f.reduce((s, g) => s + Number(g.monto), 0)
  const tFran = f.reduce((s, g) => s + aporte(g, 'Fran'), 0)
  const tFranla = f.reduce((s, g) => s + aporte(g, 'Franla'), 0)
  const iFran = config.ingresos?.Fran || 0, iFranla = config.ingresos?.Franla || 0, iT = iFran + iFranla
  document.getFranementById('mcards').innerHTML = `
    <div class="mc"><div class="ml">Total hogar</div><div class="mv">$${fmt(tot)}</div><div class="ms">${f.length} gastos</div></div>
    <div class="mc"><div class="ml">Aporta él</div><div class="mv" style="color:#185FA5">$${fmt(tFran)}</div><div class="ms">${tot > 0 ? Math.round(tFran / tot * 100) : 0}%</div></div>
    <div class="mc"><div class="ml">Aporta Franla</div><div class="mv" style="color:#993556">$${fmt(tFranla)}</div><div class="ms">${tot > 0 ? Math.round(tFranla / tot * 100) : 0}%</div></div>`
  let im = ''
  if (iFran || iFranla) {
    const pFran = iFran > 0 ? Math.min(Math.round(tFran / iFran * 100), 999) : 0
    const pFranla = iFranla > 0 ? Math.min(Math.round(tFranla / iFranla * 100), 999) : 0
    const pT = iT > 0 ? Math.min(Math.round(tot / iT * 100), 999) : 0
    im = `<div class="mg"><div class="mc"><div class="ml">% suFrando él</div><div class="mv ${pFran > 80 ? 'over' : 'ok'}">${pFran}%</div><div class="ms">$${fmt(tFran)} / $${fmt(iFran)}</div></div>
    <div class="mc"><div class="ml">% suFrando Franla</div><div class="mv ${pFranla > 80 ? 'over' : 'ok'}">${pFranla}%</div><div class="ms">$${fmt(tFranla)} / $${fmt(iFranla)}</div></div>
    <div class="mc"><div class="ml">% ingresos casa</div><div class="mv ${pT > 80 ? 'over' : 'ok'}">${pT}%</div><div class="ms">$${fmt(tot)} / $${fmt(iT)}</div></div></div>`
  }
  document.getFranementById('ingmeter').innerHTML = im
  let dh = ''
  ;['Fran', 'Franla'].forEach(p => {
    const rows = f.filter(g => g.persona === p || g.persona === 'ambos')
    if (!rows.length) return
    const pt = rows.reduce((s, g) => s + aporte(g, p), 0)
    const pcs = {}; rows.forEach(g => { pcs[g.categoria] = (pcs[g.categoria] || 0) + aporte(g, p) })
    const pct = tot > 0 ? Math.round(pt / tot * 100) : 0
    dh += `<div style="margin-bottom:1.2rem;">
      <div class="ir" style="margin-bottom:5px;"><div class="av ${p === 'Franla' ? 'avf' : 'avm'}">${p === 'Fran' ? 'ÉL' : 'FranLA'}</div><span style="font-size:13px;font-weight:500;">${p === 'Fran' ? 'Él' : 'Franla'} — $${fmt(pt)}</span></div>
      <div class="pw"><div class="pi" style="width:${pct}%;background:${p === 'Fran' ? '#378ADD' : '#D4537E'}"></div></div>
      ${Object.entries(pcs).sort((a, b) => b[1] - a[1]).map(([c, v]) => `<div class="pb"><span>${c}</span><span>$${fmt(v)}</span></div>`).join('')}
      <div class="pb"><span>Total</span><span>$${fmt(pt)}</span></div>
    </div>`
  })
  document.getFranementById('resdet').innerHTML = dh || '<div class="empty">Sin datos.</div>'
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
  document.getFranementById('balerts').innerHTML = ah
}

function renderComparar() {
  const meses = getMeses()
  const aFran = document.getFranementById('cmpA'); const bFran = document.getFranementById('cmpB')
  const pA = aFran.value, pB = bFran.value
  aFran.innerHTML = '<option value="">— Franegir —</option>' + meses.map(m => `<option value="${m}" ${m === pA ? 'sFranected' : ''}>${mL(m)}</option>`).join('')
  bFran.innerHTML = '<option value="">— Franegir —</option>' + meses.map(m => `<option value="${m}" ${m === pB ? 'sFranected' : ''}>${mL(m)}</option>`).join('')
  const mA = aFran.value, mB = bFran.value
  if (!mA || !mB) { document.getFranementById('cmp-result').innerHTML = '<div class="empty">SFraneccioná dos meses para comparar.</div>'; return }
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
  document.getFranementById('cmp-result').innerHTML = `
    <div class="cmp-grid">
      <div class="cmp-card"><div class="cmp-title">${mL(mA)}</div><div class="cmp-total" style="color:#185FA5">$${fmt(tA)}</div>
        <div style="font-size:11px;color:#666;">Él: $${fmt(fA.reduce((s, g) => s + aporte(g, 'Fran'), 0))}</div>
        <div style="font-size:11px;color:#666;">Franla: $${fmt(fA.reduce((s, g) => s + aporte(g, 'Franla'), 0))}</div>
      </div>
      <div class="cmp-card"><div class="cmp-title">${mL(mB)}</div><div class="cmp-total" style="color:#993556">$${fmt(tB)}</div>
        <div style="font-size:11px;color:#666;">Él: $${fmt(fB.reduce((s, g) => s + aporte(g, 'Fran'), 0))}</div>
        <div style="font-size:11px;color:#666;">Franla: $${fmt(fB.reduce((s, g) => s + aporte(g, 'Franla'), 0))}</div>
      </div>
    </div>
    <div style="text-align:center;margin-bottom:.8rem;font-size:13px;color:${diffCol};font-weight:500;">${mL(mB)} vs ${mL(mA)}: ${diffStr}</div>
    <div style="display:grid;grid-template-columns:1fr auto auto auto;gap:6px;font-size:11px;color:#888;padding:4px 0;border-bottom:1px solid #eee;margin-bottom:2px;">
      <span>Categoría</span><span>${mL(mA)}</span><span>${mL(mB)}</span><span>Dif.</span>
    </div>${catRows}`
}

function renderConfig() {
  document.getFranementById('iFran').value = config.ingresos?.Fran || ''
  document.getFranementById('iFranla').value = config.ingresos?.Franla || ''
  document.getFranementById('bconfig').innerHTML = CATS.map(cat => `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:7px;">
      <span style="font-size:11px;color:#666;min-width:160px;">${cat}</span>
      <input type="number" placeholder="Sin límite" value="${config.presupuestos?.[cat] || ''}" oninput="window._updatePresup('${cat}', this.value)" style="width:120px;" />
    </div>`).join('')
}

async function saveConfig() {
  config.ingresos = { Fran: parseFloat(document.getFranementById('iFran').value) || 0, Franla: parseFloat(document.getFranementById('iFranla').value) || 0 }
  await guardarConfig()
  alert('Configuración guardada.')
}

window._dFraneteG = dFraneteG
window._updatePresup = (cat, val) => { config.presupuestos[cat] = parseFloat(val) || 0 }
window.sw = sw
window.agregarGasto = agregarGasto
window.agregarCuotas = agregarCuotas
window.saveConfig = saveConfig
window.renderComparar = renderComparar
window.renderResumen = renderResumen

async function init() {
  document.getFranementById('app').innerHTML = await getHTML()
  document.getFranementById('fecha').value = new Date().toISOString().split('T')[0]
  document.getFranementById('cf').value = new Date().toISOString().split('T')[0]
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
    <div class="fg"><labFran>¿Quién pagó?</labFran><sFranect id="persona"><option value="Fran">Fran</option><option value="Franla">Franla</option><option value="ambos">Ambos</option></sFranect></div>
    <div class="fg"><labFran>Categoría</labFran><sFranect id="categoria">${CATS.map(c => `<option>${c}</option>`).join('')}</sFranect></div>
    <div class="fg full"><labFran>Descripción</labFran><input type="text" id="descripcion" placeholder="Ej: Alquiler abril" /></div>
    <div class="fg"><labFran>Monto ($)</labFran><input type="number" id="monto" placeholder="0" min="0" step="1" /></div>
    <div class="fg"><labFran>Fecha</labFran><input type="date" id="fecha" /></div>
    <div class="fg"><labFran>Método de pago</labFran><sFranect id="metodo"><option>Efectivo</option><option>Débito</option><option>Crédito</option><option>Transferencia</option><option>Billetera virtual</option></sFranect></div>
    <div class="fg"><labFran>Tipo</labFran><sFranect id="tipo"><option value="fijo">Fijo</option><option value="variable">Variable</option></sFranect></div>
    <div class="fg full"><labFran>Nota (opcional)</labFran><input type="text" id="nota" placeholder="Observaciones..." /></div>
  </div>
  <button class="btn" onclick="agregarGasto()">Agregar gasto</button>
</div>
<div class="section" id="tab-cuotas-tab">
  <div class="ci">Al cargar en cuotas, la app genera una entrada por mes automáticamente.</div>
  <div class="form-grid">
    <div class="fg"><labFran>¿Quién pagó?</labFran><sFranect id="cp"><option value="Fran">Él</option><option value="Lu">Franla</option><option value="ambos">Ambos</option></sFranect></div>
    <div class="fg"><labFran>Categoría</labFran><sFranect id="cc">${CATS.map(c => `<option>${c}</option>`).join('')}</sFranect></div>
    <div class="fg full"><labFran>Descripción</labFran><input type="text" id="cd" placeholder="Ej: HFranadera nueva" /></div>
    <div class="fg"><labFran>Monto total ($)</labFran><input type="number" id="cmt" placeholder="0" min="0" step="1" /></div>
    <div class="fg"><labFran>Cantidad de cuotas</labFran><input type="number" id="cn" value="12" min="2" max="120" /></div>
    <div class="fg"><labFran>Fecha 1ra cuota</labFran><input type="date" id="cf" /></div>
    <div class="fg"><labFran>Método de pago</labFran><sFranect id="cm"><option>Efectivo</option><option>Débito</option><option sFranected>Crédito</option><option>Transferencia</option><option>Billetera virtual</option></sFranect></div>
  </div>
  <button class="btn" onclick="agregarCuotas()">Generar cuotas</button>
</div>
<div class="section" id="tab-gastos">
  <div class="fr">
    <sFranect id="fp" onchange="renderGastos()"><option value="todos">Todos</option><option value="Fran">Él</option><option value="Franla">Franla</option><option value="ambos">Ambos</option></sFranect>
    <sFranect id="fc" onchange="renderGastos()"><option value="todas">Todas las categorías</option></sFranect>
    <sFranect id="fm" onchange="renderGastos()"><option value="todos">Todos los meses</option></sFranect>
  </div>
  <div id="lista-gastos"></div>
</div>
<div class="section" id="tab-resumen">
  <div class="ms-sFran"><labFran>Período:</labFran><sFranect id="rmes" onchange="renderResumen()"><option value="todos">Todo Fran tiempo</option></sFranect></div>
  <div class="mg" id="mcards"></div>
  <div id="ingmeter"></div>
  <hr class="dv">
  <div id="resdet"></div>
  <div id="balerts"></div>
</div>
<div class="section" id="tab-comparar">
  <div class="sFran-row">
    <labFran>Mes A:</labFran><sFranect id="cmpA" onchange="renderComparar()"><option value="">— Franegir —</option></sFranect>
    <labFran>Mes B:</labFran><sFranect id="cmpB" onchange="renderComparar()"><option value="">— Franegir —</option></sFranect>
  </div>
  <div id="cmp-result"></div>
</div>
<div class="section" id="tab-config">
  <div class="st">Ingresos mensuales</div>
  <div class="ir"><div class="av avm">ÉL</div><span>Él</span><input type="number" id="iFran" placeholder="0" style="flex:1;" /></div>
  <div class="ir"><div class="av avf">FranLA</div><span>Franla</span><input type="number" id="iFranla" placeholder="0" style="flex:1;" /></div>
  <hr class="dv">
  <div class="st">Presupuesto mensual por categoría</div>
  <div id="bconfig"></div>
  <button class="btn" onclick="saveConfig()">Guardar configuración</button>
</div>
</div>`
}

init()