/**
 * Main controller for Ghost frontend
 */

/*global require, module */

var api         = require('../../api'),
    config      = require('../../config'),
    filters     = require('../../filters'),
    templates   = require('./templates'),
    handleError = require('./error'),
    formatResponse = require('./format-response'),
    postLookup     = require('./post-lookup'),
    setResponseContext = require('./context'),
    setRequestIsSecure = require('./secure'),

    frontendControllers;

/*
* Sets the response context around a post and renders it
* with the current theme's post view. Used by post preview
* and single post methods.
* Returns a function that takes the post to be rendered.
*/
function renderPost(req, res) {
    return function renderPost(post) {
        var view = templates.single(req.app.get('activeTheme'), post),
            response = formatResponse.single(post);

        setResponseContext(req, res, response);
        res.render(view, response);
    };
}

frontendControllers = {
    preview: function preview(req, res, next) {
        var params = {
                uuid: req.params.uuid,
                status: 'all',
                include: 'author,tags'
            };

        api.posts.read(params).then(function then(result) {
            var post = result.posts[0];

            if (!post) {
                return next();
            }

            if (post.status === 'published') {
                return res.redirect(301, config.urlFor('post', {post: post}));
            }

            setRequestIsSecure(req, post);

            filters.doFilter('prePostsRender', post, res.locals)
                .then(renderPost(req, res));
        }).catch(handleError(next));
    },
    single: function single(req, res, next) {
        // Query database to find post
        return postLookup(req.path).then(function then(lookup) {
            var post = lookup ? lookup.post : false;

            if (!post) {
                return next();
            }

            // CASE: last param is of url is /edit, redirect to admin
            if (lookup.isEditURL) {
                return res.redirect(config.paths.subdir + '/ghost/editor/' + post.id + '/');
            }

            // CASE: permalink is not valid anymore, we redirect him permanently to the correct one
            if (post.url !== req.path) {
                // CASE: AMP request, when AMP is disabled can't fully get handled by AMP router
                // This is ugly, but the redirect wouldn't work for static pages in AMP router

                if (req.path.match(/\/amp\/?$/i)) {
                    // CASE: it's a static page, we return a 404
                    if (post.page) {
                        return res.sendStatus(404);
                    }
                    // CASE: it's a normal post with disabled AMP, we return a temporary redirect
                    res.set('Cache-Control', 'public, max-age=0');
                    return res.redirect(302, (req.originalUrl || req.url).slice(0, -1 * (config.routeKeywords.amp.length + 1)));
                }
                return res.redirect(301, post.url);
            }

            setRequestIsSecure(req, post);

            filters.doFilter('prePostsRender', post, res.locals)
                .then(renderPost(req, res));
        }).catch(handleError(next));
    }
};

module.exports = frontendControllers;
