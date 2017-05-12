const https = require('https');
const fs = require('fs');
const path = require('path');
const express = require('express')
const Stream = require('stream');
const Promise = require('bluebird');
const xml2js = require('xml2js')
const ytdl = require('ytdl-core');
const stream = require('stream');
const parseRange = require('range-parser');
const _ = require('underscore');

const generateRSS = require('./src/podcast-rss');
const YouTube = require('./src/YouTube');

const app = express();
const parseString = xml2js.parseString;
const youtube = new YouTube(process.env.YOUTUBE_API_KEY);

const score = {
    'aac': 10,
    'vorbis': 5
};

// TODO: Clean up
app.get('/audio/:id', function (req, res) {
    let url = `https://www.youtube.com/watch?v=${req.params.id}`

    ytdl.getInfo(url).then((info) => {

        let format = info.formats.filter((format) => !format.bitrate && format.audioBitrate && format.audioEncoding === 'aac')[0];
        let range; 

        settings = { format: format };

        if (req.headers.range ) {
            let start = parseInt(req.headers.range.replace('bytes=', '').split('-')[0])
            let end = parseInt(req.headers.range.replace('bytes=', '').split('-')[1]) || -1

            range = { start: start, end: end };

            if (req.headers.range !== 'bytes=0-1') {
                settings.range = range;
            }
        }

        let audio = ytdl(url, settings)
            .on('response', (response) => {

                if (!_.isUndefined(response.headers['content-length'])) {

                    let totalSize = parseInt(response.headers['content-length'], 10);
                    if (!_.isUndefined(range)) {

                        let partialstart = range.start
                        let partialend = range.end > -1 ? range.end : false;
                        let start = parseInt(partialstart, 10);

                        //Temporary fix for wrong content-length
                        if (start != 0) {

                            totalSize += start;
                        }
                        let end = partialend ? parseInt(partialend, 10) : totalSize - 1;
                        let chunksize = (end - start) + 1;

                        if (start <= totalSize) {

                            res.writeHead(206, {
                                'Content-Range': 'bytes ' + start + '-' + end + '/' + totalSize,
                                'Accept-Ranges': 'bytes',
                                'Content-Length': chunksize,
                                'Content-Type': response.headers['content-type'],
                                "connection":"keep-alive",
                                "accept-ranges":"bytes"
                            });
                           
                        } else {
                            
                            res.writeHead(416, {});
                        }
                    } else {
                        res.writeHead(200, {
                            'Content-Length': totalSize,
                            'Content-Type': response.headers['content-type'],
                            "connection":"keep-alive",
                            "accept-ranges":"bytes"
                        });
                    }
                }
            });

        res.set("Cache-Control", "no-cache");
        
        audio.pipe(res);

    })
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

// TODO: Move!
function getPlaylistData (id, callback) {
    return Promise.all([
        youtube.getPlaylist(id),
        youtube.getVideos(id)
    ]);
}

function parsePaylistXML(xml, cb) {
    parseString(xml, function (err, data) {
        cb(err, data);
    });
}