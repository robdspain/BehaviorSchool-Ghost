const should = require('should');
const supertest = require('supertest');
const ObjectId = require('bson-objectid');
const testUtils = require('../../../../utils');
const config = require('../../../../../server/config');
const localUtils = require('./utils');
const ghost = testUtils.startGhost;
let request;

describe('Email Preview API', function () {
    let ghostServer;
    let ownerCookie;

    before(function () {
        return ghost()
            .then(function (_ghostServer) {
                ghostServer = _ghostServer;
                request = supertest.agent(config.get('url'));
            })
            .then(function () {
                return localUtils.doAuth(request, 'users:extra', 'posts');
            })
            .then(function (cookie) {
                ownerCookie = cookie;
            });
    });

    describe('Read', function () {
        it('can\'t retrieve non existent post', function (done) {
            request.get(localUtils.API.getApiQuery(`posts/${ObjectId.generate()}/`))
                .set('Origin', config.get('url'))
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect('Cache-Control', testUtils.cacheRules.private)
                .expect(404)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    should.not.exist(res.headers['x-cache-invalidate']);
                    var jsonResponse = res.body;
                    should.exist(jsonResponse);
                    should.exist(jsonResponse.errors);
                    testUtils.API.checkResponseValue(jsonResponse.errors[0], [
                        'message',
                        'context',
                        'type',
                        'details',
                        'property',
                        'help',
                        'code',
                        'id'
                    ]);
                    done();
                });
        });

        it('can read post email preview with fields', function () {
            return request
                .get(localUtils.API.getApiQuery(`email_preview/posts/${testUtils.DataGenerator.Content.posts[0].id}/?fields=html,plaintext,subject`))
                .set('Origin', config.get('url'))
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect('Cache-Control', testUtils.cacheRules.private)
                .expect(200)
                .then((res) => {
                    localUtils.API.checkResponse(res.body.email_previews[0], 'email_preview', null, null, ['id', 'html', 'plaintext', 'subject']);
                });
        });
    });
});
