
import { parseArgs } from "jsr:@std/cli/parse-args"
import * as fs from "jsr:@std/fs"
import * as path from "jsr:@std/path"
import * as qweather from "./qweather.ts"
import * as accuweather from "./accuweather.ts"
import { QLocation } from "./location.ts"
import { Weather } from "./models/weather.ts"
import { FormatWithTimezoneLite } from "./accuweather.ts"

let client: Deno.HttpClient | undefined

const flags = parseArgs(Deno.args, {
  boolean: ["free", "qweather", "accuweather"],
  string: [
    "private",
    "key",
    "project",
    "export",
    "proxy",
    "mode",
    "saveurl",
  ],
  default: {
    free: true,
    qweather: true,
    accuweather: false,
    export: "dev",
    mode: "all",
  },
})
if (!flags.private || !flags.key || !flags.project) {
  console.error("Missing required flags")
  Deno.exit(1)
}

const mode = flags.mode.split(",")

if (flags.proxy) {
  client = Deno.createHttpClient({
    proxy: {
      url: flags.proxy,
    },
  })
}

// Base64 解码
const privateKey = atob(flags.private)
// 从 location/QLocation 中获取所有的 location 并筛选出有效的 location
const qLocations: string[] = []
if (await fs.exists(path.join(".", "location", "QLocation"))) {
  qLocations.push(...(await Deno.readTextFile(path.join(".", "location", "QLocation")))
    .split("\n")
    .map(location => location.trim())
    .filter(location => !!location)
  )
}

const AccuLocations: string[] = []
if (await fs.exists(path.join(".", "location", "AccuLocation"))) {
  AccuLocations.push(...(await Deno.readTextFile(path.join(".", "location", "AccuLocation")))
    .split("\n")
    .map(location => location.trim())
    .filter(location => !!location)
  )
}

const token = await qweather.generateToken(privateKey, flags.key, flags.project)

const saveData: Record<string, Weather> = {}
if (flags.saveurl) {
  let saveDataOld: Record<string, Weather>
  if (flags.saveurl !== "test") {
    // 从 saveurl 中下载数据
    try {
      const url = `${flags.saveurl}${flags.export}.json`
      saveDataOld = await (await fetch(url)).json()
    } catch (error) {
      console.error(`Failed to fetch data: ${error}`)
      saveDataOld = {}
    }
  }
  else {
    saveDataOld = JSON.parse(await Deno.readTextFile(path.join(".", "pages", `${flags.export}.json`)))
  }
  for (const location in saveDataOld) {
    saveData[location] = saveDataOld[location]
  }
}
let needWait = false
if (flags.qweather && qLocations.length > 0) {
  if (mode.includes("all") || mode.includes("qwdaily") || mode.includes("alldaily")) {
    console.log("get all daily weather...")
    const saveData1 = await qweather.getAllDailyWeather(qLocations, token, flags.free)
    console.log("get all daily weather...Done")
    needWait = true
    for (const location in saveData1) {
      if (!saveData[location]) {
        saveData[location] = saveData1[location]
        continue
      }
      saveData[location].updateTime = saveData1[location].updateTime
      saveData[location].fxLink = saveData1[location].fxLink
      saveData[location].daily = saveData1[location].daily
      saveData[location].source.push(...saveData1[location].source.filter(s => !saveData[location].source.includes(s)))
      saveData[location].license.push(...saveData1[location].license.filter(s => !saveData[location].license.includes(s)))
    }
  }
  if (mode.includes("all") || mode.includes("qwnow") || mode.includes("allnow")) {
    if (needWait) {
      console.log("wait 61s...")
      await new Promise(resolve => setTimeout(resolve, 61000))
      console.log("wait 61s...Done")
      needWait = false
    }
    console.log("get all now weather...")
    const saveData1 = await qweather.getAllNowWeather(qLocations, token, flags.free)
    console.log("get all now weather...Done")
    needWait = true
    for (const location in saveData1) {
      if (!saveData[location]) {
        saveData[location] = saveData1[location]
        continue
      }
      saveData[location].updateTime = saveData1[location].updateTime
      saveData[location].fxLink = saveData1[location].fxLink
      saveData[location].now = saveData1[location].now
      saveData[location].source.push(...saveData1[location].source.filter(s => !saveData[location].source.includes(s)))
      saveData[location].license.push(...saveData1[location].license.filter(s => !saveData[location].license.includes(s)))
    }
  }
  if (mode.includes("all") || mode.includes("qwhourly") || mode.includes("allhourly")) {
    if (needWait) {
      console.log("wait 61s...")
      await new Promise(resolve => setTimeout(resolve, 61000))
      console.log("wait 61s...Done")
      needWait = false
    }
    const qLocations2 = qLocations
    if (mode.includes("all") || mode.includes("allhourly")) {
      qLocations2.length = 0
      qLocations2.push(...qLocations.filter(location => !AccuLocations.includes(QLocation[location] || location)))
    }
    console.log("get all hourly weather...")
    const saveData1 = await qweather.getAllHourlyWeather(qLocations2, token, flags.free)
    console.log("get all hourly weather...Done")
    needWait = true
    // 合并数据
    for (const location in saveData1) {
      if (!saveData[location]) {
        saveData[location] = saveData1[location]
        continue
      }
      saveData[location].updateTime = saveData1[location].updateTime
      saveData[location].fxLink = saveData1[location].fxLink
      saveData[location].hourly = saveData1[location].hourly
      saveData[location].source.push(...saveData1[location].source.filter(s => !saveData[location].source.includes(s)))
      saveData[location].license.push(...saveData1[location].license.filter(s => !saveData[location].license.includes(s)))
    }
  }
}

if (flags.accuweather && AccuLocations.length > 0) {
  if (mode.includes("all") || mode.includes("accuwhourly") || mode.includes("accuwdaily") || mode.includes("allhourly") || mode.includes("alldaily")) {
    for (const location of AccuLocations) {
      if (!location) continue
      const daysWeather = await accuweather.getWeather(location, client)
      if (!daysWeather) continue
      const location_ = QLocation[location] || location
      if (!saveData[QLocation[location_]]) {
        saveData[location_] = daysWeather
        continue
      }
      let hevePushData = false
      if (saveData[location_].daily.length === 0) {
        saveData[location_].daily = daysWeather.daily
        hevePushData = true
      }
      if (saveData[location_].hourly.length === 0) {
        saveData[location_].hourly = daysWeather.hourly
        hevePushData = true
      }
      if (!saveData[location_].now) {
        saveData[location_].now = daysWeather.now
        hevePushData = true
      }
      if (hevePushData) {
        saveData[location_].source.push(...daysWeather.source.filter(s => !saveData[location_].source.includes(s)))
        saveData[location_].license.push(...daysWeather.license.filter(s => !saveData[location_].license.includes(s)))
      }
    }
  }
}

// 格式化保存
const folder = path.join(".", "pages")
const filepath = path.join(folder, `${flags.export}.json`)
if (!await fs.exists(folder)) {
  await Deno.mkdir(folder, { recursive: true })
}
if (await fs.exists(filepath)) {
  await Deno.remove(filepath)
}
await Deno.writeTextFile(filepath, JSON.stringify(saveData))

const newSaveData: Record<string, Record<string, Weather>> = {}
for (const locationWithAdm1 in saveData) {
  let [adm1Name, location]: [string, string] = ["", ""]
  if (!locationWithAdm1.includes("|")) {
    adm1Name = "olddata"
    location = locationWithAdm1
  }
  else {
    [adm1Name, location] = locationWithAdm1.split("|")
  }
  if (!newSaveData[adm1Name]) {
    newSaveData[adm1Name] = {}
  }
  newSaveData[adm1Name][location] = saveData[locationWithAdm1]
}

const filepath2 = path.join(folder, `${flags.export}2.json`)
if (await fs.exists(filepath2)) {
  await Deno.remove(filepath2)
}
await Deno.writeTextFile(filepath2, JSON.stringify(newSaveData))

// 保活
if (await fs.exists("updatetime.txt")) {
  await Deno.remove("updatetime.txt")
}
await Deno.writeTextFile("updatetime.txt", FormatWithTimezoneLite(new Date(), "+08:00"))
