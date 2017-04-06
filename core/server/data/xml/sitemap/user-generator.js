var _ = require('lodash'),
    validator = require('validator'),
    api = require('../../../api'),
    logging = require('../../../logging'),
    models = require('../../../models'),
    utils = require('../../../utils'),
    BaseMapGenerator = require('./base-generator');

// A class responsible for generating a sitemap from posts and keeping it updated
function UserMapGenerator(opts) {
    _.extend(this, opts);

    BaseMapGenerator.apply(this, arguments);
}

// Inherit from the base generator class
_.extend(UserMapGenerator.prototype, BaseMapGenerator.prototype);

_.extend(UserMapGenerator.prototype, {
    bindEvents: function () {
        var self = this;
        this.dataEvents.on('user.activated', self.addOrUpdateUrl.bind(self));
        this.dataEvents.on('user.activated.edited', self.addOrUpdateUrl.bind(self));
        this.dataEvents.on('user.deactivated', self.removeUrl.bind(self));
    },

    getData: function () {
        return api.users.browse({
            context: {
                public: true
            },
            filter: 'visibility:public',
            status: 'active',
            limit: 'all',
            include: 'count.posts'
        }).then(function (resp) {
            return _.filter(resp.users, function (user) {
                return user.count.posts > 0;
            });
        });
    },

    validateDatum: function (datum) {
        return datum.visibility === 'public' && _.includes(models.User.activeStates, datum.status);
    },

    getUrlForDatum: function (user) {
        return utils.url.urlFor('author', {author: user}, true);
    },

    getPriorityForDatum: function () {
        // TODO: We could influence this with meta information
        return 0.6;
    },

    validateImageUrl: function (imageUrl) {
        return imageUrl && validator.isURL(imageUrl, {protocols: ['http', 'https'], require_protocol: true});
    }
});

module.exports = UserMapGenerator;
