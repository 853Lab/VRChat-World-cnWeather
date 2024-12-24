
import { parseArgs } from "jsr:@std/cli/parse-args"
import { generateToken } from "./Method.ts"

const flags = parseArgs(Deno.args, {
  boolean: ["free"],
  string: [
    "private",
    "key",
    "project",
    "locations",
    "export",
  ],
  default: { free: true },
})
if (!flags.private || !flags.key || !flags.project || !flags.locations) {
  console.error("Missing required flags")
  Deno.exit(1)
}
// Base64 解码
const privateKey = atob(flags.private)

const token = await generateToken(privateKey, flags.key, flags.project)

console.log(token)