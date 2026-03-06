import { IDevice } from "./IDevice";

export interface IMovil extends IDevice {
      version_app?: string,
      ip?: string,
      macwifi?: string
}
