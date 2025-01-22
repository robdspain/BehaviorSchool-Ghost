const crypto = require('crypto');
const DomainEvents = require('@tryghost/domain-events');
const RedirectEvent = require('./RedirectEvent');
const LinkRedirect = require('./LinkRedirect');
const logging = require('@tryghost/logging');

/**
 * @typedef {object} ILinkRedirectRepository
 * @prop {(url: URL) => Promise<LinkRedirect|undefined>} getByURL
 * @prop {({filter: string}) => Promise<LinkRedirect[]>} getAll
 * @prop {({filter: string}) => Promise<String[]>} getFilteredIds
 * @prop {(linkRedirect: LinkRedirect) => Promise<void>} save
 */

class LinkRedirectsService {
    /** @type ILinkRedirectRepository */
    #linkRedirectRepository;
    /** @type URL */
    #baseURL;

    /** @type String */
    #redirectURLPrefix = 'r/';

    /**
     * @param {object} deps
     * @param {ILinkRedirectRepository} deps.linkRedirectRepository
     * @param {object} deps.config
     * @param {URL} deps.config.baseURL
     */
    constructor(deps) {
        this.#linkRedirectRepository = deps.linkRedirectRepository;
        if (!deps.config.baseURL.pathname.endsWith('/')) {
            this.#baseURL = new URL(deps.config.baseURL);
            this.#baseURL.pathname += '/';
        } else {
            this.#baseURL = deps.config.baseURL;
        }
        this.handleRequest = this.handleRequest.bind(this);
    }

    /**
     * Get a unique URL with slug for creating unique redirects
     *
     * @returns {Promise<URL>}
     */
    async getSlugUrl() {
        let url;
        while (!url || await this.#linkRedirectRepository.getByURL(url)) {
            const slug = crypto.randomBytes(4).toString('hex');
            url = new URL(`${this.#redirectURLPrefix}${slug}`, this.#baseURL);
        }
        return url;
    }

    /**
     * @param {Object} options
     *
     * @returns {Promise<String[]>}
     */
    async getFilteredIds(options) {
        return await this.#linkRedirectRepository.getFilteredIds(options);
    }

    /**
     * @param {URL} from
     * @param {URL} to
     *
     * @returns {Promise<LinkRedirect>}
     */
    async addRedirect(from, to) {
        const link = new LinkRedirect({
            from,
            to
        });

        await this.#linkRedirectRepository.save(link);

        return link;
    }

    /**
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     *
     * @returns {Promise<void>}
     */
    async handleRequest(req, res, next) {
        try {
            const startTime = process.hrtime();
            const timings = {};

            // skip handling if original url doesn't match the prefix
            const fullURLWithRedirectPrefix = `${this.#baseURL.pathname}${this.#redirectURLPrefix}`;
            if (!req.originalUrl.startsWith(fullURLWithRedirectPrefix)) {
                return next();
            }

            const url = new URL(req.originalUrl, this.#baseURL);
            const lookupStart = process.hrtime();

            // Check cache first
            let link = await this.#linkRedirectRepository.getByURL(url);
            const isCacheHit = !!link;

            const [lookupSecs, lookupNanos] = process.hrtime(lookupStart);
            timings.lookup = (lookupSecs * 1000 + lookupNanos/1000000).toFixed(2);

            if (!link) {
                return next();
            }

            // Skip event dispatch if testing
            if (!url.searchParams.has('test')) {
                const event = RedirectEvent.create({
                    url,
                    link
                });
                DomainEvents.dispatch(event);
            }

            res.setHeader('X-Robots-Tag', 'noindex, nofollow');

            const [totalSecs, totalNanos] = process.hrtime(startTime);
            timings.total = (totalSecs * 1000 + totalNanos/1000000).toFixed(2);
            // logging.info(`[PERF] r/${url.pathname.split('/r/')[1]} cache:${isCacheHit ? 'hit' : 'miss'} lookup:${timings.lookup}ms total:${timings.total}ms`);

            return res.redirect(link.to.href);
        } catch (e) {
            return next(e);
        }
    }
}

module.exports = LinkRedirectsService;
