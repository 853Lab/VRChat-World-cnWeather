import { Daily } from "./daily.ts"
import { Hourly } from "./hourly.ts"
import { Now } from "./now.ts"

export interface Weather {
  /**
   * 当前API的最近更新时间
   */
  updateTime: string
  /**
   * 当前数据的响应式页面
   */
  fxLink: string
  /**
   * 实时天气
   */
  now?: Now
  /**
   * 预报天气
   */
  daily: Daily[]
  /**
   * 逐小时天气
   */
  hourly: Hourly[]
  /**
   * 数据来源
   */
  source: string[]
  /**
   * 数据许可或版权声明
   */
  license: string[]
}
