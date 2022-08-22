import { StatusCodes as StandartStatusCode } from 'http-status-codes'

export enum CustomStatusCodes {
  LOGIN_TIME_OUT = 440,
}
export type StatusCodeType = StandartStatusCode | CustomStatusCodes
export const StatusCode = { ...StandartStatusCode, ...CustomStatusCodes }
