const request = require('supertest');
const express = require('express');
const chai = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const PassThrough = require('stream').PassThrough;
const parseString = require('xml2js').parseString;

const expect = chai.expect;

describe('/audio/:id', function() {
    let app;
    let ytdlStub;
    
    before(() => {
        ytdlStub = sinon.spy(function(url, settings) {
            let stream = new PassThrough({});

            setTimeout(() => {
                stream.emit.call(stream, 'response', {
                    headers: {
                        'content-length': 4567,
                        'content-type': 'audio/mp4'
                    }
                });

                stream.end();
            }, 1);

            return stream;
        });

        ytdlStub.getInfo = sinon.stub().resolves({
            formats: [
                {
                    bitrate: null,
                    audioBitrate: 123,
                    audioEncoding: 'aac'
                }
            ]
        });

        app = proxyquire('../index', { 
            'ytdl-core': ytdlStub
        });
    });

    it('call get the info and stream for the correct video', function(done) {
        request(app)
            .get('/audio/FooBarBazQx')
            .expect((response) => {
                expect(ytdlStub.calledWith('https://www.youtube.com/watch?v=FooBarBazQx')).to.be.true;
                expect(ytdlStub.getInfo.calledWith('https://www.youtube.com/watch?v=FooBarBazQx')).to.be.true;
            })
            .expect(200)
            .end(done);
    });

    it('should pick AAC as a format, when multiple formats are available', function(done) {
        ytdlStub.getInfo = sinon.stub().resolves({
            formats: [
                {
                    bitrate: null,
                    audioBitrate: 123,
                    audioEncoding: 'foo'
                },
                {
                    bitrate: null,
                    audioBitrate: 123,
                    audioEncoding: 'bar'
                },
                {
                    bitrate: null,
                    audioBitrate: 123,
                    audioEncoding: 'aac'
                }
            ]
        });

        request(app)
            .get('/audio/FooBarBazQx')
            .expect((response) => {
                let url = 'https://www.youtube.com/watch?v=FooBarBazQx';
                let settings = { 
                    format: { 
                        bitrate: null, 
                        audioBitrate: 123, 
                        audioEncoding: 'aac' 
                    } 
                };

                expect(ytdlStub.calledWithMatch(url, settings)).to.be.true;
            })
            .expect(200)
            .end(done);

    });

});
