const should = require('should');
const supertest = require('supertest');
const localUtils = require('./utils');
const testUtils = require('../../../../utils');
const configUtils = require('../../../../utils/configUtils');
const config = require('../../../../../core/shared/config');

const ghost = testUtils.startGhost;
let request;

describe('api/canary/content/tags', function () {
    const validKey = localUtils.getValidKey();

    before(function () {
        return ghost()
            .then(function () {
                request = supertest.agent(config.get('url'));
            })
            .then(function () {
                return testUtils.initFixtures('users:no-owner', 'user:inactive', 'posts', 'tags:extra', 'api_keys');
            });
    });

    afterEach(function () {
        configUtils.restore();
    });

    it('Can read tags with fields', function () {
        return request
            .get(localUtils.API.getApiQuery(`tags/${testUtils.DataGenerator.Content.tags[0].id}/?key=${validKey}&fields=name,slug`))
            .set('Origin', testUtils.API.getURL())
            .expect('Content-Type', /json/)
            .expect('Cache-Control', testUtils.cacheRules.private)
            .expect(200)
            .then((res) => {
                localUtils.API.checkResponse(res.body.tags[0], 'tag', null, null, ['id', 'name', 'slug']);
            });
    });

    it('Can request all tags with count.posts field and custom order', function () {
        return request
            .get(localUtils.API.getApiQuery(`tags/?key=${validKey}&include=count.posts&order=name%20DESC`))
            .set('Origin', testUtils.API.getURL())
            .set('Origin', config.get('url'))
            .expect('Content-Type', /json/)
            .expect('Cache-Control', testUtils.cacheRules.private)
            .expect(200)
            .then((res) => {
                should.not.exist(res.headers['x-cache-invalidate']);
                const jsonResponse = res.body;
                should.exist(jsonResponse);
                should.exist(jsonResponse.tags);
                jsonResponse.tags.should.have.length(4);
                localUtils.API.checkResponse(jsonResponse.tags[0], 'tag', ['count', 'url']);

                jsonResponse.meta.pagination.should.have.property('page', 1);
                jsonResponse.meta.pagination.should.have.property('limit', 15);
                jsonResponse.meta.pagination.should.have.property('pages', 4);
                jsonResponse.meta.pagination.should.have.property('total', 56);
                jsonResponse.meta.pagination.should.have.property('next', 2);
                jsonResponse.meta.pagination.should.have.property('prev', null);

                jsonResponse.tags[0].url.should.eql(`${config.get('url')}/tag/kitchen-sink/`);
                jsonResponse.tags[1].url.should.eql(`${config.get('url')}/tag/getting-started/`);

                should.exist(jsonResponse.tags[0].count.posts);
                jsonResponse.tags[0].count.posts.should.equal(2);
            });
    });

    it('Browse tags with slug filter, should order in slug order', function () {
        return request.get(localUtils.API.getApiQuery(`tags/?key=${validKey}&filter=slug:[kitchen-sink,bacon,chorizo]`))
            .expect('Content-Type', /json/)
            .expect('Cache-Control', testUtils.cacheRules.private)
            .expect(200)
            .then((res) => {
                const jsonResponse = res.body;

                jsonResponse.tags.should.be.an.Array().with.lengthOf(3);
                jsonResponse.tags[0].slug.should.equal('kitchen-sink');
                jsonResponse.tags[1].slug.should.equal('bacon');
                jsonResponse.tags[2].slug.should.equal('chorizo');
            });
    });
});
