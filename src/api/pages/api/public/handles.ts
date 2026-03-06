import type { NextApiRequest, NextApiResponse } from 'next';
import Constants from '../../../helpers/Constants';
import DbConnection from '../../../helpers/DbConnection';

// Utilidad para obtener manijas de un dispositivo
async function getHandlesByDevice(idDevice: number) {
  const client = new DbConnection(false);
  const query = {
    name: 'get-handles-by-device',
    // la tabla tbl_manija no tiene columna 'estado' en esta base -> filtrar solo por iddispositivo
    text: `SELECT * FROM ${Constants.tbl_manija_sql} WHERE iddispositivo = $1`,
    values: [idDevice],
  };
  const result = await client.exeQuery(query);
  try { console.log('[DEBUG] getHandlesByDevice (public/handles) result:', JSON.stringify(result)); } catch (e) { console.log('[DEBUG] getHandlesByDevice (public/handles) result (no JSON):', result); }
  return result;
}

// Utilidad para crear una manija
async function createHandle(idDevice: number, etiqueta: string) {
  const client = new DbConnection(false);
  // evitar insertar en columna inexistente 'etiqueta' -> usar columnas reales
  const genMac = 'MC' + Math.random().toString(16).slice(2, 14).toUpperCase();
  const genCode = (Math.floor(Math.random() * 90000000) + 10000000).toString();
  const bateriaDefault = 0;
  const query = {
    name: 'insert-handle',
    text: `INSERT INTO ${Constants.tbl_manija_sql} (iddispositivo, mac, codigo_permanente, bateria) VALUES ($1, $2, $3, $4) RETURNING *`,
    values: [idDevice, genMac, genCode, bateriaDefault],
  };
  const result = await client.exeQuery(query);
  try { console.log('[DEBUG] createHandle (public/handles) raw result:', JSON.stringify(result)); } catch (e) { console.log('[DEBUG] createHandle (public/handles) raw result (no JSON):', result); }
  return result && result[0];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id, iddevice } = req.query;
  if (!id || !iddevice) {
    res.status(400).json({ error: 'Faltan parámetros id o iddevice' });
    return;
  }
  const idPiso = parseInt(id as string);
  const idDevice = parseInt(iddevice as string);

  if (req.method === 'GET') {
    // Listar manijas
    try {
      const handles = await getHandlesByDevice(idDevice);
      res.status(200).json(handles);
    } catch (err) {
      res.status(500).json({ error: 'Error al obtener manijas', details: err });
    }
  } else if (req.method === 'POST') {
    // Crear manija
    const { etiqueta } = req.body;
    if (!etiqueta) {
      res.status(400).json({ error: 'Falta el campo etiqueta' });
      return;
    }
    try {
      const handle = await createHandle(idDevice, etiqueta);
      res.status(201).json(handle);
    } catch (err) {
      res.status(500).json({ error: 'Error al crear manija', details: err });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Método ${req.method} no permitido`);
  }
}
