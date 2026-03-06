import { Client, QueryConfig, types, Pool, PoolClient } from 'pg';
import UtilInstance from './Util';
import { IModel } from './IModel';
import { IErrorSql } from '../modelsextra/IErrorSql';
import { IErrorResponse } from '../modelsextra/IErrorResponse';
import DbConfigurationInstance from './DbConfiguration';

class DbConnection {
      private _connectionString = (() => {
            let conn = DbConfigurationInstance.getConnectionStringPostgres();
            // Si ya tiene parámetros, añade &sslmode=disable, si no, añade ?sslmode=disable
            if (conn.includes('?')) {
                  conn += '&sslmode=disable';
            } else {
                  conn += '?sslmode=disable';
            }
            return conn;
      })()
      private _connection: Client | Pool
      
      constructor( public isTransactions: boolean = false ) {
            // Cambiar el formato de tipo de bigint to int
            types.setTypeParser(types.builtins.INT8, UtilInstance.parseInteger)
            // No cambiar el formato de fecha guardado previamente [TIMESTAMP]
            types.setTypeParser(types.builtins.TIMESTAMP, UtilInstance.noParse)
            // No cambiar el formato de fecha guardado previamente [DATE]
            types.setTypeParser(types.builtins.DATE, UtilInstance.noParse)
            // Create conexion
            this._connection = ( isTransactions ) ? new Pool({
                                                                  connectionString: this._connectionString,
                                                                  max: 20,
                                                                  idleTimeoutMillis: 30000,
                                                                  connectionTimeoutMillis: 10000,
                                                            })
                                                            : new Client({connectionString: this._connectionString})
      }

      /**
       * Para insertar registros en varias tablas dependientes
       * @param callback 
       * @returns 
       */
      public async execQueryPool(callback: (client: PoolClient) => Promise<Array<IModel | IErrorResponse>>): Promise<Array<IModel | IErrorResponse>> {
            let dataDB: Array<IModel | IErrorResponse> = []
            let client = (await this._connection.connect()) as PoolClient
            try {
                  await client.query('BEGIN')
                  try {
                        dataDB = await callback(client)
                        await client.query('COMMIT')
                        //// establecer un error forzando un rollback 
                  } catch (err) {
                        await client.query('ROLLBACK')
                        let _dataError = err
                        try{
                              let _tmp = (err as Error).cause
                              if ( _tmp ) _dataError = { ..._tmp }
                        }catch(e){}
                        
                              // Log completo del error de la transacción para facilitar diagnóstico
                              try {
                                    const _err: any = err
                                    console.error('[DEBUG] execQueryPool - transaction error:', _err && _err.message ? _err.message : _err)
                                    if (_err.code) console.error('[DEBUG] execQueryPool - error.code:', _err.code)
                                    if (_err.detail) console.error('[DEBUG] execQueryPool - error.detail:', _err.detail)
                                    if (_err.stack) console.error('[DEBUG] execQueryPool - stack:', _err.stack)
                                    // If the error contains query info (from upstream), print it
                                    if (_err.query) {
                                          try { console.error('[DEBUG] execQueryPool - error.query:', JSON.stringify(_err.query)) } catch(e) { console.error('[DEBUG] execQueryPool - error.query (raw):', _err.query) }
                                    }
                              } catch (logErr) {
                                    console.error('[DEBUG] execQueryPool - failed to log error details', logErr)
                              }

                        let errorCustom: IErrorSql = _dataError as IErrorSql
                        let errorDB = UtilInstance.getErrorSql(errorCustom.code, errorCustom.detail, errorCustom.msg)
                        if ( errorDB ) dataDB = [ { error: 'Error sql', data: [ errorDB ] } ]
                        else dataDB = [ { error: 'Error sql-pool desconocido!', data: [] } ]
                  }
            } finally {
                  client.release()
            }

            return dataDB
      }

      /**
       * Consultas y hacer insert en una sola tabla
       * @param query 
       * @returns 
       */
      async exeQuery(query: QueryConfig): Promise<Array<IModel | IErrorResponse>> {
            let dataDB: Array<IModel | IErrorResponse> = []
            await (
                  this._connection
                  .connect()
                  .then(async () => {
                        await (     this._connection.query(query)
                                          .then(result => {
                                                dataDB = [ ...result.rows ]
                                          })
                                          .catch(err => {
                                                // Log completo para depuración: mensaje, código, detalle y query
                                                try {
                                                      console.log('[DEBUG] exeQuery error: message=', (err && err.message) || err)
                                                      console.log('[DEBUG] exeQuery error code=', (err && err.code) || 'N/A')
                                                      console.log('[DEBUG] exeQuery error detail=', (err && (err.detail || err.msg)) || 'N/A')
                                                      console.log('[DEBUG] exeQuery query text=', (query && (query as any).text) || 'N/A')
                                                      console.log('[DEBUG] exeQuery query values=', (query && (query as any).values) || 'N/A')
                                                      if ((err as any).stack) console.log('[DEBUG] exeQuery stack:', (err as any).stack)
                                                } catch (e) {
                                                      console.log('[DEBUG] exeQuery error while logging error:', e)
                                                }

                                                let errorCustom: IErrorSql = err as IErrorSql
                                                let errorDB = UtilInstance.getErrorSql(errorCustom.code, errorCustom.detail)
                                                // console.log(errorCustom)
                                                if ( errorDB ) dataDB = [ { error: 'Error sql', data: [ errorDB ] } ]
                                                else dataDB = [ { error: 'Error sql desconocido!', data: [] } ]
                                          })
                                          .then(() => {
                                                this._connection.end()
                                          })
                              )
                  })
                  .catch(err => {
                        console.log('Connection error!! Details:', err.message, 'Code:', err.code)
                        console.log('Connection string:', this._connectionString)
                        dataDB = [ { error: 'Error connection sql!', data: [] } ]
                  })
            )

            return dataDB
      }
}

export default DbConnection