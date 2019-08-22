import { Auth0LoginProcessor } from '../src/Auth0LoginProcessor'
import path from 'path'

const sut = new Auth0LoginProcessor({
  auth0ClientId: '',
  auth0Domain: '',
  auth0TokenAudience: '',
  auth0TokenScope: 'profile',
  port: 42224,
  timeout: 30000,
  successfulLoginHtmlFile: path.resolve(__dirname, 'success.html'),
  failedLoginHtmlFile: path.resolve(__dirname, 'failure.html')
})

async function test() {
  const result = await sut.runLoginProcess()

  console.log(result)
}

test().then(console.log).catch(console.log)