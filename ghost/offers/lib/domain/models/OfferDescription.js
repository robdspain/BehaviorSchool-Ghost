const ValueObject = require('./shared/ValueObject');
const InvalidOfferDescription = require('../../errors').InvalidOfferDescription;

/** @extends ValueObject<string> */
class OfferDescription extends ValueObject {
    /** @param {unknown} description */
    static create(description) {
        if (!description || typeof description !== 'string') {
            throw new InvalidOfferDescription({
                message: 'Offer `display_description` must be a string.'
            });
        }

        if (description.length > 191) {
            throw new InvalidOfferDescription({
                message: 'Offer `display_description` can be a maximum of 191 characters.'
            });
        }

        return new OfferDescription(description);
    }
}

module.exports = OfferDescription;
