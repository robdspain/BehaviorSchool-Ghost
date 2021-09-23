// # Asset helper
// Usage: `{{asset "css/screen.css"}}`
//
// Returns the path to the specified asset.
const {SafeString, metaData, errors, tpl} = require('../services/proxy');
const get = require('lodash/get');
const {getAssetUrl} = metaData;

const messages = {
    pathIsRequired: 'The {{asset}} helper must be passed a path'
};

module.exports = function asset(path, options) {
    const hasMinFile = get(options, 'hash.hasMinFile');

    if (!path) {
        throw new errors.IncorrectUsageError({
            message: tpl(messages.pathIsRequired)
        });
    }

    return new SafeString(
        getAssetUrl(path, hasMinFile)
    );
};
