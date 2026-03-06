import { IModel } from "../helpers/IModel";
import { StatusDataType } from "../types/GlobalTypes";
import { IVariablesReserva } from "./IVariablesReserva";

export interface IInventario extends IModel{
    id ?: BigInt
    id_piso : BigInt
    id_articulo : BigInt
    cantidad : number
    id_piso_mover? : BigInt
}