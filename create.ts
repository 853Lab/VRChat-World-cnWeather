
import { parseArgs } from "jsr:@std/cli/parse-args"

const flags = parseArgs(Deno.args, {
  string: [
    "private",
    "key",
    "project"
  ],
})
if (!flags.private || !flags.key || !flags.project) {
  console.error("Missing required flags")
  Deno.exit(1)
}
