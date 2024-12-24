import { SignJWT, importPKCS8 } from 'https://deno.land/x/jose@v5.9.6/index.ts'
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

const generateToken = async (YourPrivateKey: string, YourKeyID: string, YourProjectID: string) => {
  const privateKey = await importPKCS8(YourPrivateKey, 'EdDSA')
  const customHeader = {
    alg: 'EdDSA',
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