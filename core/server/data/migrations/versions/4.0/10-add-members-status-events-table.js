const {addTable} = require('../../utils');

module.exports = addTable('members_status_events', {
    id: {type: 'string', maxlength: 24, nullable: false, primary: true},
    member_id: {type: 'string', maxlength: 24, nullable: false, references: 'members.id', cascadeDelete: true},
    status: {type: 'string', maxlength: 50, nullable: false},
    created_at: {type: 'dateTime', nullable: false}
});
