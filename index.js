const https = require('https');
const fs = require('fs');
const express = require('express')
const app = express()
const Stream = require('stream');

const xml2js = require('xml2js')
const parseString = xml2js.parseString;

const ffmpeg = require('fluent-ffmpeg');
const command = ffmpeg();

const ytdl = require('ytdl-core');

const generateRSS = require('./src/podcast-rss');

app.get('/audio/:id/podcast.mp3', function (req, res) {
    let audio = ytdl('https://www.youtube.com/watch?v=' + req.params.id, { filter: 'audioonly' });

    console.log('hiiiiiiiiiiii');

    ffmpeg(audio)
        .audioCodec('libmp3lame')
        .audioBitrate(128)
        .format('mp3')
        .on('error', (err) => console.error(err))
        .on('end', () => console.log('Finished!'))
        .pipe(res, {
            end: true
        });
});

app.get('/podcast/:id/feed.rss', function(req, feedRes) {
    let playlistUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${req.params.id}`;
    let host = req.protocol + '://' + req.get('host');
    let fullUrl = host + req.originalUrl;

    https.get(playlistUrl, function(res) {

        res.setEncoding('utf8');
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
            try {
                const parsedData = parsePaylistXML(rawData, function(err, data) {
                    
                    feedRes.set({ 'content-type': 'application/xml; charset=utf-8' })
                    feedRes.send(generateRSS(data, fullUrl, host));
                    feedRes.end();

                });
            } catch (e) {
                console.error(e.message);
                feedRes.end();
            }
        });
        
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
