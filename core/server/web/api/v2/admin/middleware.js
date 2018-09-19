const prettyURLs = require('../../../middleware/pretty-urls');
const cors = require('../../../middleware/api/cors');
const {adminRedirect} = require('../../../middleware/url-redirects');
const auth = require('../../../../services/auth');

/**
 * Authentication for private endpoints
 */
module.exports.authenticatePrivate = [
    auth.authenticate.authenticateClient,
    auth.authenticate.authenticateUser,
    auth.authorize.requiresAuthorizedUser,
    cors,
    adminRedirect,
    prettyURLs
];

/**
 * Authentication for client endpoints
 */
module.exports.authenticateClient = function authenticateClient(client) {
    return [
        auth.authenticate.authenticateClient,
        auth.authenticate.authenticateUser,
        auth.authorize.requiresAuthorizedClient(client),
        cors,
        adminRedirect,
        prettyURLs
    ];
};
