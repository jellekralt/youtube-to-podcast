const https = require('https');
const fs = require('fs');
const path = require('path');
const express = require('express');
const Stream = require('stream');
const Promise = require('bluebird');
const xml2js = require('xml2js');
const ytdl = require('ytdl-core');
const stream = require('stream');
const parseRange = require('range-parser');

const PodcastRSS = require('./src/PodcastRSS');
const YouTube = require('./src/YouTube');
const RangeUtils = require('./src/RangeUtils');

const app = express();
const youtube = new YouTube(process.env.YOUTUBE_API_KEY);

// TODO: Clean up
app.get('/audio/:id', function (req, res) {
    let url = `https://www.youtube.com/watch?v=${req.params.id}`;

    // Fetch YouTube video info
    ytdl.getInfo(url).then((info) => {

        let format = info.formats.filter((format) => !format.bitrate && format.audioBitrate && format.audioEncoding === 'aac')[0];
        let settings = { format: format };
        let range;

        if (req.headers.range) {
            range = RangeUtils.parse(req.headers.range);

            if (req.headers.range !== 'bytes=0-1') {
                settings.range = range;
            }
        }

        let audio = ytdl(url, settings).on('response', (response) => {
            // Check if content length is available
            if ('content-length' in response.headers) {
                let totalSize = parseInt(response.headers['content-length'], 10);

                if (range) {
                    let start = parseInt(range.start, 10);
                    let end = range.end > -1 ? range.end : totalSize - 1;
                    let chunksize = (end - start) + 1;

                    // Fix for wrong content-length from ytdl-core
                    if (start !== 0) {
                        totalSize += start;
                    }

                    // Check if the start is smaller that the total size
                    if (start <= totalSize) {
                        res.writeHead(206, {
                            'Content-Range': `bytes ${start}-${end}/${totalSize}`,
                            'Accept-Ranges': 'bytes',
                            'Content-Length': chunksize,
                            'Content-Type': response.headers['content-type'],
                            'Connection': 'keep-alive'
                        });
                        
                    } else {
                        // Return 416 (Requested Range Not Satisfiable) if start is outside possible range
                        res.writeHead(416, {});
                    }
                } else {
                    // If no range was passed, just set the full content length
                    res.writeHead(200, {
                        'Content-Length': totalSize,
                        'Content-Type': response.headers['content-type'],
                        'Accept-Ranges': 'bytes'
                    });
                }
            }
        });

        // Bust cache
        res.set('Cache-Control', 'no-cache');
        
        audio.pipe(res);

    }).catch((err) => {
        console.error(err);
    });
});

app.get('/podcast/:id/feed.rss', function(req, res) {
    let id = req.params.id;
    let host = req.protocol + '://' + req.get('host');
    let fullUrl = host + req.originalUrl;

    Promise.all([
        youtube.getPlaylist(id),
        youtube.getVideos(id)
    ]).then((data) => {
        let playlist = data[0];
        let podcasts = data[1];

        res.set({ 'content-type': 'application/xml; charset=utf-8' });
        res.send(PodcastRSS.generate(playlist, podcasts, fullUrl, host));
        res.end();
    }).catch((err) => {
        console.error(err);
        throw err;
    });
});

if (process.env.NODE_ENV !== 'test') {
    app.listen(5000, function () {
        console.log('YT2PC listening on port 5000!');
    });
}

module.exports = app;