require('dotenv').config()
const SpotifyWebApi = require('spotify-web-api-node')
const express = require('express')
const fs = require('fs')


//scopes
const scopes = [
  'ugc-image-upload',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'streaming',
  'app-remote-control',
  'user-read-email',
  'user-read-private',
  'playlist-read-collaborative',
  'playlist-modify-public',
  'playlist-read-private',
  'playlist-modify-private',
  'user-library-modify',
  'user-library-read',
  'user-top-read',
  'user-read-playback-position',
  'user-read-recently-played',
  'user-follow-read',
  'user-follow-modify'
]


// connect to spotifyApi
const spotifyApi = new SpotifyWebApi({
  redirectUri: 'http://localhost:8888/callback',
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET
})

// routes
const app = express()

app.get('/login', (req, res) => {
  res.redirect(spotifyApi.createAuthorizeURL(scopes))
})

app.get('/callback', (req, res) => {
  const error = req.query.error
  const code = req.query.code
  const state = req.query.state

  if (error) {
    console.error('Callback Error:', error)
    res.send(`Callback Error: ${error}`)
    return
  }


  spotifyApi
    .authorizationCodeGrant(code)
    .then(data => {
      const access_token = data.body['access_token']

      fs.writeFileSync('./.env', `
        CLIENT_ID=${process.env.CLIENT_ID}\n
        CLIENT_SECRET=${process.env.CLIENT_SECRET}\n
        ACCESS_TOKEN=${access_token}
      `)

      console.log('Sucessfully retreived access token.')
      res.send('Success! You can now close the window and start script.js file.')

    })
    .catch(error => {
      console.error('Error getting Tokens:', error)
      res.send(`Error getting Tokens: ${error}`)
    })
})

app.listen(8888, () =>
  console.log(
    'Server is runnig. http://localhost:8888/login'
  )
);

