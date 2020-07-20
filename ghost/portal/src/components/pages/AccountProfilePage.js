import AppContext from '../../AppContext';
import MemberAvatar from '../common/MemberGravatar';
import ActionButton from '../common/ActionButton';
import InputField from '../common/InputField';
import Switch from '../common/Switch';
import isPreviewMode from '../../utils/is-preview-mode';

const React = require('react');

export const AccountProfilePageStyles = ``;

export default class AccountProfilePage extends React.Component {
    static contextType = AppContext;

    constructor(props, context) {
        super(props, context);
        const {name = '', email = ''} = context.member || {};
        this.state = {
            name,
            email
        };
    }

    componentDidMount() {
        const {member} = this.context;
        if (!member && !isPreviewMode()) {
            this.context.onAction('switchPage', {
                page: 'signup'
            });
        }
    }

    handleSignout(e) {
        e.preventDefault();
        this.context.onAction('signout');
    }

    onBack(e) {
        this.context.onAction('back');
    }

    onProfileSave(e) {
        const {email, name} = this.state;
        const originalEmail = this.context.member.email;
        if (email !== originalEmail) {
            this.context.onAction('updateEmail', {email, oldEmail: originalEmail, emailType: 'updateEmail'});
        }
        this.context.onAction('updateMember', {email, name});
    }

    renderSaveButton() {
        const isRunning = (this.context.action === 'updateMember:running');
        const isSaved = (this.context.action === 'updateMember:success');
        let label = 'Save';
        if (isRunning) {
            label = 'Saving';
        } else if (isSaved) {
            label = 'Saved';
        }
        const disabled = isRunning ? true : false;
        return (
            <ActionButton
                style={{button: {width: '120px'}}}
                onClick={e => this.onProfileSave(e)}
                disabled={disabled}
                brandColor={this.context.brandColor}
                label={label}
            />
        );
    }

    renderDeleteAccountButton() {
        return (
            <div style={{cursor: 'pointer', color: 'red'}} role='button'> Delete Account </div>
        );
    }

    renderAccountFooter() {
        return (
            <div>
                <div style={{display: 'flex', flexGrow: 1, justifyContent: 'flex-end'}}>
                    {this.renderSaveButton()}
                </div>
            </div>
        );
    }

    renderHeader() {
        return (
            <div className='gh-portal-detail-header'>
                <button className='gh-portal-btn gh-portal-btn-back' style={{color: this.context.brandColor}} onClick={e => this.onBack(e)}>Back</button>
                <h3 className='gh-portal-maiin-title'>Account settings</h3>
            </div>
        );
    }

    renderUserAvatar() {
        const avatarImg = (this.context.member && this.context.member.avatar_image);

        const avatarContainerStyle = {
            position: 'relative',
            display: 'flex',
            width: '64px',
            height: '64px',
            marginBottom: '6px',
            borderRadius: '100%',
            boxShadow: '0 0 0 3px #fff',
            border: '1px solid gray',
            overflow: 'hidden',
            justifyContent: 'center',
            alignItems: 'center'
        };

        return (
            <div style={avatarContainerStyle}>
                <MemberAvatar gravatar={avatarImg} style={{userIcon: {color: 'black', width: '45px', height: '45px'}}} />
            </div>
        );
    }

    handleInput(e, field) {
        this.setState({
            [field]: e.target.value
        });
    }

    renderInputField(fieldName) {
        const fields = {
            name: {
                type: 'text',
                value: this.state.name,
                placeholder: 'Name...',
                label: 'Name',
                name: 'name'
            },
            email: {
                type: 'email',
                value: this.state.email,
                placeholder: 'Email...',
                label: 'Email',
                name: 'email'
            }
        };
        const field = fields[fieldName];
        return (
            <InputField
                {...field}
                onChange={(e, name) => this.handleInput(e, name)}
            />
        );
    }

    renderProfileData() {
        return (
            <div className='gh-portal-section form'>
                {this.renderInputField('name')}
                {this.renderInputField('email')}
            </div>
        );
    }

    onToggleSubscription(e, subscribed) {
        this.context.onAction('updateMember', {subscribed: !subscribed});
    }

    renderNewsletterOption() {
        const {subscribed, paid} = this.context.member;
        if (paid) {
            return null;
        }
        const label = subscribed ? 'You are subscribed to email newsletters' : 'You are not subscribed to email newsletters';
        return (
            <div>
                <div style={{flexGrow: 1}}>
                    <div style={{
                        marginBottom: '3px',
                        fontSize: '12px',
                        fontWeight: '700'
                    }}> Newsletter </div>
                    <div style={{
                        color: '#666666',
                        fontSize: '13px',
                        lineHeight: '6px'
                    }}> {label} </div>
                </div>
                <div>
                    <Switch onToggle={(e) => {
                        this.onToggleSubscription(e, subscribed);
                    }} checked={subscribed} />
                </div>
            </div>
        );
    }

    render() {
        const {member} = this.context;
        if (!member) {
            return null;
        }
        return (
            <div style={{display: 'flex', flexDirection: 'column', color: '#313131'}}>
                {this.renderHeader()}
                {this.renderProfileData()}
                {this.renderNewsletterOption()}
                {this.renderAccountFooter()}
            </div>
        );
    }
}