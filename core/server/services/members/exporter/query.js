const models = require('../../../models');
const {knex} = require('../../../data/db');
const moment = require('moment');
const _ = require('lodash');

module.exports = async function (options) {
    const hasFilter = options.limit !== 'all' || options.filter || options.search;

    let ids = null;
    if (hasFilter) {
        // do a very minimal query, only to fetch the ids of the filtered values
        // should be quite fast
        const filterOptions = _.pick(options, ['transacting', 'context']);
        const memberRows = await models.Member.getFilteredCollectionQuery(filterOptions)
            .select('members.id')
            .distinct();

        ids = memberRows.map(row => row.id);
    }

    const allProducts = await models.Product.fetchAll();
    const allLabels = await models.Label.fetchAll();

    let query = knex('members')
        .select('id', 'email', 'name', 'note', 'status', 'created_at')
        .select(knex.raw(`
            (CASE WHEN EXISTS (SELECT 1 FROM members_newsletters n WHERE n.member_id = members.id)
                    THEN TRUE ELSE FALSE
            END) as subscribed
        `))
        .select(knex.raw(`
            (SELECT GROUP_CONCAT(product_id) FROM members_products f WHERE f.member_id = members.id) as products
        `))
        .select(knex.raw(`
            (SELECT GROUP_CONCAT(label_id) FROM members_labels f WHERE f.member_id = members.id) as labels
        `))
        .select(knex.raw(`
            (SELECT customer_id FROM members_stripe_customers f WHERE f.member_id = members.id limit 1) as stripe_customer_id
        `));

    if (hasFilter) {
        query = query.whereIn('id', ids);
    }

    const rows = await query;
    for (const row of rows) {
        const productIds = row.products ? row.products.split(',') : [];
        const products = productIds.map((id) => {
            const product = allProducts.find(p => p.id === id);
            return {
                name: product.get('name')
            };
        });
        row.products = products;

        const labelIds = row.labels ? row.labels.split(',') : [];
        const labels = labelIds.map((id) => {
            const label = allLabels.find(l => l.id === id);
            return {
                name: label.get('name')
            };
        });
        row.labels = labels;
    }

    for (const member of rows) {
        // Note: we don't modify the array or change/duplicate objects
        // to increase performance
        member.subscribed = !!member.subscribed;
        member.comped = member.status === 'comped';
        member.created_at = moment(member.created_at).toISOString();
    }

    return rows;
};
