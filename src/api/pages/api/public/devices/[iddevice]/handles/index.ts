import type { NextApiRequest, NextApiResponse } from 'next';
import Constants from '@/api/helpers/Constants';
import DbConnection from '@/api/helpers/DbConnection';

// Utilidad para obtener manijas de un dispositivo
async function getHandlesByDevice(idDevice: number) {
  const client = new DbConnection(false);
  const query = {
    name: 'get-handles-by-device',
    // la tabla actual no tiene columna 'estado' -> filtrar solo por iddispositivo
    text: `SELECT * FROM ${Constants.tbl_manija_sql} WHERE iddispositivo = $1`,
    values: [idDevice],
  };
  const result = await client.exeQuery(query);
  // DEBUG: log DB result to pm2 logs for diagnosis
  try {
    console.log('[DEBUG] getHandlesByDevice result:', JSON.stringify(result));
  } catch (e) {
    console.log('[DEBUG] getHandlesByDevice result (no JSON):', result);
  }
  return result;
}

// Utilidad para crear una manija
async function createHandle(idDevice: number, etiqueta: string) {
  const client = new DbConnection(false);
  // si ya existe una manija para este dispositivo, devolverla (evita violar PK en iddispositivo)
  try {
    const existing = await client.exeQuery({
      text: `SELECT * FROM ${Constants.tbl_manija_sql} WHERE iddispositivo = $1`,
      values: [idDevice],
    } as any);
    if (existing && Array.isArray(existing) && existing.length > 0 && !(existing as any)[0].error) {
      return (existing as any)[0];
    }
  } catch (e) {
    // seguir con el insert si falló la comprobación
  }
  const query = {
    name: 'insert-handle',
    // adaptar el INSERT al esquema real de la tabla tbl_manija
    // columnas reales: iddispositivo, mac, idcodigo, codigo_permanente, bateria
    // generamos un mac y un codigo_permanente aleatorio para crear la manija
    text: `INSERT INTO ${Constants.tbl_manija_sql} (iddispositivo, mac, codigo_permanente, bateria) VALUES ($1, $2, $3, $4) RETURNING *`,
    values: [idDevice, null, null, null],
  };
  // generar valores por defecto
  const genMac = 'MC' + Math.random().toString(16).slice(2, 14).toUpperCase();
  const genCode = (Math.floor(Math.random() * 90000000) + 10000000).toString(); // 8 dígitos
  const _values: any[] = [idDevice, genMac, genCode, null];
  query.values = _values;
  const result = await client.exeQuery(query);
  // DEBUG: log DB result to pm2 logs for diagnosis
  try {
    console.log('[DEBUG] createHandle raw result:', JSON.stringify(result));
  } catch (e) {
    console.log('[DEBUG] createHandle raw result (no JSON):', result);
  }
  return result && result[0];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const iddevice = Array.isArray(req.query.iddevice) ? req.query.iddevice[0] : req.query.iddevice;
  if (!iddevice) {
    res.status(400).json({ error: 'Falta el parámetro iddevice' });
    return;
  }
  const idDevice = parseInt(iddevice as string, 10);
  if (isNaN(idDevice)) {
    res.status(400).json({ error: 'Parámetro iddevice inválido' });
    return;
  }

  if (req.method === 'GET') {
    try {
      const handles = await getHandlesByDevice(idDevice);
      res.status(200).json(handles);
    } catch (err) {
      res.status(500).json({ error: 'Error al obtener manijas', details: err });
    }
  } else if (req.method === 'POST') {
    const { etiqueta } = req.body;
    if (!etiqueta) {
      res.status(400).json({ error: 'Falta el campo etiqueta' });
      return;
    }
    try {
      const handle = await createHandle(idDevice, etiqueta);
      // evitar errores de compilación TS sobre propiedades inexistentes en la unión de tipos
      const createdId = handle && (((handle as any).idmanija ?? (handle as any).id) ?? (handle as any).id_manija);
      if (handle && createdId) {
        res.status(201).json(handle);
      } else {
        res.status(500).json({ error: 'No se pudo crear la manija' });
      }
    } catch (err) {
      res.status(500).json({ error: 'Error al crear manija', details: err });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Método ${req.method} no permitido`);
  }
}
