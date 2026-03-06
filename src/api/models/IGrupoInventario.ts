import { IModel } from "../helpers/IModel";
import { IArticulo } from "./IArticulo";

export interface IGrupoInventario extends IModel{
    id_piso?: BigInt,
    l_articulos : Array<{id_articulo : bigint, resta : number}>
    id_piso_mover?: BigInt
}