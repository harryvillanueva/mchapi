// get_ewelink_tokens.js
// Uso: EW_EMAIL="tu@email" EW_PASS="tuPass" EW_REGION="eu" node get_ewelink_tokens.js
// Region suele ser: 'eu', 'us', 'cn', etc.

const Ewelink = require('ewelink-api');
const util = require('util');

(async () => {
  const email = process.env.EW_EMAIL || process.argv[2];
  const password = process.env.EW_PASS || process.argv[3];
  const region = process.env.EW_REGION || 'eu';
  // Opcional: permitir forzar un APP_ID / APP_SECRET si se dispone (puede permitir login con una app autorizada)
  const appId = process.env.EW_APP_ID || process.argv[4];
  const appSecret = process.env.EW_APP_SECRET || process.argv[5];

  if (!email || !password) {
    console.error('Uso: EW_EMAIL="tu@email" EW_PASS="tuPass" EW_REGION="eu" node get_ewelink_tokens.js');
    process.exit(1);
  }

  console.log('Iniciando login eWeLink (region=' + region + ')...');

  try {
    const opts = { email, password, region };
    if (appId) opts.appid = appId;
    if (appSecret) opts.apikey = appSecret;
    if (appId || appSecret) console.log('[Info] usando APP_ID/apikey proporcionados.');

    const connection = new Ewelink(opts);

    // Si se pasaron APP_ID / APP_SECRET, forzarlas en varias propiedades
    if (appId || appSecret) {
      const keysMap = [
        ['APP_ID', 'APP_SECRET'],
        ['appid', 'apikey'],
        ['appId', 'appSecret'],
        ['appID', 'appKEY']
      ];
      for (const [kId, kSecret] of keysMap) {
        try {
          if (appId) connection[kId] = appId;
          if (appSecret) connection[kSecret] = appSecret;
        } catch {}
      }
      // Algunos builds usan lowercase names
      try { if (appId) connection.appid = appId; } catch {}
      try { if (appSecret) connection.apikey = appSecret; } catch {}
      // Log breve para depuración
      console.log('[Info] forzadas propiedades APP_ID/apikey en la instancia (varios nombres).');
    }

    // Intentamos obtener credenciales con la función expuesta por la librería (si existe)
    let creds = null;
    try {
      if (typeof connection.getCredentials === 'function') {
        creds = await connection.getCredentials();
        console.log('\n[getCredentials] ->', util.inspect(creds, { depth: 5 }));
      } else if (typeof connection.login === 'function') {
        // Algunas versiones exponen login
        creds = await connection.login();
        console.log('\n[login] ->', util.inspect(creds, { depth: 5 }));
      }
    } catch (err) {
      console.warn('[getCredentials/login] lanzó error:', err && err.message ? err.message : err);
    }

    // Inspeccionamos propiedades comunes donde la librería puede guardar tokens
    const propsToCheck = ['at', 'rt', 'atExpires', 'rtExpires', 'appId', 'apiKey', 'token', 'accessToken', 'refreshToken', 'authorization'];
    const found = {};
    for (const k of propsToCheck) {
      try {
        if (connection[k]) found[k] = connection[k];
      } catch {}
    }

    // También volcaremos algunas propiedades públicas para inspección
    const publicKeys = Object.keys(connection).filter(k => typeof connection[k] !== 'function').slice(0, 100);
    const publicDump = {};
    for (const k of publicKeys) {
      try { publicDump[k] = connection[k]; } catch {}
    }

    console.log('\n[Posibles tokens/props detectadas] ->', util.inspect(found, { depth: 3 }));
    console.log('\n[Resumen de propiedades públicas de la instancia] ->', util.inspect(publicDump, { depth: 2 }));

    // Si no se detectó nada pero hay métodos para listar devices, intentar listado breve (no obligatorio)
    if (!creds && typeof connection.getDevices === 'function') {
      try {
        const d = await connection.getDevices();
        console.log('\n[getDevices] -> (ejemplo) ', util.inspect(Array.isArray(d) ? d.slice(0,5) : d, { depth: 2 }));
      } catch (err) {
        // no crítico
      }
    }

    console.log('\nListo: si ves accessToken/refreshToken en la salida, cópialos (de forma segura) para actualizar la BD.');
  } catch (err) {
    console.error('Error al inicializar la librería o hacer login:', err && err.message ? err.message : err);
    process.exit(2);
  }
})();