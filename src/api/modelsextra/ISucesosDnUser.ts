import { ISucesosDn } from "../models/ISucesosDn"

export interface ISucesosDnUser extends ISucesosDn {
    // datos del prescriptor NO DB
    nombres_suceso?: string
    telefono_suceso?: string
    correo_suceso?: string
    ref_lead?: string

    // variable identificar accion sobre usuario
    type_action?: string
}