import http from 'http'
import url from 'url'
import fs from 'fs'
import path from 'path'
import open from 'open'
import request from 'request'
import ExtendedError from './ExtendedError'
import {
  isNonEmptyString, 
  Deferred,
  mkDeferred,
  encodeBase64,
  genRandom,
  genRandomString,
  sha256,
  startTimeout
} from './utils'

export 
type AuthResponse = { code: string }

export
type TokenResponse = {
  access_token: string;
  refresh_token: string;
}

export 
type OpenUrlCallback = (url: string) => Promise<unknown>

export
type Config = {
  timeout: number
  port: number
  auth0Domain: string
  auth0ClientId: string
  auth0TokenScope: string
  auth0TokenAudience: string
  successfulLoginHtmlFile: string
  failedLoginHtmlFile: string
}

/**
 * At the end of the authentication process, that did not time out, it might take a couple of seconds
 * for the NodeJS HTTP server to close.
 */
export
class Auth0LoginProcessor {
  private readonly server: http.Server = http.createServer(this.handleAuth0Response.bind(this))
  private csrfToken: string = ''
  private codeVerifier: string = ''
  private authResponse: Deferred<AuthResponse> = mkDeferred()
  
  constructor(
    public readonly config: Config
  ) {
    if (typeof config !== 'object') { throw new Error(`Config is required.`) }
    if (typeof config.port !== 'number' || config.port < 1 || config.port > 65535) { throw new Error(`Invalid port number in config.`) }
    if (typeof config.timeout !== 'number' || config.timeout < 0) { throw new Error(`Invalid timeout value.`) }
    if (typeof config.auth0Domain !== 'string') { throw new Error(`Invalid auth0Domain string.`) }
    if (typeof config.auth0ClientId !== 'string') { throw new Error(`Invalid auth0ClientId string.`) }
    if (typeof config.auth0TokenScope !== 'string') { throw new Error(`Invalid auth0TokenScope string.`) }
    if (typeof config.auth0TokenAudience !== 'string') { throw new Error(`Invalid auth0TokenAudience string.`) }
    if (typeof config.successfulLoginHtmlFile !== 'string') { throw new Error(`Invalid successfulLoginHtmlFile path.`)}
    if (typeof config.failedLoginHtmlFile !== 'string') { throw new Error(`Invalid failedLoginHtmlFile path.`)}
  }

  public async runLoginProcess(): Promise<TokenResponse> {
    this.codeVerifier = encodeBase64(genRandom(32))
    this.csrfToken = genRandomString(16)
    this.authResponse = mkDeferred()

    await this.startServer()

    const codeChallenge = encodeBase64(sha256(Buffer.from(this.codeVerifier)))
    const authenticationUrl = this.getAuthenticationUrl(codeChallenge, this.csrfToken)

    try {
      await open(authenticationUrl)
    } catch (err) {
      throw new ExtendedError('Failed to open authentication URL. See inner error for details.', err)
    }

    const loginTimeout = startTimeout<AuthResponse>(this.config.timeout)
    const auth0Response = this.authResponse.promise.catch((err) => { throw new ExtendedError(`Authentication failed`, err) })
    const timeoutExpiration = loginTimeout.promise.catch(() => { throw new Error(`Authentication process timed out.`) })

    try {
      const authResponse = await Promise.race([auth0Response, timeoutExpiration])
      return this.getToken(this.codeVerifier, authResponse.code)
    } finally {
      loginTimeout.cancel()
      this.stopServer()
    }
  }

  private async getToken(codeVerifier: string, code: string): Promise<TokenResponse> {
    return new Promise((resolve, reject) => {
      const requestParams = {
        url: `https://${this.config.auth0Domain}/oauth/token`,
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        form: {
          grant_type: 'authorization_code',
          client_id: this.config.auth0ClientId,
          code_verifier: codeVerifier,
          code: code,
          redirect_uri: `http://localhost:${this.config.port}`
        }
      }

      request.post(requestParams, (err, response, body) => {
        if (err || response.statusCode !== 200) {
          return reject(new ExtendedError('Failed to get an access token. See inner error for details.', err))
        }
  
        try {
          const data = JSON.parse(body)
          if (!data || typeof data.access_token !== 'string' || data.token_type !== 'Bearer') {
            reject(new Error('Invalid token data detected in response from server.'))
          }
  
          resolve(data)
        } catch (err) {
          reject(new ExtendedError('Unable to parse tokens for unknown reason. See inner error for details.', err))
        }
      })
    })
  }

  private async startServer(): Promise<void> {
    if (this.server.listening) { return }

    return new Promise((resolve, reject) => {
      this.server.listen(this.config.port, (err?: Error) => {
        if (err) {
          return reject(new ExtendedError(`Unable to start an HTTP server on port ${this.config.port}. See inner error for details.`, err))
        }
  
        resolve()
      })
    })
  }

  private async stopServer(): Promise<void> {
    if (!this.server.listening) { return }

    try {
      this.server.close()
    } catch (err) {
      throw new ExtendedError('Failed to stop HTTP server. See inner error for details.', err)
    }
  }

  private handleAuth0Response(req: http.IncomingMessage, res: http.ServerResponse): void {
    const urlQuery = url.parse(req.url || '', true).query
    const { code, state, error: message, error_description: description } = urlQuery

    if (isNonEmptyString(code) && state === this.csrfToken) {
      res.write(fs.readFileSync(path.resolve(this.config.successfulLoginHtmlFile)))
      this.authResponse.resolve({ code })
    } else {
      const formattedMessage = message === "access_denied" ? "Access Denied" : message;

      res.write(fs.readFileSync(path.resolve(this.config.failedLoginHtmlFile)))
      this.authResponse.reject({ message: formattedMessage })
    }

    res.end()
  }

  private getAuthenticationUrl(codeChallenge: string, state: string): string {
    return [
      `https://${this.config.auth0Domain}/authorize`,
      `?response_type=code`,
      `&code_challenge=${codeChallenge}`,
      `&code_challenge_method=S256`,
      `&client_id=${this.config.auth0ClientId}`,
      `&redirect_uri=http://localhost:${this.config.port}`,
      `&scope=${encodeURI(this.config.auth0TokenScope)}`,
      `&audience=${this.config.auth0TokenAudience}`,
      `&state=${state}`,
    ].join('')
  }
}