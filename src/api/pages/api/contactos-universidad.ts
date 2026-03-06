import type { NextApiRequest, NextApiResponse } from 'next';
import ContactoUniversidadBLL from '../../business/ContactoUniversidadBLL';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    // Responder rápido a preflight
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      if (req.query.id) {
        const contacto = await ContactoUniversidadBLL.getById(Number(req.query.id));
        if (!contacto) return res.status(404).json({ error: 'No encontrado' });
        return res.status(200).json(contacto);
      }
      const contactos = await ContactoUniversidadBLL.getAll();
      return res.status(200).json(contactos);
    }
    if (req.method === 'POST') {
      const contacto = await ContactoUniversidadBLL.insert(req.body);
      return res.status(201).json(contacto);
    }
    if (req.method === 'PUT') {
      const { id, ...data } = req.body;
      const contacto = await ContactoUniversidadBLL.update(Number(id), data);
      return res.status(200).json(contacto);
    }
    if (req.method === 'DELETE') {
      const { id } = req.body;
      await ContactoUniversidadBLL.delete(Number(id));
      return res.status(204).end();
    }
    return res.status(405).json({ error: 'Método no permitido' });
  } catch (e) {
    return res.status(500).json({ error: e?.toString() });
  }
}
