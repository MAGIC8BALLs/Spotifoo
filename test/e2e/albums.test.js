const { assert } = require('chai');
const request = require('./request');
const { dropCollection } = require('./db');

describe('Album E2E route test', () => {

    before(() => dropCollection('artists'));
    before(() => dropCollection('albums'));

    const checkOk = res => {
        if(!res.ok) throw res.error;
        return res;
    };

    let song1 = {
        title: 'song1',
        artist: {},
        length: '3:03',
        playcount: 3
    };

    let artist1 = {
        name:'Radiation City',
        albums: [],
        genre: 'Alternative'
    };

    before(() => {
        return request.post('/artists')
            .send(artist1)
            .then(({ body }) => {
                artist1 = body;

            });
    });

    let album1 = {
        title: 'Synesthetica',
        length: '40min',
        tracklist: []
    };

    let album2 = {
        title: 'Truth is a Beautiful Thing',
        length: '1hour 19min',
        tracklist: []
    };

    before(() => {
        song1.artist._id = artist1._id;
        return request.post('/songs')
            .send(song1)
            .then(({ body }) => {
                song1 = body;
            });
    });

    const getFields = ({ _id, title, length, tracklist }) => ({ _id, title, length, tracklist });


    it('posts an album to the db', () => {
        album1.tracklist.push(song1._id);
        return request.post('/albums')
            .send(album1)
            .then(checkOk)
            .then(({ body }) => {
                const { _id, __v } = body;
                assert.ok(_id);
                assert.equal(__v, 0);
                assert.deepEqual(body, { ...album1, _id, __v });
                album1 = body;
            });
    });

    it('adds an album to artists albums', () => {
        artist1.albums.push(album1._id);
        return request.put(`/artists/${artist1._id}`)
            .send(artist1)
            .then(({ body }) => {
                artist1 = body;
            });
    });

    it('gets albums by id', () => {
        return request.get(`/albums/${album1._id}`)
            .then(({ body }) => {
                assert.equal(body.artist[0]._id, artist1._id);
            });

    });

    it('get all albums', () => {
        return request.post('/albums')
            .send(album2)
            .then(checkOk)
            .then(({ body }) => {
                album2 = body;
                return request.get('/albums');
            })
            .then(checkOk)
            .then(({ body }) => {
                assert.deepEqual(body, [album1, album2].map(getFields));
            });
    });

    it('update an artist', () => {
        album2.title = 'Truth is Not always a Beautiful Thing';

        return request.put(`/albums/${album2._id}`)
            .send(album2)
            .then(checkOk)
            .then(({ body }) => {
                assert.deepEqual(body, album2);
                return request.get(`/albums/${album2._id}`);
            })
            .then(({ body }) => {
                assert.equal(body.title, album2.title);
            });
    });

    it('Deletes an album by id', () => {
        return request.delete(`/albums/${album1._id}`)
            .then(() => {
                return request.get(`/albums/${album1._id}`);
            })
            .then(res => {
                assert.equal(res.status, 404);
            });
    });

});