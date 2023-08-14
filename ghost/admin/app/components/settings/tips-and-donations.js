import Component from '@glimmer/component';
import ConfirmPreview from '../../components/modals/confirm-preview';
import copyTextToClipboard from 'ghost-admin/utils/copy-text-to-clipboard';
import envConfig from 'ghost-admin/config/environment';
import {action} from '@ember/object';
import {currencies, getSymbol, minimumAmountForCurrency} from 'ghost-admin/utils/currency';
import {inject} from 'ghost-admin/decorators/inject';
import {inject as service} from '@ember/service';
import {task, timeout} from 'ember-concurrency';
import {tracked} from '@glimmer/tracking';

const CURRENCIES = currencies.map((currency) => {
    return {
        value: currency.isoCode,
        label: `${currency.isoCode}`
    };
});

// Stripe doesn't allow amounts over 10,000 as a preset amount
const MAX_AMOUNT = 10_000;

export default class TipsAndDonations extends Component {
    @service settings;
    @service session;
    @service membersUtils;
    @service modals;

    @inject config;
    @tracked tipsAndDonationsError = '';

    get allCurrencies() {
        return CURRENCIES;
    }

    get selectedAmount() {
        return this.settings.donationsSuggestedAmount && this.settings.donationsSuggestedAmount / 100;
    }

    get selectedCurrency() {
        return CURRENCIES.findBy('value', this.settings.donationsCurrency);
    }

    get siteUrl() {
        return this.config.blogUrl;
    }

    get isConnectDisallowed() {
        const siteUrl = this.config.blogUrl;
        return envConfig.environment !== 'development' && !/^https:/.test(siteUrl);
    }

    @action
    setDonationsCurrency(event) {
        this.settings.donationsCurrency = event.value;
    }

    @action
    setDonationsSuggestedAmount(event) {
        const amount = Math.abs(event.target.value);
        const amountInCents = Math.round(amount * 100);
        const currency = this.settings.donationsCurrency;
        const symbol = getSymbol(currency);
        const minAmount = minimumAmountForCurrency(currency);

        if (amountInCents !== 0 && amountInCents < (minAmount * 100)) {
            this.tipsAndDonationsError = `Non-zero amount must be at least ${symbol}${minAmount}.`;
            return;
        }

        if (amountInCents !== 0 && amountInCents > (MAX_AMOUNT * 100)) {
            this.tipsAndDonationsError = `Suggested amount cannot be more than ${symbol}${MAX_AMOUNT}.`;
            return;
        }

        this.tipsAndDonationsError = '';
        this.settings.donationsSuggestedAmount = amountInCents;
    }

    @action
    openStripeConnect() {
        this.args.openStripeConnect();
    }

    @action
    async closeStripeConnect() {
        this.showStripeConnect = false;
    }

    @action
    async showPreview() {
        const changedAttributes = this.settings.changedAttributes();

        if (changedAttributes && Object.keys(changedAttributes).length > 0) {
            const shouldSave = await this.modals.open(ConfirmPreview);

            if (shouldSave) {
                this.saveSettingsTask.perform();
                this.previewDonationCheckout();
            }
        } else {
            this.previewDonationCheckout();
        }
    }

    previewDonationCheckout() {
        const win = window.open(`${this.siteUrl}/#/portal/support`, '_blank');
        if (win) {
            win.focus();
        }
    }

    @task
    *saveSettingsTask() {
        try {
            if (this.settings.errors.length !== 0) {
                return;
            }

            yield this.settings.save();

            // ensure task button switches to success state
            return true;
        } catch (error) {
            if (error) {
                this.notifications.showAPIError(error);
                throw error;
            }
        }
    }

    @task
    *copyTipsAndDonationsLink() {
        const link = document.getElementById('gh-tips-and-donations-link')?.value;

        if (link) {
            copyTextToClipboard(link);
            yield timeout(this.isTesting ? 50 : 500);
        }

        return true;
    }
}
