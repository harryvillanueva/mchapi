import DbConnection from "../helpers/DbConnection";
import { IContactoUniversidad } from "../models/IContactoUniversidad";

function toNullIfEmpty(val: any) {
  return val === '' ? null : val;
}

class ContactoUniversidadDAL {
  async getAll(): Promise<IContactoUniversidad[]> {
    const result = await new DbConnection().exeQuery({
      text: 'SELECT * FROM tbl_contacto_universidad ORDER BY id DESC',
      values: []
    });
    return result as IContactoUniversidad[];
  }

  async getById(id: number): Promise<IContactoUniversidad | null> {
    const result = await new DbConnection().exeQuery({
      text: 'SELECT * FROM tbl_contacto_universidad WHERE id = $1',
      values: [id]
    });
    return (result && result.length > 0) ? (result[0] as IContactoUniversidad) : null;
  }

  async insert(data: IContactoUniversidad): Promise<IContactoUniversidad | null> {
    console.log('DAL insert - datos recibidos:', JSON.stringify(data, null, 2));
    
    // Verificar campos obligatorios
    if (!data.nombre || !data.universidad) {
      console.error('DAL insert - campos obligatorios faltantes:', { nombre: data.nombre, universidad: data.universidad });
      throw new Error('Campos obligatorios faltantes: nombre y universidad son requeridos');
    }
    
    // Preparar valores para debugging
    const valores = [
      data.nombre || '',
      data.apellido || '',
      data.telefono || '',
      toNullIfEmpty(data.telefono2),
      data.universidad || '',
      data.tipo || '',
      data.puesto || '',
      toNullIfEmpty(data.notas),
      data.email || '',
      toNullIfEmpty(data.portal_web),
      toNullIfEmpty(data.ultima_actualizacion),
      toNullIfEmpty(data.siguiente_paso),
      toNullIfEmpty(data.ultima_llamada),
      data.departamento || '',
      toNullIfEmpty(data.usuario_portal),
      toNullIfEmpty(data.contrasena_portal),
      toNullIfEmpty(data.firma_convenio_fecha),
      toNullIfEmpty(data.firma_convenio_link),
      toNullIfEmpty(data.vencimiento_convenio),
      toNullIfEmpty(data.altas_social)
    ];
    
    console.log('DAL insert - valores preparados:', valores);
    
    try {
      const result = await new DbConnection().exeQuery({
        text: `INSERT INTO tbl_contacto_universidad
        (nombre, apellido, telefono, telefono2, universidad, tipo, puesto, notas, email, portal_web, ultima_actualizacion, siguiente_paso, ultima_llamada, departamento, usuario_portal, contrasena_portal, firma_convenio_fecha, firma_convenio_link, vencimiento_convenio, altas_social)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
        RETURNING *`,
        values: valores
      });
      console.log('DAL insert - resultado SQL completo:', JSON.stringify(result, null, 2));
      
      // Verificar si DbConnection devolvió un error
      if (result && result.length > 0 && (result[0] as any).error) {
        console.error('DAL insert - error de SQL:', (result[0] as any).error);
        throw new Error(`Error de base de datos: ${(result[0] as any).error}`);
      }
      
      return (result && result.length > 0) ? (result[0] as IContactoUniversidad) : null;
    } catch (error) {
      console.error('DAL insert - error:', error);
      throw error;
    }
  }

  async update(id: number, data: IContactoUniversidad): Promise<IContactoUniversidad | null> {
    const result = await new DbConnection().exeQuery({
      text: `UPDATE tbl_contacto_universidad SET
        nombre=$1, apellido=$2, telefono=$3, telefono2=$4, universidad=$5, tipo=$6, puesto=$7, notas=$8, email=$9, portal_web=$10, ultima_actualizacion=$11, siguiente_paso=$12, ultima_llamada=$13, departamento=$14, usuario_portal=$15, contrasena_portal=$16, firma_convenio_fecha=$17, firma_convenio_link=$18, vencimiento_convenio=$19, altas_social=$20
      WHERE id=$21 RETURNING *`,
      values: [
        data.nombre, data.apellido, data.telefono, data.telefono2, data.universidad, data.tipo, data.puesto, data.notas, data.email, data.portal_web,
        toNullIfEmpty(data.ultima_actualizacion),
        toNullIfEmpty(data.siguiente_paso),
        toNullIfEmpty(data.ultima_llamada),
        data.departamento, data.usuario_portal, data.contrasena_portal,
        toNullIfEmpty(data.firma_convenio_fecha),
        data.firma_convenio_link,
        toNullIfEmpty(data.vencimiento_convenio),
        data.altas_social, id
      ]
    });
    
    // Verificar si DbConnection devolvió un error
    if (result && result.length > 0 && (result[0] as any).error) {
      console.error('DAL update - error de SQL:', (result[0] as any).error);
      throw new Error(`Error de base de datos: ${(result[0] as any).error}`);
    }
    
    return (result && result.length > 0) ? (result[0] as IContactoUniversidad) : null;
  }

  async delete(id: number): Promise<void> {
    await new DbConnection().exeQuery({
      text: 'DELETE FROM tbl_contacto_universidad WHERE id = $1',
      values: [id]
    });
  }
}

export default new ContactoUniversidadDAL();
