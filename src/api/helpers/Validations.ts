// Nota: evitar importar APIs internas de Next.js como `loadDefaultErrorComponents`.
// Esa importación provocaba errores con ciertas versiones de Next (no exportado).
// Se eliminó la importación porque no se usa en este módulo.
import { ActionType, CityType, CountryType, LocationDataType, ResultType, StatusDataType, TypeActionCardType, TypeCardType, TypeDeviceType, etapaType, horarioType, jornadaType } from "../types/GlobalTypes"

import Constants from "./Constants"

class Validations {

      constructor() { }

      /**
       * 
       * @param value 
       * @returns 
       */
      checkEmail(value: string): boolean {
            return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(value)
      }

      /**
       * 
       * @param value 
       * @returns 
       */
      checkUrl(value: string): boolean {
            // return /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/.test(value)
            return /^(?:(?:(?:(http|https)?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(value)

      }

      /**
       * 
       * @param value 
       * @returns 
       */
      checkIp(value: string): boolean {
            return /^(https?:\/\/)?((\d{1,3}\.){3}\d{1,3}|localhost)(:\d{2,5})?(\/[^\s]*)?$/.test(value)
      }
      /**
       * Verifica el formato de fecha, para insertar a SQL
       * @param value Formato de fecha [YYYY-MM-DD HH-MM-SS]
       * @returns 
       */
      checkFormatDateTimeSQL(value: string): boolean {
            if (!value || typeof value !== 'string') return false
            // Aceptar dos formatos comunes:
            // 1) YYYY-MM-DD HH:MM:SS (espacio)
            // 2) ISO 8601: YYYY-MM-DDTHH:MM:SS(.sss)Z o sin Z
            const sqlLike = /^\d{4}-\d{2}-\d{2} (0[0-9]|1\d|2[0-3]):([0-5]\d):([0-5]\d)$/
            const isoLike = /^\d{4}-\d{2}-\d{2}T(0[0-9]|1\d|2[0-3]):([0-5]\d):([0-5]\d)(?:\.\d+)?Z?$/
            return sqlLike.test(value) || isoLike.test(value)
      }

      /**
      * Verifica el formato de fecha, para insertar a SQL
      * @param value Formato de fecha [YYYY-MM-DD]
      * @returns 
      */
      checkFormatDateSQL(value: string): boolean {
            return /\d{2,4}-\d{1,2}-\d{1,2}$/.test(value)
      }

      /**
       * 
       * @param value 
       * @returns 
       */
      isEmpty(value: string): boolean {
            return value.toString().trim() === ''
      }

      /**
       * 
       * @param value 
       * @param min incluido
       * @returns 
       */
      checkMinLetters(value: string, min: number = 10): boolean {
            return value.trim().length >= min
      }

      /**
       * 
       * @param value 
       * @param min incluido
       * @returns 
       */
      checkMaxLetters(value: string, max: number = 100): boolean {
            return value.trim().length <= max
      }

      /**
       * Verifica el número de caracteres de un texto
       * @param value 
       * @param lengthStr 
       * @returns 
       */
      checkLengthStr(value: string, lengthStr: number = 0): boolean {
            return value.trim().length === lengthStr
      }

      /**
       * 
       * @param value 
       * @param min incluido
       * @param max incluido
       * @returns 
       */
      checkLettersRange(value: string, min: number, max: number): boolean {
            return value.trim().length >= min && value.trim().length <= max
      }

      /**
       * 
       * @param value 
       * @returns 
       */
      checkNumberMayorCero(value: number): boolean {
            return value > 0
      }

      /**
       * 
       * @param value 
       * @param letter 
       * @returns 
       */
      checkStartStr(value: string, letter: string): boolean {
            return value.includes(letter)
      }

      /**
       * 
       * @param value 
       * @returns 
       */
      checkSymbol(value: string): boolean {

            const symbolRegex = /[^a-zA-Z0-9-_]/;
            return !symbolRegex.test(value);
      }

      /**
     * 
     * @param value 
     * @returns 
     */
      checkNumberMayorOIgualACero(value: number): boolean {
            return value >= 0
      }
      /**
       * Verifica si value esta dentro del rango, ambos extremos incluidos [..., x, ...]
       * @param value 
       * @param min 
       * @param max `
       * @returns 
       */
      checkNumberRange(value: number, min: number, max: number): boolean {
            return value >= min && value <= max
      }


      checkStatus(value: StatusDataType): boolean {
            let statusIsValid = Constants.getStatus().filter(el => el == value)[0]
            return statusIsValid !== undefined
      }

      checkCountry(value: CountryType): boolean {
            let statusIsValid = Constants.getCountries().filter(el => el == value)[0]
            return statusIsValid !== undefined
      }

      checkCity(value: CityType): boolean {
            let statusIsValid = Constants.getCities().filter(el => el == value)[0]
            return statusIsValid !== undefined
      }

      checkAction(value: ActionType): boolean {
            let dataIsValid = Constants.getActions().filter(el => el == value)[0]
            return dataIsValid !== undefined
      }

      checkResultAction(value: ResultType): boolean {
            let dataIsValid = Constants.getResultsAction().filter(el => el == value)[0]
            return dataIsValid !== undefined
      }

      checkLocationCard(value: LocationDataType): boolean {
            let dataIsValid = Constants.getLocationCard().filter(el => el == value)[0]
            return dataIsValid !== undefined
      }

      checkyTypeCard(value: TypeCardType): boolean {
            let dataIsValid = Constants.getTypeCard().filter(el => el == value)[0]
            return dataIsValid !== undefined
      }

      checkyTypeActionCard(value: TypeActionCardType): boolean {
            let dataIsValid = Constants.getTypeActionCard().filter(el => el == value)[0]
            return dataIsValid !== undefined
      }


      checkJornada(text: jornadaType | undefined): boolean {
            return ['Jornada Completa', 'Media Jornada'].includes(text || '')
      }

      checkTypeDevice(value: TypeDeviceType): boolean {
            return [Constants.type_device_telefonillo, Constants.type_device_camara, Constants.type_device_lock, Constants.type_device_movil, Constants.type_device_router, Constants.type_device_sonoff, Constants.type_device_ttlock].includes(value)
      }

      checkTypeCard(value: TypeCardType): boolean {
            return [Constants.card_type_normal, Constants.card_type_maestra].includes(value)
      }

      checkLocationTypes(value: LocationDataType): boolean {
            return [Constants.card_location_oficina, Constants.card_location_piso].includes(value)
      }

      checkEtapa(text: etapaType | undefined): boolean {
            return ['Prácticas Estudiantes', 'Período de Prueba', 'Profesional', 'Empleado Categoría 1', 'Empleado Categoría 2'].includes(text || '')
      }

      checkHorario(text: horarioType | undefined): boolean {
            return ['HM', 'HT', 'HC'].includes(text || '')
      }

}

const ValidationsInstance = new Validations()
Object.freeze(ValidationsInstance)

export default ValidationsInstance