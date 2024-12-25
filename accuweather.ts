import { AccuLocation } from "./location.ts"
import * as cheerio from "npm:cheerio"
import { Daily } from "./models/daily.ts"
import { Hourly } from "./models/hourly.ts"
import { Weather } from "./models/weather.ts"

export const getURL = "https://www.accuweather.com"

export const getRequest = async (urlPath: string, client?: Deno.HttpClient) => {
  const url = `${getURL}${urlPath}`
  const headers = {
    "accept-encoding": "gzip, deflate, br, zstd",
    "accept-language": "zh-CN,zh;q=0.9,zh-TW;q=0.8,en;q=0.7,ja;q=0.6",
    "sec-ch-ua": "\"Microsoft Edge\";v=\"131\", \"Chromium\";v=\"131\", \"Not_A Brand\";v=\"24\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    // cookie: 'awx_user=tp:C|lang:zh-cn',
    cookie: 'awx_user=tp:C',
    Referer: "https://www.accuweather.com/",
  }
  let res: Response
  if (client) {
    res = await fetch(url, {
      method: "GET",
      headers,
      client
    })
  }
  else {
    res = await fetch(url, {
      method: "GET",
      headers
    })
  }
  const result = await res.text()
  if (!result) {
    console.error("Failed to fetch weather data")
    return null
  }
  return result
}

export const convertTime12to24 = (time12h: string) => {
  let [hours, minutes] = time12h.split(":")
  const modifier = hours.slice(0, 2)
  hours = hours.slice(2).padStart(2, "0")

  if (hours === "12") {
    hours = "00"
  }

  if (modifier === "PM") {
    hours = (parseInt(hours, 10) + 12).toString()
  }

  return `${hours}:${minutes}`
}
export const getDailyWeather = async (location: string, client?: Deno.HttpClient) => {
  const htmltext = await getRequest(AccuLocation[location], client)
  if (!htmltext) {
    return null
  }
  return getDailyWeatherHtml(htmltext)
}

export const getDailyWeatherHtml = (htmltext: string) => {
  const dailys: Daily[] = []
  const document = cheerio.load(htmltext)
  const datenow = new Date()
  let year = datenow.getFullYear()
  document(".daily-list-body > .daily-list-item").map((_i, el) => {
    const element = document(el)
    const [month,day] = element.find(".date > p:nth-child(2)").text().trim().split("/")
    // 如果 date 是 1/ 开头， datenow.getMonth() 是 12，说明 date 是明年的
    if (year === datenow.getFullYear() && month === "1" && datenow.getMonth() === 11) {
      year++
    }
    const fxDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
    const tempMax = element.find(".temp-phrase-wrapper > .temp > .temp-hi").text().trim().replaceAll("°", "")
    const tempMin = element.find(".temp-phrase-wrapper > .temp > .temp-lo").text().trim().replaceAll("°", "")
    const iconDay = element.find(".icon").attr("src")?.split("/").pop()?.split(".")[0]
    const iconNight = element.find(".night-icon").attr("src")?.split("/").pop()?.split(".")[0]
    const textDay = element.find(".phrase > .no-wrap").text().trim()
    const textNight = element.find(".phrase > .night > .no-wrap").text().trim()
    const humidity = element.find(".precip").text().trim().replace("%", "")
    dailys.push({
      fxDate,
      sunrise: "",
      sunset: "",
      moonPhase: "",
      moonPhaseIcon: "",
      tempMax,
      tempMin,
      iconDay: iconDay || "",
      textDay,
      iconNight: iconNight || "",
      textNight,
      wind360Day: "",
      windDirDay: "",
      windScaleDay: "",
      windSpeedDay: "",
      wind360Night: "",
      windDirNight: "",
      windScaleNight: "",
      windSpeedNight: "",
      humidity,
      precip: "",
      pressure: "",
      vis: "",
      uvIndex: ""
    })
  })
  document(".sunrise-sunset__body > .sunrise-sunset__item > .sunrise-sunset__times > .sunrise-sunset__times-item > .sunrise-sunset__times-value").map((i, el) => {
    const data = document(el).text().trim()
    switch (i) {
      case 0:
        dailys[0].sunrise = convertTime12to24(data)
        break
      case 1:
        dailys[0].sunset = convertTime12to24(data)
        break
      case 2:
        dailys[0].moonrise = convertTime12to24(data)
        break
      case 3:
        dailys[0].moonset = convertTime12to24(data)
        break
    }
  })
  return dailys
}

export const getHourlyWeather = async (location: string, client?: Deno.HttpClient) => {
  const htmltext = await getRequest(AccuLocation[location].replaceAll("/weather-forecast/", "/hourly-weather-forecast/"), client)
  if (!htmltext) {
    return null
  }
  return getHourlyWeatherHtml(htmltext)
}

export const convertTimeTextto24 = (text: string) => {
  const timetext = text.replaceAll("时", "")
  const ispm = timetext.startsWith("下午")
  const hours = parseInt(timetext.slice(2), 10)

  if (hours === 12) {
    return `00:00`
  }

  if (ispm) {
    return `${hours + 12}:00`
  }

  return `${hours.toString().padStart(2, "0")}:00`
}

export const FormatWithTimezone = (date: Date, timezone: string): string => {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: timezone, // 使用输入的时区
    hourCycle: 'h23', // 保持 24 小时制
  }
  const parts = new Intl.DateTimeFormat('en-GB', options).formatToParts(date)

  // 拼接成 ISO8601 格式
  const [year, month, day, hour, minute, second] = [
    parts.find(p => p.type === 'year')?.value,
    parts.find(p => p.type === 'month')?.value,
    parts.find(p => p.type === 'day')?.value,
    parts.find(p => p.type === 'hour')?.value,
    parts.find(p => p.type === 'minute')?.value,
    parts.find(p => p.type === 'second')?.value,
  ]

  return `${year}-${month}-${day}T${hour}:${minute}:${second}${timezone}`
}

export const getHourlyWeatherHtml = (htmltext: string) => {
  const hourlys: Hourly[] = []
  const document = cheerio.load(htmltext)
  document(".hourly-list__list > .hourly-list__list__item").map((_i, el) => {
    const element = document(el)
    const fxTime = convertTimeTextto24(element.find(".hourly-list__list__item-time").text().trim())
    const temp = element.find(".hourly-list__list__item-temp").text().trim().replaceAll("°", "")
    const humidity = element.find(".hourly-list__list__item-precip > .rain.drop").text().trim().replaceAll("°", "")
    const icon = element.find(".hourly-list__list__item-icon").attr("src")?.split("/").pop()?.split(".")[0]
    hourlys.push({
      fxTime,
      temp,
      icon: icon || "",
      text: "",
      wind360: "",
      windDir: "",
      windScale: "",
      windSpeed: "",
      humidity,
      precip: "",
      pressure: ""
    })
  })
  return hourlys
}

export const getWeather = async (location: string, client?: Deno.HttpClient) => {
  const urlPath = AccuLocation[location]
  if (!urlPath) {
    console.error(`Location not found: ${location}`)
    return null
  }
  const htmltext = await getRequest(urlPath, client)
  if (!htmltext) {
    return null
  }
  const daily = getDailyWeatherHtml(htmltext)
  const hourly = getHourlyWeatherHtml(htmltext)
  const updateTime = FormatWithTimezone(new Date(), "+08:00")
  const weather: Weather = {
    // 2024-12-24T22:13+08:00
    updateTime,
    fxLink: `${getURL}${urlPath}`,
    daily,
    hourly,
    source: ["AccuWeather"],
    license: []
  }
  return weather
}