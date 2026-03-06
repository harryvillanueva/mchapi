import { IModel } from "../helpers/IModel"
import { ActionType } from "../types/GlobalTypes"
import { ICode } from "./ICode"
import { IKey } from "./IKey"
import { ILogsApartment } from "./ILogsApartment"

export interface IActionsLogApartment extends IModel {
      log_data: ILogsApartment
      code_data?: ICode
      key_data?: IKey
      registrar_es?: boolean
}