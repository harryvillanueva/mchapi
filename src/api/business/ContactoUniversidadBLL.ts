import { IContactoUniversidad } from "../models/IContactoUniversidad";
import ContactoUniversidadDAL from "../data/ContactoUniversidadDAL";

class ContactoUniversidadBLL {
  async getAll(): Promise<IContactoUniversidad[]> {
    return await ContactoUniversidadDAL.getAll();
  }

  async getById(id: number): Promise<IContactoUniversidad | null> {
    return await ContactoUniversidadDAL.getById(id);
  }

  async insert(data: IContactoUniversidad): Promise<IContactoUniversidad | null> {
    return await ContactoUniversidadDAL.insert(data);
  }

  async update(id: number, data: IContactoUniversidad): Promise<IContactoUniversidad | null> {
    return await ContactoUniversidadDAL.update(id, data);
  }

  async delete(id: number): Promise<void> {
    return await ContactoUniversidadDAL.delete(id);
  }
}

export default new ContactoUniversidadBLL();
