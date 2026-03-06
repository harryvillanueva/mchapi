import type { NextApiRequest, NextApiResponse } from 'next';
import ContactoUniversidadBLL from '../../api/business/ContactoUniversidadBLL';
import HistoricoContactoRRHHBLL from '../../api/business/HistoricoContactoRRHHBLL';

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
    // Endpoint para histórico: /api/contactos-universidad?historico=1&id=XX
    if (req.method === 'GET' && req.query.historico && req.query.id) {
      const historico = await HistoricoContactoRRHHBLL.getByContacto(Number(req.query.id));
      return res.status(200).json(historico);
    }
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
      console.log('API POST - datos recibidos:', JSON.stringify(req.body, null, 2));
      const contacto = await ContactoUniversidadBLL.insert(req.body);
      console.log('API POST - resultado del BLL:', contacto);
      
      // Verificar si el resultado contiene un error
      if (!contacto || (contacto as any).error || ((contacto as any).data && (contacto as any).data.length === 0)) {
        console.log('API POST - error detectado, retornando error 400');
        const errorMsg = (contacto as any)?.error || 'No se pudo crear el contacto. Revisa los datos enviados.';
        return res.status(400).json({ error: errorMsg });
      }
      
      console.log('API POST - contacto creado exitosamente');
      return res.status(201).json(contacto);
    }
    if (req.method === 'PUT') {
      console.log('API PUT - datos recibidos:', JSON.stringify(req.body, null, 2));
      const { id, usuario, ...data } = req.body;
      
      // Obtener el contacto original antes de actualizar
      const contactoOriginal = await ContactoUniversidadBLL.getById(Number(id));
      
      // Actualizar el contacto
      const contacto = await ContactoUniversidadBLL.update(Number(id), data);
      console.log('API PUT - resultado del BLL:', contacto);
      
      // Solo guardar en historial los campos que realmente cambiaron
      if (contactoOriginal) {
        const camposModificados: any = {
          id_contacto: Number(id),
          usuario: usuario || 'Desconocido',
          fecha: new Date().toISOString()
        };
        
        // Comparar cada campo y solo agregar los que cambiaron
        const fields = [
          'nombre', 'apellido', 'telefono', 'telefono2', 'universidad', 'tipo', 
          'puesto', 'email', 'portal_web', 'departamento', 'usuario_portal', 
          'contrasena_portal', 'firma_convenio_fecha', 'firma_convenio_link', 
          'vencimiento_convenio', 'altas_social', 'notas', 'ultima_llamada', 
          'siguiente_paso'
        ];
        
        let huboChangios = false;
        fields.forEach(field => {
          const original = contactoOriginal[field as keyof typeof contactoOriginal];
          const nuevo = data[field];
          if (original !== nuevo) {
            camposModificados[field] = nuevo;
            huboChangios = true;
          }
        });
        
        // Solo insertar en historial si hubo cambios reales
        if (huboChangios) {
          await HistoricoContactoRRHHBLL.insert(camposModificados);
        }
      }
      
      return res.status(200).json(contacto);
    }
    if (req.method === 'DELETE') {
      const { id } = req.body;
      await ContactoUniversidadBLL.delete(Number(id));
      return res.status(204).end();
    }
    return res.status(405).json({ error: 'Método no permitido' });
  } catch (e) {
    console.error('Error en contactos-universidad API:', e);
    const errorMsg = e instanceof Error ? e.message : 'Error desconocido';
    return res.status(500).json({ error: 'Error interno del servidor', details: errorMsg });
  }
}
