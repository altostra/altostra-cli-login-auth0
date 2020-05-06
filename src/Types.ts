export type DataExtractor<T> = (value: unknown) => T
export type OpenUrlCallback = (url: string) => Promise<unknown>

export interface AccessToken {
  access_token: string
}

export interface RefreshToken {
  refresh_token: string
}
