import { SignJWT, importPKCS8 } from 'https://deno.land/x/jose@v5.9.6/index.ts'

export const getAPIURL = (free: boolean) => free ? "https://devapi.qweather.com/" : "https://api.qweather.com/"

export const generateToken = async (YourPrivateKey: string, YourKeyID: string, YourProjectID: string) => {
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

export const getUrl = (path: string, free: boolean = true) => {
  return `${getAPIURL(free)}${path}`
}

export const get7DaysWeather = async (location: string, token: string, free: boolean = true) => {
  const res = await fetch(getUrl(`v7/weather/7d?${new URLSearchParams({ location }).toString()}`, free), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`
    },
  })
  return await res.text()
}