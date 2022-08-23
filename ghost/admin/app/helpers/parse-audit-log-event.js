import Helper from '@ember/component/helper';
import {inject as service} from '@ember/service';

export default class ParseAuditLogEvent extends Helper {
    @service store;

    compute([ev]) {
        const action = getAction(ev);
        const actionIcon = getActionIcon(ev);
        const getResource = () => this.store.findRecord(ev.resource_type, ev.resource_id, {reload: false});

        const linkable = ['page', 'post'].includes(ev.resource_type);

        return {
            get resource() {
                return getResource();
            },
            linkable,
            actionIcon,
            action,
            original: ev
        };
    }
}

function getActionIcon(ev) {
    switch (ev.event) {
    case 'added':
        return 'add';
    case 'edited':
        return 'pen';
    case 'deleted':
        return 'trash';
    }

    return 'info';
}

function getAction(ev) {
    let resourceType = ev.resource_type;

    if (resourceType === 'api_key') {
        resourceType = 'API key';
    } else if (resourceType === 'setting') {
        resourceType = 'settings';
    }

    return `${ev.event} ${resourceType}`;
}
