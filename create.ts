
import { parseArgs } from "jsr:@std/cli/parse-args"
import * as fs from "jsr:@std/fs"
import * as path from "jsr:@std/path"
import { generateToken, get7DaysWeather } from "./Method.ts"
import { Location } from "./location.ts"
import { ResultBody, SaveBody } from "./models/weather.ts"

const flags = parseArgs(Deno.args, {
  boolean: ["free"],
  string: [
    "private",
    "key",
    "project",
    "locations",
    "export",
  ],
  default: {
    free: true,
    export: "dev",
    locations: "101020100",
  },
})
if (!flags.private || !flags.key || !flags.project) {
  console.error("Missing required flags")
  Deno.exit(1)
}
// Base64 解码
const privateKey = atob(flags.private)
const locations = flags.locations.split(",").map(location => location.trim())

const token = await generateToken(privateKey, flags.key, flags.project)

const saveData: SaveBody = {
  weathers: {},
  source: "",
  license: "",
}

for (const location of locations) {
  if (!location) continue
  const result = await get7DaysWeather(location, token, flags.free)
  if (!result) {
    console.error("Failed to fetch weather data")
    Deno.exit(1)
  }
  const data: ResultBody = JSON.parse(result)
  if (data.code != "200" || data.error) {
    console.log(data)
    continue
  }
  saveData.weathers[Location[location] || location] = {
    updateTime: data.updateTime,
    fxLink: data.fxLink,
    daily: data.daily
  }
  if (!saveData.source) saveData.source = data.refer.sources?.join(",") || ""
  if (!saveData.license) saveData.license = data.refer.license?.join(",") || ""
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
