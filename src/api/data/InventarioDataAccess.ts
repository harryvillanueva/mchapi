import DbConnection from "../helpers/DbConnection";
import { IDataAccess } from "../helpers/IDataAccess";
import UtilInstance from "../helpers/Util";
import { IErrorResponse } from "../modelsextra/IErrorResponse";
import Constants from "../helpers/Constants";
import { StatusDataType } from "../types/GlobalTypes";
import { IModel } from "../helpers/IModel";
import { IArticulo } from "../models/IArticulo";
import { IResponse } from "../modelsextra/IResponse";
import ArticuloBusiness from "../business/ArticuloBusiness";
import ArticuloDataAccess from "./ArticuloDataAccess";
import { IInventario } from "../models/IInventario";
import { IApartment } from "../models/IApartment";
import { IGrupoInventario } from "../models/IGrupoInventario";
import { IResponseGeneral } from "../modelsextra/IResponseGeneral";

class InventarioDataAccess implements IDataAccess<IInventario>{
    public client : DbConnection

    constructor(
        public idUserLogin : BigInt,
        public filterStatus : StatusDataType,
        public isTransaction : boolean,
        public infoExtra?: any
    ){
        this.client = new DbConnection(isTransaction)
    }

    async get(): Promise<Array<IInventario> | IErrorResponse>{
        const queryData ={
            name : "get-all-inventarios",
            text : `SELECT inv.* FROM ${Constants.tbl_inventario_da_sql} inv
                    INNER JOIN ${Constants.tbl_piso_sql} pi
                    ON inv.id_piso = pi.id
                    ORDER BY pi.etiqueta ASC`,
            
            values : [this.filterStatus]
            
        }
        let lData : Array<IInventario | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array <IInventario | IErrorResponse>
        
        if(({...lData[0]} as IErrorResponse).error) return lData[0] as IErrorResponse
        return lData as Array <IInventario>
    }

    async getInventarioPag(): Promise<Array<IInventario> | IErrorResponse> {


        if(!this.infoExtra) this.infoExtra = {filter : {}}
        else if (!this.infoExtra!.filter) this.infoExtra = {filter :{}}
       
        let limit = this.infoExtra.filter.limit  || 50
        let offset = this.infoExtra.filter.offset  || 0 // inicia en 0 ... n-1
        let search_all = this.infoExtra.filter.search_all  || ''

            const queryData = {
                name : "get-inventario",
                text : `SELECT inv.id_piso, inv.id_articulo, inv.cantidad, ar.mobiliario, ar.stock, ar.total , pi.id_dispositivo_ref, pi.etiqueta
                        FROM ${Constants.tbl_inventario_da_sql} inv
                        INNER JOIN ${Constants.tbl_piso_sql} pi
                        ON pi.id = inv.id_piso
                        INNER JOIN ${Constants.tbl_articulos_da_sql} ar
                        ON ar.id = inv.id_articulo
                        WHERE
                        (
                            UNACCENT(lower(ar.mobiliario)) LIKE UNACCENT(lower($3)) OR
                            UNACCENT(lower(pi.etiqueta)) LIKE UNACCENT(lower($3)) OR
                            UNACCENT(lower(pi.id_dispositivo_ref)) LIKE UNACCENT(lower($3)) OR
                            $3 = ''
                        )
                        ORDER BY tag DESC
                        LIMIT $1 OFFSET $2
                        `,
                values : [
                    limit,
                    offset,
                    search_all === '' ? '' : `%${search_all}%`
                ]                     
                    
            }

            let lData: Array<IInventario | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IInventario | IErrorResponse>
            if ( ( {...lData[0] } as IErrorResponse).error) return lData[0] as IErrorResponse

            return lData as Array<IInventario>
        
    }
    async getById(id: BigInt): Promise <IInventario| IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    


    async getByIdPiso(id : BigInt) : Promise <Array<IInventario> | IErrorResponse > {
        let limit = this.infoExtra.filter.limit  || 50
        let offset = this.infoExtra.filter.offset  || 0 // inicia en 0 ... n-1

        const queryData = {
            name : 'get-inventario-x-piso',
            text : `SELECT inv.id_piso, inv.id_articulo, inv.cantidad, ar.mobiliario, ar.stock, ar.total , pi.id_dispositivo_ref, pi.etiqueta
            FROM ${Constants.tbl_inventario_da_sql} inv
            INNER JOIN ${Constants.tbl_piso_sql} pi
            ON pi.id = inv.id_piso
            INNER JOIN ${Constants.tbl_articulos_da_sql} ar
            ON ar.id = inv.id_articulo
            WHERE id_piso = $3
            ORDER BY tag DESC
            LIMIT $1 OFFSET $2` ,
            values : [
                limit,
                offset,
                id
            ]
        }
        let lData : Array <IInventario | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array <IInventario | IErrorResponse>

        if(({...lData[0]} as IErrorResponse).error) return lData[0] as IErrorResponse
        return lData as Array <IInventario>
    } 






    public async insert(data: IInventario): Promise<IInventario | IErrorResponse> {
        
        let responseD = await this.client.execQueryPool(async (client): Promise<Array<IModel | IErrorResponse>> =>{

            const queryData ={
                name : "insert-inventario",
                text: `INSERT INTO ${Constants.tbl_inventario_da_sql}(
                         id_piso,
                         id_articulo,
                         cantidad 
                         )
                         VALUES ($1 , $2 , $3) RETURNING *`,
                values: [
                    data.id_piso,
                    data.id_articulo,
                    data.cantidad
                ]
            }

        let lData = (await client.query(queryData)).rows as Array<IInventario | IErrorResponse>
        return lData
        })
        return ( responseD[0]) as IInventario | IErrorResponse
    }





    async update(id: BigInt, data: IInventario): Promise<IInventario | IErrorResponse> {
        throw new Error("Method not implemented.")
    }
    


    ///UPDATE SI SE COMPRA SE AÑADE AL ALMACEN

    async añadirArticulosComprado(data : IGrupoInventario) : Promise <IResponseGeneral | IErrorResponse>{

    let responseD = await this.client.execQueryPool(async (client) : Promise <Array <IModel |IErrorResponse>> =>{
            for(let i = 0 ; i < data.l_articulos.length ; i++){
                
        let queryData ={
            name :"update-inventario",
            text : `UPDATE ${Constants.tbl_inventario_da_sql} SET 
                    cantidad = cantidad + $3
                    WHERE id_piso = $1 AND id_articulo = $2   RETURNING *`,

            values : [
                data.id_piso,
                data.l_articulos[i].id_articulo,
                data.l_articulos[i].resta
            ]
        }
       
        let lData = (await client.query(queryData)).rows as Array <IInventario | IErrorResponse>

        let queryDataStock = {
            name : "update-stock",
            text : `UPDATE ${Constants.tbl_articulos_da_sql} SET 
                    stock = stock + $2
                    WHERE id = $1`,
            values : [
                data.l_articulos[i].id_articulo,
                data.l_articulos[i].resta
            ]
        }
        let lData_stock = (await client.query(queryDataStock)).rows as Array<IArticulo | IErrorResponse>
    }
        return [{text : "Todo ha salido correctamente"}] as Array <IResponseGeneral>

    } )
    return (responseD[0]) as IResponseGeneral | IErrorResponse
    } 


    /// MUEVE ESTRICTAMENTE DE LA OFICINA AL PISO QUE SE QUIERAN MOVER O CREAR EL INVENTARIO DEL ARTICULO QUE SE QUIERA


    async deleteFromOficeToPiso(data : IGrupoInventario): Promise<IResponseGeneral | IErrorResponse> {
        let responseD = await this.client.execQueryPool(async (client) : Promise<Array<IModel |IErrorResponse>>=>{


            for(let i = 0 ; i < data.l_articulos.length ; i++){

            const queryGetStock ={
                name : "select-stock-cantidad",
                text : `SELECT stock FROM ${Constants.tbl_articulos_da_sql}
                        WHERE id = $1`,
    
                values : [
                    data.l_articulos[i].id_articulo
                ]
            }
    
            let infoStockCantidad : Array<IArticulo | IErrorResponse> = (await client.query(queryGetStock)).rows as Array <IArticulo>
     
            if(infoStockCantidad){
                let stockCantidad = ((infoStockCantidad as Array <IArticulo>)[0].stock || 0) - data.l_articulos[i].resta
                if(stockCantidad < 0 ){
                     throw new Error('error stock', 
                    { 
                    cause:  {
                                code: Constants.error_field_stock_no_disponible_sql,
                                detail: 'Error en columna stock de tabla aticulos',
                                msg: 'test'
                            } 
                    } as ErrorOptions 
                )
                }
            }

          
            // SI EL ID DEL PISO DEL QUE SE ESTAN COGIENDO COSAS ES ALMACEN

            if(data.id_piso == BigInt(100)){ ////////////////////////////////////////////////////////////////////////////



            // ACTUALIZA EL STOCK DEL ARTICULO QUE SE ESTA MOVIENDO
            const queryUpdateStock = {
                name : "update-tabla-articulos-stock",
                text: `UPDATE ${Constants.tbl_articulos_da_sql} ar 
                SET stock = stock - $2
                WHERE ar.id = $1 RETURNING *`,
                values : [
                    data.l_articulos[i].id_articulo,
                    data.l_articulos[i].resta
                ]

                
            }
    
            // ACTUALIZA LA CANTIDAD DE OBJETOS QUE ESTAN SIENDO MOVIDOS EN EL INVENTARIO DE OFICINA


            let infoStock : Array <IArticulo | IErrorResponse> = (await client.query(queryUpdateStock)).rows as Array<IArticulo>

            const queryUpdate = {
                name : "update-tabla",
                text: `UPDATE ${Constants.tbl_inventario_da_sql} inv 
                SET cantidad = cantidad - $3
                WHERE id_piso = $1 AND id_articulo = $2 RETURNING *`,
                values : [
                    data.id_piso,
                    data.l_articulos[i].id_articulo,
                    data.l_articulos[i].resta
                ]
            }
    
            let lData = (await client.query(queryUpdate)).rows as Array <IInventario | IErrorResponse>


            // ACTUALIZA LA CANTIDAD DE ARTICULOS QUE HAY EN UN INVENTARIO SI EXISTE 

            const queryUpdateExistente = {
                name : "update-table-ya-existente", 
                text : `UPDATE ${Constants.tbl_inventario_da_sql} SET 
                        cantidad = cantidad + $3
                        WHERE id_piso = $1 AND id_articulo = $2 RETURNING *`,
                values : [
                    data.id_piso_mover, 
                    data.l_articulos[i].id_articulo,
                    data.l_articulos[i].resta
                ]
            }
            
        let lData3 = (await client.query(queryUpdateExistente)).rows as Array <IInventario | IErrorResponse>

            // SI NO EXISTE EL INVENTARIO LO CREA 

            if(lData3 && lData3.length == 0){
    
                const queryInsert = {
                    name : "insert-tabla",
                    text : `INSERT INTO ${Constants.tbl_inventario_da_sql}
                            (id_piso , id_articulo , cantidad)
                            VALUES ($1 , $2 , $3)
                            RETURNING *`,
                    values : [
                        data.id_piso_mover ,
                        data.l_articulos[i].id_articulo,
                        data.l_articulos[i].resta
                    ]
                }
            
                let lData2 = (await client.query(queryInsert)).rows as Array<IInventario | IErrorResponse>
               
            
            }


        }                 
        // SI EL PISO DEL QUE SE ESTA COGIENDO LOS ARTICULOS NO ES LA OFICINA ///////////////
        else if (data.id_piso !== BigInt(100)){

            // AÑADE SI EL PISO AL QUE SE ESTA MOVIENDO ES OFICINA

            if(data.id_piso_mover == BigInt(100)){

                // ACTUALIZA EL STOCK CUANDO SE MUEVE DE OTRO PISO A OFICINA
            const queryUpdateStock2 = {
                name : "update-tabla-articulos-stock",
                text: `UPDATE ${Constants.tbl_articulos_da_sql} ar 
                SET stock = stock + $2
                WHERE ar.id = $1 RETURNING *`,
                values : [
                    data.l_articulos[i].id_articulo,
                    data.l_articulos[i].resta
                ]
            }
            let infoStock : Array <IArticulo | IErrorResponse> = (await client.query(queryUpdateStock2)).rows as Array<IArticulo>

            // ACTUALIZA LA CANTIDAD SI SE MUEVE DE OTRO PISO A OFICINA

            const queryUpdate = {
                name : "update-tabla",
                text: `UPDATE ${Constants.tbl_inventario_da_sql} inv 
                SET cantidad = cantidad + $3
                WHERE id_piso = $1 AND id_articulo = $2 RETURNING *`,
                values : [
                    data.id_piso_mover,
                    data.l_articulos[i].id_articulo,
                    data.l_articulos[i].resta
                ]
            }
    
            let lData = (await client.query(queryUpdate)).rows as Array <IInventario | IErrorResponse>

            // QUITA LOS ARTICULOS DE OTRO PISO 

            const queryUpdateExistente = {
                name : "update-table-ya-existente", 
                text : `UPDATE ${Constants.tbl_inventario_da_sql} SET 
                        cantidad = cantidad - $3
                        WHERE id_piso = $1 AND id_articulo = $2 RETURNING *`,
                values : [
                    data.id_piso, 
                    data.l_articulos[i].id_articulo,
                    data.l_articulos[i].resta
                ]
            }
            
        let lData3 = (await client.query(queryUpdateExistente)).rows as Array <IInventario | IErrorResponse>
        }
        //// SI ES ENTRE PISOS INDEPENDIENTES 
        else {

            // QUITA DE UN PISO  XXXX
            const queryUpdate = {
                name : "update-tabla",
                text: `UPDATE ${Constants.tbl_inventario_da_sql} inv 
                SET cantidad = cantidad - $3
                WHERE id_piso = $1 AND id_articulo = $2 RETURNING *`,
                values : [
                    data.id_piso,
                    data.l_articulos[i].id_articulo,
                    data.l_articulos[i].resta
                ]
            }
    
            let lData = (await client.query(queryUpdate)).rows as Array <IInventario | IErrorResponse>

            // METE EN UN PISO YYYYYY

            const queryUpdateExistente = {
                name : "update-table-ya-existente", 
                text : `UPDATE ${Constants.tbl_inventario_da_sql} SET 
                        cantidad = cantidad + $3
                        WHERE id_piso = $1 AND id_articulo = $2 RETURNING *`,
                values : [
                    data.id_piso_mover, 
                    data.l_articulos[i].id_articulo,
                    data.l_articulos[i].resta
                ]
            }
            
        let lData3 = (await client.query(queryUpdateExistente)).rows as Array <IInventario | IErrorResponse>

            // SI NO EXISTE EL INVENTARIO LO CREA CON EL PISO YYYYY

            if(lData3 && lData3.length == 0){
    
                const queryInsert = {
                    name : "insert-tabla",
                    text : `INSERT INTO ${Constants.tbl_inventario_da_sql}
                            (id_piso , id_articulo , cantidad)
                            VALUES ($1 , $2 , $3)
                            RETURNING *`,
                    values : [
                        data.id_piso_mover ,
                        data.l_articulos[i].id_articulo,
                        data.l_articulos[i].resta
                    ]
                }
            
                let lData2 = (await client.query(queryInsert)).rows as Array<IInventario | IErrorResponse>
               
            
            }

        }

        }

        }
       
        
    
        /// FORZAR ERROR Y UN ROLLBACK ----- COSULTAR DbConnection , Util y Constants para ver el proceso ////


        // if(true){
            
        //     throw new Error('error stock', 
        //         { 
        //         cause:  {
                            // code: Constants.error_field_stock_no_disponible_sql,
        //                     detail: 'Error en columna stock de tabla aticulos',
        //                     msg: 'test'
        //                 } 
        //         } as ErrorOptions 
        //     )
        // }
        
        
        return [{text : "Todo ha salido correctamente"}] as Array <IResponseGeneral>
    })
    return (responseD [0]) as IResponseGeneral | IErrorResponse
    }


    // SI SE ROMPE O SI SE ESTA ENVIANDO A REPARAR

    async updateRuptura(data : IGrupoInventario) : Promise <IResponseGeneral | IErrorResponse> {
        let responseD = await this.client.execQueryPool(async (client) : Promise<Array<IModel |IErrorResponse>>=>{

            
            for(let i = 0 ; i < data.l_articulos.length ; i++){



                const queryGetStock ={
                    name : "select-cantidad",
                    text : `SELECT cantidad FROM ${Constants.tbl_inventario_da_sql}
                            WHERE id_piso = $1 AND id_articulo = $2`,
        
                    values : [
                        data.id_piso,
                        data.l_articulos[i].id_articulo
                    ]
                }
        
                let infoCantidad : Array<IInventario | IErrorResponse> = (await client.query(queryGetStock)).rows as Array <IInventario>
         
                if(infoCantidad){
                    let stockCantidad = ((infoCantidad as Array <IInventario>)[0].cantidad || 0) - data.l_articulos[i].resta
                    if(stockCantidad < 0 ){
                         throw new Error('error en la cantidad seleccionada', 
                        { 
                        cause:  {
                                    code: Constants.error_field_cantidad_no_disponible_sql,
                                    detail: 'Error en columna cantidad de tabla inventario',
                                    msg: 'test'
                                } 
                        } as ErrorOptions 
                    )
                    }
                }
                    // Quitar el articulo del inventario que se quiere enviar a repar
              
                    const queryUpdatePisoReparar = {
                        name : "update-piso-articulo-reparar",
                        text : `UPDATE ${Constants.tbl_inventario_da_sql} SET
                                cantidad = cantidad - $3
                                WHERE id_piso = $1 AND id_articulo = $2
                                RETURNING *`,
                        values : [
                            data.id_piso,
                            data.l_articulos[i].id_articulo,
                            data.l_articulos[i].resta
                        ]
                    }

                    let lDataReparar = (await client.query(queryUpdatePisoReparar)).rows as Array<IInventario | IErrorResponse>
                   


                    // Si existe el inventario de un articulo que esta en reparacion lo agrega
                    const queryUpdate = {
                        name : "update-inventario-reparar",
                        text : `UPDATE ${Constants.tbl_inventario_da_sql} SET
                                cantidad = cantidad + $3
                                WHERE id_piso = $1 AND id_articulo = $2
                                RETURNING *`,
                        values : [
                            101,
                            data.l_articulos[i].id_articulo,
                            data.l_articulos[i].resta
                        ]
                    }
                    let lDataReparando = (await client.query(queryUpdate)).rows as Array <IInventario | IErrorResponse>
                  
                    if(lDataReparando && lDataReparando.length == 0){

                        const creandoReparar = {
                            name : "crear-inventario-reparar",
                            text : `INSERT INTO ${Constants.tbl_inventario_da_sql}
                                    (
                                        id_piso,
                                        id_articulo,
                                        cantidad 
                                    )
                                    VALUES ($1 , $2 , $3)`,
                            values : [
                                101,
                                data.l_articulos[i].id_articulo,
                                data.l_articulos[i].resta
                            ]
                        }
                        let lDataInventarioREparar = (await client.query(creandoReparar)).rows as Array<IInventario | IErrorResponse>
                     
                    }

            }
            return [{text : "Se ha movido al inventario de reparar"}]
        })
        

        return (responseD[0]) as IResponseGeneral | IErrorResponse
    }

    async delete(id: BigInt): Promise<IInventario | IErrorResponse> {
        throw new Error("Method not implemented.")
    }

    async updateRoto (data : IGrupoInventario) : Promise <IResponseGeneral | IErrorResponse>{
        let responseD = await this.client.execQueryPool(async (client) : Promise<Array<IModel |IErrorResponse>>=>{

            for(let i = 0; i < data.l_articulos.length ; i ++){

                const queryData = {
                    name : "eliminar-roto",
                    text : `UPDATE ${Constants.tbl_inventario_da_sql} SET
                            cantidad = cantidad - $3
                            WHERE id_piso = $1 AND id_articulo = $2 RETURNING *`,
                    values : [
                        data.id_piso,
                        data.l_articulos[i].id_articulo,
                        data.l_articulos[i].resta
                    ]
                }

                let lData = (await client.query(queryData)).rows as Array<IInventario | IErrorResponse>


                const queryTotal = {
                    name : "edit-total",
                    text : `UPDATE ${Constants.tbl_articulos_da_sql} SET
                            total = total - $2
                            WHERE id = $1 RETURNING *` , 
                    values : [
                        
                        data.l_articulos[i].id_articulo,
                        data.l_articulos[i].resta
                    ]
                }

                let lDataTotal = (await client.query(queryTotal)).rows as Array <IArticulo | IErrorResponse>
            }

            return [{text : "Se ha eliminado el objeto porque se ha roto"}]
        })
        return (responseD[0]) as IResponseGeneral | IErrorResponse

    }
    
}

export default InventarioDataAccess