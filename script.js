require('dotenv').config()
const SpotifyWebApi = require('spotify-web-api-node')
const express = require('express')
const xlsx = require('xlsx')
const fs = require('fs')
const homeDir = require('os').homedir()
const desktopDir = `${homeDir}/Desktop`




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

//get user's id
let id = ""
let newWB = xlsx.utils.book_new()

async function getPlaylists() {
  // get user's ıd
  const data = await spotifyApi.getMe()
  id = data.body.id
  
  // get user's playlists
  const userPlaylists = await spotifyApi.getUserPlaylists(id)
  userPlaylists.body.items.forEach( async (item) => {

    // append all songs to an playlistArray for each playlist 
    let playlistArray = []
    const playlist = await spotifyApi.getPlaylist(item.id)
    playlist.body.tracks.items.forEach(song => {
      playlistArray.push({
        artistName: song.track.artists[0].name,
        songName: song.track.name
      })
    })

    // create excel worksheet and append songs 
    const plName = playlist.body.name
    let newWS = xlsx.utils.json_to_sheet(playlistArray)
    xlsx.utils.book_append_sheet(newWB, newWS, plName)
    xlsx.writeFile(newWB, `${desktopDir}/playlists.xlsx`)
  })
}

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
      const refresh_token = data.body['refresh_token']
      const expires_in = data.body['expires_in']

      // set access token
      spotifyApi.setAccessToken(access_token);
      spotifyApi.setRefreshToken(refresh_token);

      console.log('Sucessfully retreived access token.')
      res.send('Success! You can now close the window.')

      // refresh acces token
      /* setInterval(async () => {
        const data = await spotifyApi.refreshAccessToken()
        const access_token = data.body['access_token']

        spotifyApi.setAccessToken(access_token)
      }, expires_in / 2 * 1000) */
    })
    .then(() => {
      try {
        getPlaylists()
        console.log('Succesfully retrieved playlists.')
      } catch (error){
        console.log(`Error getting Playlists:`, error)
      }
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

