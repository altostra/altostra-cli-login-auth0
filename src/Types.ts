import { isObject } from './utils'

export type DataExtractor<Token> = (value: unknown) => Token
export type OpenUrlCallback = (url: string) => Promise<unknown>

export interface AccessToken {
  access_token: string
}

export function accessTokenParser(value: unknown): AccessToken {
  if (
    isObject(value) &&
    typeof value.access_token === 'string' &&
    value.token_type === 'Bearer'
  ) {
    return {
      access_token: value.access_token
    }
  }

  throw new Error('Invalid access token.')
}

export interface RefreshToken {
  refresh_token: string
}

export function refreshTokenParser(value: unknown): RefreshToken {
  if (
    isObject(value) &&
    typeof value.refresh_token === 'string' &&
    value.token_type === 'Bearer'
  ) {
    return {
      refresh_token: value.refresh_token
    }
  }

  throw new Error('Invalid refresh token.')
}

export type ComboToken = AccessToken & RefreshToken

export function comboTokenParser(value: unknown): ComboToken {
  return {
    ...accessTokenParser(value),
    ...refreshTokenParser(value)
  }
}