
import { parseArgs } from "jsr:@std/cli/parse-args"
import * as fs from "jsr:@std/fs"
import * as path from "jsr:@std/path"
import * as qweather from "./qweather.ts"
import * as accuweather from "./accuweather.ts"
import { QLocation } from "./location.ts";

let client: Deno.HttpClient | undefined

const flags = parseArgs(Deno.args, {
  boolean: ["free"],
  string: [
    "private",
    "key",
    "project",
    "export",
    "proxy",
  ],
  default: {
    free: true,
    export: "dev",
  },
})
if (!flags.private || !flags.key || !flags.project) {
  console.error("Missing required flags")
  Deno.exit(1)
}

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
const qLocations = (await Deno.readTextFile(path.join(".", "location", "QLocation")))
  .split("\n")
  .map(location => location.trim())
  .filter(location => !!location)

const AccuLocations = (await Deno.readTextFile(path.join(".", "location", "AccuLocation")))
  .split("\n")
  .map(location => location.trim())
  .filter(location => !!location)

const token = await qweather.generateToken(privateKey, flags.key, flags.project)

const saveData = await qweather.getAllDailyWeather(qLocations, token, flags.free)
const qLocations2 = qLocations.filter(location => !AccuLocations.includes(QLocation[location] || location))
// console.log(qLocations2)
const saveData2 = await qweather.getAllHourlyWeather(qLocations2, token, flags.free)

// 合并数据
for (const location in saveData2) {
  saveData[location].hourly = saveData2[location].hourly
}

for (const location of AccuLocations) {
  if (!location) continue
  const daysWeather = await accuweather.getWeather(location, client)
  if (!daysWeather) continue
  const data = saveData[location]
  if (!data) {
    saveData[location] = daysWeather
    continue
  }
  let hevePushData = false
  if (saveData[location].daily.length === 0) {
    saveData[location].daily = daysWeather.daily
    hevePushData = true
  }
  // else for (const daily of daysWeather.daily) {
  //   // 寻找 saveData[location].daily 中是否有相同日期的 fxDate 数据
  //   const index = saveData[location].daily.findIndex(d => d.fxDate === daily.fxDate)
  //   if (index === -1) {
  //     saveData[location].daily.push(daily)
  //   }
  //   else {
  //     const keys = Object.keys(daily)
  //     for (const key of keys) {
  //       if (key === "fxDate") continue
  //       // @ts-ignore: Object is possibly 'undefined'.
  //       saveData[location].daily[index][key] = daily[key] || saveData[location].daily[index][key]
  //     }
  //   }
  // }
  if (saveData[location].hourly.length === 0) {
    saveData[location].hourly = daysWeather.hourly
    hevePushData = true
  }
  // else for (const hourly of daysWeather.hourly) {
  //   // 寻找 saveData[location].daily 中是否有相同日期的 fxDate 数据
  //   const index = saveData[location].hourly.findIndex(d => d.fxTime === hourly.fxTime)
  //   if (index === -1) {
  //     saveData[location].hourly.push(hourly)
  //   }
  //   else {
  //     const keys = Object.keys(hourly)
  //     for (const key of keys) {
  //       if (key === "fxTime") continue
  //       // @ts-ignore: Object is possibly 'undefined'.
  //       saveData[location].hourly[index][key] = hourly[key] || saveData[location].hourly[index][key]
  //     }
  //   }
  // }
  if (hevePushData) {
    saveData[location].source.push(...daysWeather.source.filter(s => !saveData[location].source.includes(s)))
    saveData[location].license.push(...daysWeather.license.filter(s => !saveData[location].license.includes(s)))
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
await Deno.writeTextFile(filepath, JSON.stringify(saveData, null, 2))
