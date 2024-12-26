import { SignJWT, importPKCS8 } from "https://deno.land/x/jose@v5.9.6/index.ts"
import { Weather } from "./models/weather.ts"
import { QLocation } from "./location.ts"
import { ResultWeatherDaily, ResultWeatherHourly, ResultWeatherNow } from "./models/qweather.ts"

export const getAPIURL = (free: boolean) => free ? "https://devapi.qweather.com" : "https://api.qweather.com"

export const generateToken = async (YourPrivateKey: string, YourKeyID: string, YourProjectID: string) => {
  const privateKey = await importPKCS8(YourPrivateKey, "EdDSA")
  const customHeader = {
    alg: "EdDSA",
    kid: YourKeyID
  }
  const iat = Math.floor(Date.now() / 1000) - 30
  const exp = iat + 900
  const customPayload = {
    sub: YourProjectID,
    iat: iat,
    exp: exp
  }
  const token = await new SignJWT(customPayload)
    .setProtectedHeader(customHeader)
    .sign(privateKey)

  return token
}

export const getUrl = (urlPath: string, free: boolean = true) => {
  return `${getAPIURL(free)}${urlPath}`
}

export const getRequest = async (urlPath: string, token: string, free: boolean = true, client?: Deno.HttpClient) => {
  const url = getUrl(urlPath, free)
  const headers = {
    Authorization: `Bearer ${token}`
  }
  let res: Response
  if (client) {
    res = await fetch(url, {
      method: "GET",
      headers,
      client,
    })
  }
  else {
    res = await fetch(url, {
      method: "GET",
      headers,
    })
  }
  const result = await res.text()
  if (!result) {
    console.error("Failed to fetch weather data")
    return undefined
  }
  return result
}

export const getDailyWeather = async (location: string, token: string, free: boolean = true, client?: Deno.HttpClient) => {
  const result = await getRequest(`/v7/weather/7d?${new URLSearchParams({ location, lang: "zh-hans" }).toString()}`, token, free, client)
  if (!result) {
    console.error("Failed to fetch weather data")
    return undefined
  }
  const data: ResultWeatherDaily = JSON.parse(result)
  if (data.code != "200" || data.error) {
    console.error(data)
    return undefined
  }
  const weather: Weather = {
    updateTime: data.updateTime,
    fxLink: data.fxLink,
    daily: data.daily,
    hourly: [],
    source: data.refer.sources || [],
    license: data.refer.license || [],
  }
  return weather
}
export const getHourlyWeather = async (location: string, token: string, free: boolean = true, client?: Deno.HttpClient) => {
  const result = await getRequest(`/v7/weather/24h?${new URLSearchParams({ location, lang: "zh-hans" }).toString()}`, token, free, client)
  if (!result) {
    console.error("Failed to fetch weather data")
    return undefined
  }
  const data: ResultWeatherHourly = JSON.parse(result)
  if (data.code != "200" || data.error) {
    console.error(data)
    return undefined
  }
  const weather: Weather = {
    updateTime: data.updateTime,
    fxLink: data.fxLink,
    daily: [],
    hourly: data.hourly,
    source: data.refer.sources || [],
    license: data.refer.license || [],
  }
  return weather
}
export const getNowWeather = async (location: string, token: string, free: boolean = true, client?: Deno.HttpClient) => {
  const result = await getRequest(`/v7/weather/now?${new URLSearchParams({ location, lang: "zh-hans" }).toString()}`, token, free, client)
  if (!result) {
    console.error("Failed to fetch weather data")
    return undefined
  }
  const data: ResultWeatherNow = JSON.parse(result)
  if (data.code != "200" || data.error) {
    console.error(data)
    return undefined
  }
  const weather: Weather = {
    updateTime: data.updateTime,
    fxLink: data.fxLink,
    now: data.now,
    daily: [],
    hourly: [],
    source: data.refer.sources || [],
    license: data.refer.license || [],
  }
  return weather
}

export const getAllDailyWeather = async (locations: string[], token: string, free: boolean = true, client?: Deno.HttpClient) => {
  const saveData: Record<string, Weather> = {}

  for (const location of locations) {
    if (!location) continue
    const daysWeather = await getDailyWeather(location, token, free, client)
    if (!daysWeather) continue
    saveData[QLocation[location] || location] = daysWeather
  }
  return saveData
}

export const getAllHourlyWeather = async (locations: string[], token: string, free: boolean = true, client?: Deno.HttpClient) => {
  const saveData: Record<string, Weather> = {}

  for (const location of locations) {
    if (!location) continue
    const hourlysWeather = await getHourlyWeather(location, token, free, client)
    if (!hourlysWeather) continue
    saveData[QLocation[location] || location] = hourlysWeather
  }
  return saveData
}

export const getAllNowWeather = async (locations: string[], token: string, free: boolean = true, client?: Deno.HttpClient) => {
  const saveData: Record<string, Weather> = {}

  for (const location of locations) {
    if (!location) continue
    const nowWeather = await getNowWeather(location, token, free, client)
    if (!nowWeather) continue
    saveData[QLocation[location] || location] = nowWeather
  }
  return saveData
}
