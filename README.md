# YouTube to Podcast

***Warning: Project is experimental/pre-alpha and is NOT ready to be actually used***

A simple Node.js / Express server that converts YouTube playlists to Podcast RSS feeds, and acts as a proxy for the podcast items by piping extracted YouTube audio to the response (using [ytdl-core](https://github.com/fent/node-ytdl-core)). The streaming happens on the fly, and nothing is stored on disk. No transcoding through ffmpeg is needed.

## TODO
* [ ] Figure out if there are (older) YouTube video that don't have AAC codecs available
* [ ] Major cleanup
* [ ] Fix total size glitches in iOS Podcast app
* [ ] Add tooling