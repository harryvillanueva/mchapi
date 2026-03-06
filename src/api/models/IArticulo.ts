import { IModel } from "../helpers/IModel";
import { StatusDataType } from "../types/GlobalTypes";
import { IVariablesReserva } from "./IVariablesReserva";


export interface IArticulo extends IModel{

    //datos DA

    id?: BigInt,
    tag : string,
    mobiliario: string,
    descripcion?: string,
    precio : number,
    fecha_registro? : string,
    fecha_compra : string,
    meses_antiguedad : number,
    depreciacion: number,
    valor_depreciacion : number,
    propietario: string,
    notas?: string,
    url_imagen?:string,
    stock? :number,
    total : number,
    estado? : StatusDataType

}