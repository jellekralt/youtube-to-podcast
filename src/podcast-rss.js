const RSS = require('rss');

module.exports = function generateRSS(data, feedUrl, host) {

    let feed = data.feed;
    let author = feed.author[0].name[0];

    let podcast = new RSS({
        title: data.feed.title[0],
        description: `YouTube Playlist: ${data.feed.title[0]}`,
        feed_url: feedUrl,
        categories: ['YouTube'],
        pubDate: new Date(feed.published[0]),
        ttl: '60',
        custom_namespaces: {
           'itunes': 'http://www.itunes.com/dtds/podcast-1.0.dtd'
        },
        custom_elements: [
            {'itunes:subtitle': 'YouTube Playlist'},
            {'itunes:author': author},
            {'itunes:summary': `YouTube Playlist: ${data.feed.title[0]}`},
            {'itunes:owner': [
                {'itunes:name': author}
            ]},
            {'itunes:image': {
                _attr: {
                    href: 'https://www.youtube.com/yt/brand/media/image/YouTube-icon-full_color.png'
                }
            }},
            {'itunes:category': [
                {_attr: {
                    text: 'YouTube'
                }}
            ]}
        ]
    });

    feed.entry.forEach((entry) => {
        var mediaGroup = entry['media:group'][0];
        var id = entry['yt:videoId'][0];
        
        podcast.item({
            title: entry.title[0],
            description: mediaGroup['media:description'][0],
            url: `${host}/audio/${id}/podcast.mp3`,
            guid: id,
            date: 'May 1, 2017', // any format that js Date can parse.
            enclosure: {
                'url'  : `${host}/audio/${id}/podcast.mp3`,
                'type' : 'audio/mpeg'
            },
            custom_elements: [
                {'itunes:author': entry.author[0].name[0]},
                {'itunes:summary': mediaGroup['media:description'][0]},
                {'itunes:image': {
                    _attr: {
                        href: mediaGroup['media:thumbnail'][0].$.url
                    }
                }}
            ]
        });
    });
    

    // cache the xml to send to clients
    return podcast.xml();
}