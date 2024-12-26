import { Daily } from "./daily.ts"
import { Hourly } from "./hourly.ts"
import { Now } from "./now.ts";

export interface ResultBody {
  /**
   * 状态码
   */
  code?: string
  /**
   * 当前API的最近更新时间
   */
  updateTime: string
  /**
   * 当前数据的响应式页面
   */
  fxLink: string
  /**
   * 来源和版权声明
   */
  refer: {
    /**
     * 原始数据来源，或数据源说明，可能为空
     */
    sources?: string[]
    /**
     * 数据许可或版权声明，可能为空
     */
    license?: string[]
  }
  error?: object
}
export interface ResultWeatherDaily extends ResultBody {
  /**
   * 预报天气
   */
  daily: Daily[]
}
export interface ResultWeatherHourly extends ResultBody {
  /**
   * 逐小时天气
   */
  hourly: Hourly[]
}
export interface ResultWeatherNow extends ResultBody {
  /**
   * 实时天气
   */
  now: Now
}
