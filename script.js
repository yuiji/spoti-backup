require('dotenv').config()
const SpotifyWebApi = require('spotify-web-api-node')
const xlsx = require('xlsx')
const homeDir = require('os').homedir()
const desktopDir = `${homeDir}/Desktop`


// connect to spotifyApi
const spotifyApi = new SpotifyWebApi({
  redirectUri: 'http://localhost:8888/callback',
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET
})

// set access token
spotifyApi.setAccessToken(process.env.ACCESS_TOKEN)

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

getPlaylists()

