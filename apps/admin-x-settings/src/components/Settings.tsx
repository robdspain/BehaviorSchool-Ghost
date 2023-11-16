import React from 'react';

import AdvancedSettings from './settings/advanced/AdvancedSettings';
import EmailSettings from './settings/email/EmailSettings';
import GeneralSettings from './settings/general/GeneralSettings';
import GrowthSettings from './settings/growth/GrowthSettings';
import MembershipSettings from './settings/membership/MembershipSettings';
import SiteSettings from './settings/site/SiteSettings';

const Settings: React.FC = () => {
    return (
        <>
            <div className='mb-[40vh]'>
                <GeneralSettings />
                <SiteSettings />
                <MembershipSettings />
                <GrowthSettings />
                <EmailSettings />
                <AdvancedSettings />
            </div>
        </>
    );
};

export default Settings;
