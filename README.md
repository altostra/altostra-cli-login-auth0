# CLI login with Auth0

A library that abstracts and automates the process of logging in with Auth0 from CLI.

## Installation
`npm install @altostra/auth0-cli-login`

## Usage
Import the class `Auth0LoginProcessor` and create a new instance.
<br>
To start the login process call the method `runLoginProcess` on the instance.
The method returns a promise object that resolves to a `JsonToken` object. `JsonToken` is a type exported by this package.

## Configuration
The class takes as parameter the configuration of your Auth0 application details as well as some additional parameters required for the library to work.

### Auth0 Application Details
- `auth0Domain`
- `auth0ClientId`
- `auth0TokenScope`
- `auth0TokenAudience`

You can find these values in the your Auth0 application details in the Auth0 management website.

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
