const Promise = require('bluebird');
const google = require('googleapis');

module.exports = class YouTube {

    constructor(apiKey) {
        this.apiKey = apiKey;

        this.yt = google.youtube({
            version: 'v3',
            auth: apiKey
        });
    }
    
    getPlaylist(id) {
        return new Promise((resolve, reject) => {
            this.yt.playlists.list({
                part: 'id,snippet',
                id: id,
                headers: {}
            }, function (err, data, response) {
                if (err) {
                    reject(err);
                }
                if (data) {
                    let playlist = data.items[0];
                    
                    resolve({
                        publishedAt: playlist.snippet.publishedAt,
                        title: playlist.snippet.title,
                        description: playlist.snippet.description,
                        thumbnails: playlist.snippet.thumbnails,
                        channelTitle: playlist.snippet.channelTitle
                    });
                }
            });
        });
    }
    
    getVideos(id) {
        return new Promise((resolve, reject) => {
            this.yt.playlistItems.list({
                part: 'id,snippet',
                playlistId: id,
                headers: {}
            }, (err, data, response) => {
                if (err) {
                    reject(err);
                }
                if (data) {
                    Promise.all(data.items.map((item) => {
                        return this.getVideo(item.snippet.resourceId.videoId, item.snippet.publishedAt);
                    })).then((videos) => {
                        resolve(videos);
                    });
                }
            });
        });
    }

    getVideo(id, addedAt) {
        return new Promise((resolve, reject) => {
            this.yt.videos.list({
                part: 'id,snippet,contentDetails',
                id: id,
                headers: {}
            }, function (err, data, response) {
                if (err) {
                    reject(err);
                }
                if (data) {
                    let video = data.items[0];
                    let durationParts = video.contentDetails.duration.match(/(\d+)(?=[MHS])/ig)||[]; 
                    let duration = durationParts.map((item) => {
                        if (item.length < 2) {
                            return '0' + item;
                        }

                        return item;
                    }).join(':');

                    resolve({
                        id: id,
                        title: video.snippet.title,
                        description: video.snippet.description,
                        thumbnails: video.snippet.thumbnails,
                        channelTitle: video.snippet.channelTitle,
                        duration: duration,
                        addedAt: addedAt
                    });
                }
            });
        });
    }

};