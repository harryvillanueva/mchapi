// Minimal ambient declaration for `process` when @types/node isn't installed
declare const process: any

class DbConfiguration {
      private _isDev: boolean
      constructor() {
            this._isDev = process.argv.slice(2)[0] === 'dev'
      }

      getConnectionStringPostgres(): string {
            const env = this._isDev
                  ? {
                        user: process.env.POSTGRES_DEV_USER,
                        password: process.env.POSTGRES_DEV_PASSWORD,
                        host: process.env.POSTGRES_DEV_HOST,
                        port: process.env.POSTGRES_DEV_PORT,
                        db: process.env.POSTGRES_DEV_DB,
                  }
                  : {
                        user: process.env.POSTGRES_PROD_USER,
                        password: process.env.POSTGRES_PROD_PASSWORD,
                        host: process.env.POSTGRES_PROD_HOST,
                        port: process.env.POSTGRES_PROD_PORT,
                        db: process.env.POSTGRES_PROD_DB,
                  }

            const user = env.user ?? ''
            const password = env.password ?? ''
            const host = env.host ?? ''
            const port = env.port ?? ''
            const db = env.db ?? ''

            // If any required part is missing, return empty string so caller can handle the error
            if (!user || !password || !host || !port || !db) return ''

            // encode user/password to be safe
            const u = encodeURIComponent(user)
            const p = encodeURIComponent(password)

            return `postgres://${u}:${p}@${host}:${port}/${db}`
      }
}

const DbConfigurationInstance = new DbConfiguration()
Object.freeze(DbConfigurationInstance)

export default DbConfigurationInstance