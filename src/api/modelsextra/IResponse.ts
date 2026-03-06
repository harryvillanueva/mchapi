import { IModel } from "../helpers/IModel";

export interface IResponse {
      data: IModel | Array<IModel>
      token?: string
      exp?: number
}