import { IHistoricoContactoRRHH } from "../models/IHistoricoContactoRRHH";
import HistoricoContactoRRHHDAL from "../data/HistoricoContactoRRHHDAL";

class HistoricoContactoRRHHBLL {
  async getByContacto(id_contacto: number): Promise<IHistoricoContactoRRHH[]> {
    return await HistoricoContactoRRHHDAL.getByContacto(id_contacto);
  }

  async insert(data: IHistoricoContactoRRHH): Promise<IHistoricoContactoRRHH | null> {
    return await HistoricoContactoRRHHDAL.insert(data);
  }
}

export default new HistoricoContactoRRHHBLL();
