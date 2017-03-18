var _  = require('lodash'),
    hbs = require('express-hbs'),
    utils = require('../utils'),
    errors = require('../errors'),
    i18n = require('../i18n'),
    settingsCache = require('../settings/cache'),
    activeTheme = require('./active'),
    themeMiddleware = {};

// ### updateActiveTheme
// If there is no active theme, throw an error
// Else, ensure the active theme is mounted
themeMiddleware.updateActiveTheme = function updateActiveTheme(req, res, next) {
    // This means that the theme hasn't been loaded yet i.e. there is no active theme
    if (!activeTheme.get()) {
        // This is the one place we ACTUALLY throw an error for a missing theme as it's a request we cannot serve
        return next(new errors.InternalServerError({
            // We use the settingsCache here, because the setting will be set,
            // even if the theme itself is not usable because it is invalid or missing.
            message: i18n.t('errors.middleware.themehandler.missingTheme', {theme: settingsCache.get('activeTheme')})
        }));
    }

    // If the active theme has not yet been mounted, mount it into express
    if (!activeTheme.get().mounted) {
        activeTheme.get().mount(req.app);
    }

    next();
};

// ### configHbsForContext Middleware
// Setup handlebars for the current context (admin or theme)
themeMiddleware.configHbsForContext = function configHbsForContext(req, res, next) {
    // Static information, same for every request unless the settings change
    // @TODO: bind this once and then update based on events?
    var blogData = {
            title: settingsCache.get('title'),
            description: settingsCache.get('description'),
            facebook: settingsCache.get('facebook'),
            twitter: settingsCache.get('twitter'),
            timezone: settingsCache.get('activeTimezone'),
            navigation: settingsCache.get('navigation'),
            icon: settingsCache.get('icon'),
            cover: settingsCache.get('cover'),
            logo: settingsCache.get('logo'),
            amp: settingsCache.get('amp')
        },
        labsData = _.cloneDeep(settingsCache.get('labs')),
        themeData = {};

    if (activeTheme.get()) {
        themeData.posts_per_page = activeTheme.get().config('posts_per_page');
    }

    // Request-specific information
    // These things are super dependent on the request, so they need to be in middleware
    blogData.url = utils.url.urlFor('home', {secure: req.secure}, true);

    // Pass 'secure' flag to the view engine
    // so that templates can choose to render https or http 'url', see url utility
    res.locals.secure = req.secure;

    // @TODO: only do this if something changed?
    hbs.updateTemplateOptions({
        data: {
            blog: blogData,
            labs: labsData,
            config: themeData
        }
    });

    next();
};

module.exports = [
    themeMiddleware.updateActiveTheme,
    themeMiddleware.configHbsForContext
];
