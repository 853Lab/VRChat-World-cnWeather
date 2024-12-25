/**
 * 预报天气
 */
export interface Daily {
  /**
   * 预报日期
   */
  fxDate: string
  /**
   * 日出时间
   */
  sunrise: string
  /**
   * 日落时间
   */
  sunset: string
  /**
   * 月升时间
   */
  moonrise?: string
  /**
   * 月落时间
   */
  moonset?: string
  /**
   * 月相
   */
  moonPhase: string
  /**
   * 月相图标代码：https://dev.qweather.com/docs/resource/icons/
   */
  moonPhaseIcon: string
  /**
   * 最高温度
   */
  tempMax: string
  /**
   * 最低温度
   */
  tempMin: string
  /**
   * 预报白天天气状况的图标代码：https://dev.qweather.com/docs/resource/icons/
   */
  iconDay: string
  /**
   * 白天天气
   */
  textDay: string
  /**
   * 预报夜间天气状况的图标代码：https://dev.qweather.com/docs/resource/icons/
   */
  iconNight: string
  /**
   * 夜间天气
   */
  textNight: string
  /**
   * 预报白天风向360角度
   */
  wind360Day: string
  /**
   * 预报白天风向
   */
  windDirDay: string
  /**
   * 预报白天风力等级
   */
  windScaleDay: string
  /**
   * 预报白天风速，公里/小时
   */
  windSpeedDay: string
  /**
   * 预报夜间风向360角度
   */
  wind360Night: string
  /**
   * 预报夜间当天风向
   */
  windDirNight: string
  /**
   * 预报夜间风力等级
   */
  windScaleNight: string
  /**
   * 预报夜间风速，公里/小时
   */
  windSpeedNight: string
  /**
   * 相对湿度，百分比数值
   */
  humidity: string
  /**
   * 预报当天总降水量，默认单位：毫米
   */
  precip: string
  /**
   * 大气压强，默认单位：百帕
   */
  pressure: string
  /**
   * 能见度，默认单位：公里
   */
  vis: string
  /**
   * 云量，百分比数值。可能为空
   */
  cloud?: string
  /**
   * 紫外线强度指数
   */
  uvIndex: string
}