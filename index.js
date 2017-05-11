const https = require('https');
const fs = require('fs');
const path = require('path');
const express = require('express')
const app = express()
const Stream = require('stream');
const Promise = require('bluebird');

const xml2js = require('xml2js')
const parseString = xml2js.parseString;

const ffmpeg = require('fluent-ffmpeg');
const command = ffmpeg();

const ytdl = require('ytdl-core');

const generateRSS = require('./src/podcast-rss');

const YouTube = require('./src/YouTube');

var stream = require('stream');

const youtube = new YouTube(process.env.YOUTUBE_API_KEY);

function getPlaylistData (id, callback) {
    return Promise.all([
        youtube.getPlaylist(id),
        youtube.getVideos(id)
    ]);
}

app.get('/audio/:id/podcast.mp3', function (req, res) {
    let url = 'https://www.youtube.com/watch?v=' + req.params.id
    let audio = ytdl(url, { filter: 'audioonly' });
    
    audio.pipe(res);
});

app.get('/podcast/:id/feed.rss', function(req, res) {

    let playlistUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${req.params.id}`;
    let host = req.protocol + '://' + req.get('host');
    let fullUrl = host + req.originalUrl;

    getPlaylistData(req.params.id).then((data) => {
        res.set({ 'content-type': 'application/xml; charset=utf-8' })
        res.send(generateRSS(data, fullUrl, host));
        res.end();
    }, (err) => {
        throw err;
    });
    
});

app.listen(5000, function () {
  console.log('Example app listening on port 5000!')
});

function parsePaylistXML(xml, cb) {
    parseString(xml, function (err, data) {
        cb(err, data);
    });
}
