const RSS = require('rss');

module.exports = {
    generate: function generateRSS(playlist, podcasts, feedUrl, host) {
        /*jshint camelcase: false */
        let rss = new RSS({
            title: playlist.title,
            description: playlist.description || `YouTube Playlist: ${playlist.title}`,
            feed_url: feedUrl,
            categories: ['YouTube'],
            pubDate: new Date(playlist.publishedAt),
            ttl: '60',
            custom_namespaces: {
                'itunes': 'http://www.itunes.com/dtds/podcast-1.0.dtd'
            },
            custom_elements: [
                {'itunes:subtitle': 'YouTube Playlist'},
                {'itunes:author': playlist.channelTitle},
                {'itunes:summary': playlist.description || `YouTube Playlist: ${playlist.title}`},
                {'itunes:owner': [
                    {'itunes:name': playlist.channelTitle}
                ]},
                {'itunes:image': {
                    _attr: {
                        href: getBestThumbnailUrl(playlist.thumbnails)
                    }
                }},
                {'itunes:category': [
                    {_attr: {
                        text: 'YouTube'
                    }}
                ]}
            ]
        });
    
        podcasts.forEach((podcast) => {

            rss.item({
                title: podcast.title,
                description: podcast.description,
                url: `http://youtube.com/watch?v=${podcast.id}`,
                guid: podcast.id,
                date: podcast.addedAt,
                enclosure: {
                    'url'  : `${host}/audio/${podcast.id}`,
                    'type' : 'audio/mpeg'
                },
                custom_elements: [
                    {'itunes:author': podcast.channelTitle},
                    {'itunes:summary': podcast.description},
                    {'itunes:image': {
                        _attr: {
                            href: getBestThumbnailUrl(podcast.thumbnails)
                        }
                    }},
                    {'itunes:duration': podcast.duration}
                ]
            });
        });
        

        // cache the xml to send to clients
        return rss.xml();
    }
};

function getBestThumbnailUrl(thumbnails) {
    if (thumbnails.maxres) {
        return thumbnails.maxres.url;
    } else if (thumbnails.high) {
        return thumbnails.high.url;
    } else if (thumbnails.medium) {
        return thumbnails.medium.url;
    } else {
        return thumbnails.default.url;
    }
}