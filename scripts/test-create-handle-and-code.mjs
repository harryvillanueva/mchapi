#!/usr/bin/env node
// Test aislado: crear manija y, si tiene éxito, crear código temporal asociado
// Requisitos: Node 18+ (fetch global)
// Uso:
//   API_BASE=http://localhost:3016 node test-create-handle-and-code.mjs

// $env:API_BASE='http://localhost:3016/api/public/apartments'
const API_BASE = process.env.API_BASE || 'http://185.252.233.57:3016/api/public/apartments';
const APARTMENT_ID = process.env.APARTMENT_ID || '1';
const DEVICE_ID = process.env.DEVICE_ID || '1';
const USER_ID = process.env.X_USER_ID || '1';
const CODE = process.env.CODE || `TEST${Math.floor(Math.random() * 900000 + 100000)}`;
const DAYS = parseInt(process.env.DAYS || '1', 10);

function nowTimestamp() {
  const now = new Date();
  return Math.floor(now.getTime() / 1000);
}

async function createHandle() {
  const url = `${API_BASE}/${APARTMENT_ID}/devices/${DEVICE_ID}/handles`;
  const etiqueta = `Test Manija ${Date.now()}`;
  const body = { iddispositivo: parseInt(DEVICE_ID, 10), etiqueta, estado: 1 };
  console.log('[TEST] Creando manija ->', url);
  console.log('[TEST] Payload crear manija:', JSON.stringify(body));
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': USER_ID },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch (e) { data = text; }
  return { ok: res.ok, status: res.status, data };
}

async function createCode(idmanija) {
  const url = `${API_BASE}/${APARTMENT_ID}/devices/${DEVICE_ID}/actions`;
  const now = new Date();
  const tsInicio = Math.floor(now.getTime() / 1000);
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + DAYS);
  const tsFin = Math.floor(endDate.getTime() / 1000);

    const apiData = {
      log_data: {
        accion: 'Agregar código (test)',
        resultado: '1',
        // incluir iddispositivo en log_data para compatibilidad con el backend
        iddispositivo: idmanija,
        usuario: 'test-script',
        // El backend espera un objeto en log_data.data (con campos client, clientFrom, msg, ...)
        data: {
          codigo: CODE,
          dias: DAYS,
          client: 'test-script',
          clientFrom: 'test-script',
          msg: `Creando código ${CODE}`
        },
        tipo_ejecucion: 'Manual',
        observacion: `Código ${CODE} creado por test`,
      },
    code_data: {
      codigo: CODE.toString(),
      dias: DAYS,
      timestamp_inicio: tsInicio,
      timestamp_fin: tsFin,
      fecha_vig_inicio: now.toISOString(),
      fecha_vig_fin: endDate.toISOString(),
      idtipocodigo: 1,
      idmanija: idmanija
    }
  };

  console.log('[TEST] Creando código temporal ->', url);
  console.log('[TEST] Payload crear código temporal:', JSON.stringify(apiData));
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': USER_ID },
    body: JSON.stringify(apiData)
  });
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch (e) { data = text; }
  return { ok: res.ok, status: res.status, data };
}

async function run() {
  console.log('API_BASE:', API_BASE);
  console.log('APARTMENT_ID:', APARTMENT_ID, 'DEVICE_ID:', DEVICE_ID, 'USER_ID:', USER_ID);
  console.log('CODE:', CODE, 'DAYS:', DAYS);

  try {
    const h = await createHandle();
    console.log('[TEST] Respuesta crear manija status=', h.status);
    console.log('[TEST] Body:', JSON.stringify(h.data, null, 2));
    if (!h.ok) {
      console.error('[TEST] Crear manija falló, abortando creación de código.');
      process.exitCode = 2;
      return;
    }

    // Extraer idmanija del body con validación más robusta
    function extractIdmanija(obj) {
      if (!obj) return null;
      // Casos posibles: objeto directo, array con objeto, { data: ... }, { result: ... }
      const candidates = [];
      if (Array.isArray(obj) && obj.length > 0) candidates.push(obj[0]);
      if (typeof obj === 'object') candidates.push(obj);
      if (obj && obj.data) candidates.push(obj.data);
      if (obj && obj.result) candidates.push(obj.result);
      if (obj && obj.data && obj.data.result) candidates.push(obj.data.result);
      // Buscar en los candidatos
      for (const c of candidates) {
        if (!c || typeof c !== 'object') continue;
        // Además de las variantes de idmanija, aceptar iddispositivo (schema actual)
        const id = c.idmanija || c.id || c.id_manija || c.idHandle || c.handleId || c.iddispositivo || (c.data && (c.data.idmanija || c.data.id || c.data.iddispositivo));
        if (id) return id;
      }
      return null;
    }

    const idmanija = extractIdmanija(h.data);
    if (!idmanija) {
      console.error('[TEST] No se pudo extraer un idmanija válido de la respuesta. Abortando prueba.');
      console.error('[TEST] Endpoint:', `${API_BASE}/${APARTMENT_ID}/devices/${DEVICE_ID}/handles`);
      console.error('[TEST] Payload enviado (ver logs arriba).');
      console.error('[TEST] Response status:', h.status);
      console.error('[TEST] Response body:', JSON.stringify(h.data, null, 2));
      process.exitCode = 2;
      return;
    }

  // Además de pasar idmanija al payload del código, incluimos iddispositivo dentro de log_data
  // porque el backend espera log_data.iddispositivo en muchas operaciones internas.
  // Modificamos createCode para que reciba el valor y lo incluya en log_data.
  // Para mantener compatibilidad, la función createCode usa code_data.idmanija y
  // ahora también enviaremos log_data.iddispositivo.
  // Llamamos a createCode pasándole el idmanija y la reescritura de payload interno
  // añadirá log_data.iddispositivo.
  const c = await createCode(idmanija);
    console.log('[TEST] Respuesta crear código status=', c.status);
    console.log('[TEST] Body:', JSON.stringify(c.data, null, 2));
    if (!c.ok) {
      console.error('[TEST] Crear código temporal falló.');
      process.exitCode = 3;
      return;
    }

    console.log('[TEST] OK: manija creada y código temporal asociado creado correctamente.');
    process.exitCode = 0;

  } catch (err) {
    console.error('[TEST] Error inesperado:', err);
    process.exitCode = 1;
  }
}

run();
