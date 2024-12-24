import { Daily } from "./daily.ts"

export interface ResultBody extends Weather {
  /**
   * 状态码
   */
  code?: string
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
   * 预报天气
   */
  daily: Daily[]
}
export interface SaveBody {
  /**
   * 各地区天气数据
   */
  weathers: Record<string, Weather>
  /**
   * 数据来源
   */
  source: string
  /**
   * 数据许可或版权声明
   */
  license: string
}
