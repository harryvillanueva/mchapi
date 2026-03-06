import DbConnection from "../helpers/DbConnection";
import { IHistoricoContactoRRHH } from "../models/IHistoricoContactoRRHH";

class HistoricoContactoRRHHDAL {
  async getByContacto(id_contacto: number): Promise<IHistoricoContactoRRHH[]> {
    const result = await new DbConnection().exeQuery({
      text: 'SELECT * FROM tbl_historico_contactos_rrhh WHERE id_contacto = $1 ORDER BY fecha DESC',
      values: [id_contacto]
    });
    return result as IHistoricoContactoRRHH[];
  }

  async insert(data: IHistoricoContactoRRHH): Promise<IHistoricoContactoRRHH | null> {
    const result = await new DbConnection().exeQuery({
      text: `INSERT INTO tbl_historico_contactos_rrhh (
        id_contacto, usuario, fecha, notas, ultima_llamada, siguiente_paso,
        nombre, apellido, telefono, telefono2, universidad, tipo, puesto, email, portal_web, departamento, usuario_portal, contrasena_portal, firma_convenio_fecha, firma_convenio_link, vencimiento_convenio, altas_social
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
      ) RETURNING *`,
      values: [
        data.id_contacto, data.usuario, data.fecha, data.notas, data.ultima_llamada, data.siguiente_paso,
        data.nombre, data.apellido, data.telefono, data.telefono2, data.universidad, data.tipo, data.puesto, data.email, data.portal_web, data.departamento, data.usuario_portal, data.contrasena_portal, data.firma_convenio_fecha, data.firma_convenio_link, data.vencimiento_convenio, data.altas_social
      ]
    });
    return (result && result.length > 0) ? (result[0] as IHistoricoContactoRRHH) : null;
  }
}

export default new HistoricoContactoRRHHDAL();
