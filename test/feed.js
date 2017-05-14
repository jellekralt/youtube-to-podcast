const request = require('supertest');
const express = require('express');
const chai = require('chai');
const sinon = require('sinon');

const expect = chai.expect;

const app = require('../index');
const YouTube = require('../src/YouTube');


describe('/podcast/:id/feed.rss', function() {
    let getPlaylistStub;

    before(() => {
        sinon.stub(YouTube.prototype, 'getPlaylist').returns({
            thumbnails: {
                maxres: {
                    url: 'https://foo.bar/playlist'
                }
            }
        });
        sinon.stub(YouTube.prototype, 'getVideos').returns([
            {
                thumbnails: {
                    maxres: {
                        url: 'https://foo.bar/video'
                    }
                }
            }
        ]);
    });

    it('should return xml', function(done) {
        request(app)
            .get('/podcast/1337/feed.rss')
            .set('Accept', 'application/json')
            .expect('Content-Type', /xml/)
            .expect(200)
            .end(done);
    });

    it('call getPlaylist and getVideos with the id from the url', function(done) {
        request(app)
            .get('/podcast/1337/feed.rss')
            .set('Accept', 'application/json')
            .expect(() => {
                  expect(YouTube.prototype.getPlaylist.calledWith('1337')).to.be.true;
                  expect(YouTube.prototype.getVideos.calledWith('1337')).to.be.true;
            })
            .end(done);
    });

});