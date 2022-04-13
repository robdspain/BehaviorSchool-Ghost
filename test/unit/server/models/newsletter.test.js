/* eslint no-invalid-this:0 */
const errors = require('@tryghost/errors');
const sinon = require('sinon');
const should = require('should');
const models = require('../../../../core/server/models');

describe('Unit: models/newsletter', function () {
    const mockDb = require('mock-knex');

    before(function () {
        models.init();
    });

    after(function () {
        sinon.restore();
    });

    describe('validation', function () {
        describe('blank', function () {
            it('name cannot be blank', function () {
                return models.Newsletter.add({
                    sender_name: 'Jamie',
                    sender_email: 'jamie@example.com',
                    sender_reply_to: 'newsletter',
                    visibility: 'members',
                    sort_order: 0
                })
                    .then(function () {
                        throw new Error('expected ValidationError');
                    })
                    .catch(function (err) {
                        should(err[0] instanceof errors.ValidationError).eql(true);
                        err[0].message.should.match(/newsletters\.name/);
                    });
            });
        });
    });
});
