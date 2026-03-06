import { IApartment } from "../models/IApartment"
import { IKey } from "../models/IKey"
import { ILogsApartment } from "../models/ILogsApartment"

export interface IApartmentDetails extends IApartment {
      codigo?: string
      dias?: number
      fecha_vig_inicio?: string
      fecha_vig_fin?: string
      timestampInicio?: number
      timestampFin?: number
      keys?: Array<IKey>
      logs?: Array<ILogsApartment>
      etiqueta_dispositivo?: string
}