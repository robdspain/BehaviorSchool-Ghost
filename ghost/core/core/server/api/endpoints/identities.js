const settings = require('../../../shared/settings-cache');
const urlUtils = require('../../../shared/url-utils');
const jwt = require('jsonwebtoken');
const jose = require('node-jose');
const issuer = urlUtils.urlFor('admin', true);

let dangerousPrivateKey;
let keyStore;
let keyStoreReady;

const getKeyID = async () => {
    if (!keyStore) {
        dangerousPrivateKey = settings.get('ghost_private_key');
        keyStore = jose.JWK.createKeyStore();
        keyStoreReady = keyStore.add(dangerousPrivateKey, 'pem');
    }
    const key = await keyStoreReady;
    return key.kid;
};

const sign = async (claims, options) => {
    const kid = await getKeyID();
    return jwt.sign(claims, dangerousPrivateKey, Object.assign({
        issuer,
        expiresIn: '5m',
        algorithm: 'RS256',
        keyid: kid
    }, options));
};

module.exports = {
    docName: 'identities',
    read: {
        headers: {
            cacheInvalidate: false
        },
        permissions: true,
        async query(frame) {
            const token = await sign({sub: frame.user.get('email')});
            return {token};
        }
    }
};
