// # Ghost Configuration

var path = require('path'),
    config  = {};

// ## Admin settings

// Default language
config.defaultLang = 'en';

// Force i18n to be on
config.forceI18n = true;

// ## Plugins

// Current active plugins
config.activePlugins = [
    'FancyFirstChar'
];


config.mail = {
    transport: 'sendgrid',
    host: 'smtp.sendgrid.net',
    options: {
        service: 'Sendgrid',
        auth: {
            user: '', // Super secret username
            pass: ''  // Super secret password
        }
    }
};

// ## Default Navigation Items
// Add new objects here to extend the menu output by {{nav}}
config.nav = [
    {
        // Title is the text shown for this nav item
        title: 'Home',
        // Url can be a relative path, or external URL
        url: '/'
    }
    // new items go here
];

// ## Environment
// **Warning:** Only change the settings below here if you are sure of what you are doing!
config.env = {
    testing: {
        database: {
            client: 'sqlite3',
            connection: {
                filename: path.join(__dirname, '/core/server/data/ghost-test.db')
            }
        },
        server: {
            host: '127.0.0.1',
            port: '2369'
        },
        // The url to use when providing links to the site; like RSS and email.
        url: 'http://127.0.0.1:2369'
    },

    travis: {
        database: {
            client: 'sqlite3',
            connection: {
                filename: path.join(__dirname, '/core/server/data/ghost-travis.db')
            }
        },
        server: {
            host: '127.0.0.1',
            port: '2368'
        },
        // The url to use when providing links to the site; like RSS and email.
        url: 'http://127.0.0.1:2368'
    },

    // Default configuration
    development: {
        database: {
            client: 'sqlite3',
            connection: {
                filename: path.join(__dirname, '/core/server/data/ghost-dev.db')
            },
            debug: false
        },
        server: {
            host: '127.0.0.1',
            port: '2368'
        },
        // The url to use when providing links to the site; like RSS and email.
        url: 'http://127.0.0.1:2368'
    },

    staging: {
        database: {
            client: 'sqlite3',
            connection: {
                filename: path.join(__dirname, '/core/server/data/ghost-staging.db')
            },
            debug: false
        },
        server: {
            host: '127.0.0.1',
            port: '2368'
        },
        // The url to use when providing links to the site; like RSS and email.
        url: 'http://127.0.0.1:2368'
    },

    production: {
        database: {
            client: 'sqlite3',
            connection: {
                filename: path.join(__dirname, '/core/server/data/ghost.db')
            },
            debug: false
        },
        server: {
            host: '127.0.0.1',
            port: '2368'
        },
        // The url to use when providing links to the site; like RSS and email.
        url: 'http://127.0.0.1:2368'
    }
};

// Export config
module.exports = config;
