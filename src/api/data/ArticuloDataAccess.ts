import DbConnection from "../helpers/DbConnection";
import { IDataAccess } from "../helpers/IDataAccess";
import UtilInstance from "../helpers/Util";
import { IErrorResponse } from "../modelsextra/IErrorResponse";
import Constants from "../helpers/Constants";
import { StatusDataType } from "../types/GlobalTypes";
import { IModel } from "../helpers/IModel";
import { IArticulo } from "../models/IArticulo";
import { IResponse } from "../modelsextra/IResponse";
import { IInventario } from "../models/IInventario";


class ArticuloDataAccess implements IDataAccess<IArticulo> {
    public client : DbConnection

    constructor(
        public idUserLogin : BigInt,
        public filterStatus: StatusDataType,
        public isTransactions : boolean,
        public infoExtra?: any)  
    {
        this.client = new DbConnection(isTransactions)
    }


    async get() : Promise<Array<IArticulo>|IErrorResponse>{
        throw new Error("Method not implemented.")
    }


    async getArticulsPag(): Promise<Array<IArticulo> | IErrorResponse>{
        if(!this.infoExtra) this.infoExtra = { filter : {}}
        else if(!this.infoExtra!.filter) this.infoExtra = {filter : {}}


        let limit = this.infoExtra.filter.limit || 50
        let offset = this.infoExtra.filter.offset || 0
        let search_all = this.infoExtra.filter.search_all || ''
        
        const queryData = {
            name : "get-articulos-pag",
            text : `SELECT * FROM  ${Constants.tbl_articulos_da_sql} 
                    WHERE 
                    (
                        UNACCENT(lower(tag)) LIKE UNACCENT(lower($3)) OR
                        UNACCENT(lower(mobiliario)) LIKE UNACCENT(lower($3)) OR
                        $3 = ''
                    )
                    ORDER BY tag DESC
                    LIMIT $1 OFFSET  $2
                    `,
            
            values : [
                limit,
                offset,
                search_all === '' ? '' : `%${search_all}%`
            ]
        }

        let lData : Array <IArticulo | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IArticulo | IErrorResponse>

        if( ( {...lData[0]} as IErrorResponse).error ) return lData[0] as IErrorResponse
        return lData as Array<IArticulo>
    }

    
    async getById(id: BigInt): Promise<IArticulo | IErrorResponse> {
        throw new Error("Method not implemented.")
    }


    // CREA UN ARTICULO Y CREA A LA VEZ UN INVENTARIO EN PISO YA RELACIONADO
    
    public async insert(data : IArticulo) : Promise <IArticulo | IErrorResponse>{
        
        let responseD = await this.client.execQueryPool(async (client): Promise <Array<IModel | IErrorResponse>> =>{

            const timeStampCurrent = UtilInstance.getDateCurrentForSQL()

            const queryData = {
                name : "insert-articulo",
                text : `INSERT INTO ${Constants.tbl_articulos_da_sql}(
                        tag,
                        mobiliario,
                        descripcion,
                        precio,
                        fecha_registro,
                        fecha_compra,
                        meses_antiguedad,
                        depreciacion,
                        valor_depreciacion,
                        propietario,
                        notas,
                        url_imagen,
                        stock,
                        total,
                        estado)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8,
                            $9, $10, $11, $12, $13, $14, $15)
                            RETURNING *`,

            values : [
                data.tag,
                data.mobiliario,
                data.descripcion,
                data.precio,
                timeStampCurrent,
                data.fecha_compra,
                data.meses_antiguedad,
                data.depreciacion,
                data.valor_depreciacion,
                data.propietario,
                data.notas,
                data.url_imagen,
                data.stock,
                data.total,
                data.estado
            ]
            }

        let lData = (await client.query(queryData)).rows as Array<IArticulo |IErrorResponse>
        let id_insert = ((lData as Array <IArticulo>)[0].id)

            const queryDataInventario ={
                name : "insert-articulo-inventario",
                text : `INSERT INTO ${Constants.tbl_inventario_da_sql}
                        (id_piso,
                        id_articulo,
                        cantidad)
                        VALUES ($1 , $2 , $3)`,
                
                values : [100, id_insert, data.stock]
            }

        let lData2 = (await client.query(queryDataInventario)).rows as Array<IInventario | IErrorResponse>
        return lData

        })
        return (responseD[0]) as IArticulo | IErrorResponse
    }


    async update(id: BigInt, data: IArticulo): Promise<IArticulo | IErrorResponse> {
        
       let responseD = await this.client.execQueryPool(async (client): Promise <Array <IModel | IErrorResponse>> =>{
        let queryData = {
            name : "update-articulos",
            text : `UPDATE ${Constants.tbl_articulos_da_sql} SET
                    tag= $1,
                    mobiliario= $2,
                    descripcion = $3,
                    precio = $4,
                    fecha_compra = $5,
                    meses_antiguedad = $6,
                    depreciacion = $7,
                    valor_depreciacion = $8,
                    propietario = $9,
                    notas = $10,
                    url_imagen = $11,
                    stock = $12,
                    total = $13,
                    estado = $14
                    WHERE id = $15  AND estado >= $16 RETURNING *`,
            values : [
                data.tag,
                data.mobiliario,
                data.descripcion,
                data.precio,
                data.fecha_compra,
                data.meses_antiguedad,
                data.depreciacion,
                data.valor_depreciacion,
                data.propietario,
                data.notas,
                data.url_imagen,
                data.stock,
                data.total,
                data.estado,
                id,
                this.filterStatus
            ]
        }

      
        let lData = (await client.query(queryData)).rows as Array <IArticulo | IErrorResponse>
      
        return lData
       });
       return ( responseD[0] ) as IArticulo | IErrorResponse
    }

    async delete(id: BigInt): Promise<IArticulo | IErrorResponse> {
        let responseD = await this.client.execQueryPool(async (client) : Promise <Array<IModel | IErrorResponse>> =>{



            const queryGetArticulo ={
                name : "get-articulo",
                text : `SELECT stock , total 
                        FROM ${Constants.tbl_articulos_da_sql}
                        WHERE id = $1`,
                values : [id]
            }

            let dataArticulo = (await client.query(queryGetArticulo)). rows as Array<IArticulo>
            let aritucloDB = (dataArticulo.length !== 0) ? dataArticulo[0] : {} as IArticulo
            const queryData = {
                name: "delete-articulo",
                text: `UPDATE ${Constants.tbl_articulos_da_sql} SET
                        estado = $1,                         
                        stock = $2,
                        total = $3
                        WHERE id = $4 AND estado >= $5 RETURNING *`,

                values : [
                    Constants.code_status_delete,
                    `${aritucloDB.stock}`,
                    `${aritucloDB.total}`,
                    id,
                    this.filterStatus
                ]
            }
            
        let lData : Array<IArticulo | IErrorResponse> = (await this.client.exeQuery(queryData)) as Array<IArticulo |IErrorResponse>
        console.log(lData)
        return lData
        })
        return ( responseD[0]) as IArticulo | IErrorResponse
}

        

    
}

export default ArticuloDataAccess