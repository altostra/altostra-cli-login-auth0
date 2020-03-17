import { isObject } from './utils'

export type DataExtractor<T> = (value: unknown) => T
export type OpenUrlCallback = (url: string) => Promise<unknown>

export interface AccessToken {
  access_token: string
}

export function tryGetAccessToken(value: unknown): AccessToken {
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

export function tryGetRefreshToken(value: unknown): RefreshToken {
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

export function tryGetComboToken(value: unknown): ComboToken {
  return {
    ...tryGetAccessToken(value),
    ...tryGetRefreshToken(value)
  }
}