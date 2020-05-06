# CLI login with Auth0

A library that abstracts and automates the process of logging in with Auth0 from CLI.

## Installation
```sh
npm install @altostra/cli-login-auth0
```

## Usage
Import the class `Auth0LoginProcessor` and create a new instance.
```TypeScript
import * as path from 'path'
import { 
  Auth0LoginProcessor, 
  tryGetAccessToken 
} from '@altostra/cli-login-auth0'

const loginProcessor = new Auth0LoginProcessor({
  auth0ClientId: 'your-client-id',
  auth0Domain: 'your-domain.auth0.com',
  auth0TokenAudience: 'target-audience',
  auth0TokenScope: 'profile',
  port: 42224,
  timeout: 30000,
  successfulLoginHtmlFile: path.resolve(__dirname, 'success.html'),
  failedLoginHtmlFile: path.resolve(__dirname, 'failure.html')
}, tryGetAccessToken)
```
The first parameter is an object of configuration values for the login processor.
For details on the configuration parameters, see the [Configuration](#Configuration) section below.

The second parameter is of type:
```TypeScript
type DataExtractor<T> = (value: unknown) => T
```
The login processor uses this function at the end of a successful login process to extract the data you want from the Auth0 response.

The library comes with a few simple, but common, data extractors that you can use out of the box:
```TypeScript
// Get an access token from the response
interface AccessToken { access_token: string }
type tryGetAccessToken = (value: unknown) => AccessToken

// Get a refresh token from the response
interface RefreshToken { refresh_token: string }
type tryGetRefreshToken = (value: unknown) => RefreshToken

// Get both the access and refresh tokens from the response
type ComboToken = AccessToken & RefreshToken
type tryGetComboToken = (value: unknown) => ComboToken
```

Any of the data extracotrs above will throw an `ExtendedError` (see details below) if the requested data is not found in the response.

#### The ExtendedError type
This is a utility type defined in the library that provides you with context specicifc errors for the login process and wraps any Auth0 errors inside of it. It extends the `Error` type.

## Starting the login process

Now that you have the Login Processor configured, you can start the login process by calling the method `runLoginProcess`. 
```TypeScript
try {
  const result = await loginProcessor.runLoginProcess()

  console.log(result)
} catch (err) {
  console.error('Authentication failed', err)
}
```

When you run the login process, a browser will open to authenticate the user. When done, the browser will redirect to the locally running HTTP server and will open either of the pages you provided in configuration, `successfulLoginHtmlFile` or `failedLoginHtmlFile`.

## Configuration
The class takes as parameter the configuration of your Auth0 application details as well as some additional parameters required for the library to work.

### Auth0 Application Details
You can find the information for your Auth0 settings in your [application settings](https://manage.auth0.com/#/applications).

### `auth0ClientId`
Your application clientId in Auth0.

### `auth0Domain`
Your Auth0 domain. Usually your-account.auth0.com.

### `auth0TokenAudience`
The target audience for the requested token.

### `auth0TokenScope`
The target scope for the requested token.

### `port`
The local port to listen on for a response from the Auth0 redirect.

### `timeout`
The duration to wait for the response from Auth0 before the process fails.

### `successfulLoginHtmlFile`
Path to a local HTML file to present to the user if the login process succeeds.

### `failedLoginHtmlFile`
Path to a local HTML file to present to the user if the login process fails.

## Notes
The library starts a local HTTP server to listen for incoming HTTP connections on the port you specify. Make sure the port you're using is not already taken by another process. Since this code will probably be running in the wild, try to pick a port that's unlikley to be in use (don't use ports lik 8080, 8181, etc.).

We recommend you set the timeout to a reasonable value to allow users to complete the log-in process on the Auth0 website. It does take some time for the browser to open, the page to load and for the users to interact with the UI, maybe even type a wong password or approve the application on their social account.
