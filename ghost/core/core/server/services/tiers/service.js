class TiersServiceWrapper {
    async init() {
        if (this.api) {
            // Already done
            return;
        }

        const {TiersAPI} = require('@tryghost/tiers');
        const DomainEvents = require('@tryghost/domain-events');

        const models = require('../../models');
        const TierRepository = require('./TierRepository');

        const adapterManager = require('../../services/adapter-manager');
        const tiersCache = adapterManager.getAdapter('cache:membersTiers');
        const repository = new TierRepository({
            ProductModel: models.Product,
            DomainEvents,
            cache: tiersCache
        });

        const slugService = {
            async generate(input) {
                return models.Product.generateSlug(models.Product, input, {});
            }
        };

        this.api = new TiersAPI({
            repository,
            slugService
        });
    }
}

module.exports = new TiersServiceWrapper();
