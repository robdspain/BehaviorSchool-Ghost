class MailAdapterBase {
    constructor() {
        Object.defineProperty(this,
            'requiredFns',
            {
                value: [
                    'send',
                    'getEvents',
                    'fetchEvents',
                    'removeSuppression',
                    'removeBounce',
                    'removeComplaint',
                    'removeUnsubscribe',
                    'normalizeEvent',
                    'getBatchSize',
                    'isConfigured'
                ],
                writable: false
            });
    }
}

module.exports = MailAdapterBase;
