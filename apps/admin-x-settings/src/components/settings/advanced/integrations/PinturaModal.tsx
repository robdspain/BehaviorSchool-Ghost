import Button from '../../../../admin-x-ds/global/Button';
import Form from '../../../../admin-x-ds/global/form/Form';
import IntegrationHeader from './IntegrationHeader';
import Modal from '../../../../admin-x-ds/global/modal/Modal';
import NiceModal from '@ebay/nice-modal-react';
import Toggle from '../../../../admin-x-ds/global/form/Toggle';
import pinturaScreenshot from '../../../../assets/images/pintura-screenshot.png';
import useRouting from '../../../../hooks/useRouting';
import {ReactComponent as Icon} from '../../../../assets/icons/pintura.svg';
import {Setting, getSettingValues, useEditSettings} from '../../../../api/settings';
import {showToast} from '../../../../admin-x-ds/global/Toast';
import {useEffect, useRef, useState} from 'react';
import {useGlobalData} from '../../../providers/GlobalDataProvider';
import {useUploadFile} from '../../../../api/files';

const PinturaModal = NiceModal.create(() => {
    const {updateRoute} = useRouting();
    const modal = NiceModal.useModal();
    const [enabled, setEnabled] = useState(false);
    const [uploadingState, setUploadingState] = useState({
        js: false,
        css: false
    });

    const {settings} = useGlobalData();
    const [pinturaEnabled] = getSettingValues<boolean>(settings, ['pintura']);
    const {mutateAsync: editSettings} = useEditSettings();
    const {mutateAsync: uploadFile} = useUploadFile();

    useEffect(() => {
        setEnabled(pinturaEnabled || false);
    }, [pinturaEnabled]);

    const jsUploadRef = useRef<HTMLInputElement>(null);
    const cssUploadRef = useRef<HTMLInputElement>(null);
    const triggerUpload = (form: string) => {
        if (form === 'js') {
            jsUploadRef.current?.click();
        }

        if (form === 'css') {
            cssUploadRef.current?.click();
        }
    };

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>, form: 'js' | 'css') => {
        try {
            setUploadingState(prev => ({...prev, [form]: true}));

            const file = event.target?.files?.[0];
            if (!file) {
                return;
            }

            const {files} = await uploadFile({file});
            const url = files[0].url;
            const updates : Setting[] = [
                {key: `pintura_${form}_url`, value: url}
            ];

            await editSettings(updates);

            setUploadingState(prev => ({...prev, [form]: false}));

            showToast({
                type: 'success',
                message: `Pintura ${form} uploaded successfully`
            });
        } catch (e) {
            setUploadingState({js: false, css: false});
            showToast({
                type: 'pageError',
                message: `Can't upload Pintura ${form}!`
            });
        }
    };

    return (
        <Modal
            afterClose={() => {
                updateRoute('integrations');
            }}
            cancelLabel=''
            okColor='black'
            okLabel='Save'
            testId='pintura-modal'
            title=''
            onOk={async () => {
                modal.remove();
                updateRoute('integrations');
                await editSettings([
                    {key: 'pintura', value: enabled}
                ]);
            }}
        >
            <IntegrationHeader
                detail='Advanced image editing'
                icon={<Icon className='h-12 w-12' />}
                title='Pintura'
            />
            <div className='mt-7'>
                <div className='mb-7 flex flex-col items-stretch justify-between gap-4 rounded-sm bg-grey-75 p-4 dark:bg-grey-950 md:flex-row md:p-7'>
                    <div className='md:basis-1/2'>
                        <p className='mb-4 font-bold'>Add advanced image editing to Ghost, with Pintura</p>
                        <p className='mb-4 text-sm'>Pintura is a powerful JavaScript image editor that allows you to crop, rotate, annotate and modify images directly inside Ghost.</p>
                        <p className='text-sm'>Try a demo, purchase a license, and download the required CSS/JS files from pqina.nl/pintura/ to activate this feature.</p>
                    </div>
                    <div className='flex grow flex-col items-end justify-between gap-2 md:basis-1/2 md:gap-0'>
                        <img alt='Pintura screenshot' src={pinturaScreenshot} />
                        <a className='-mb-1 text-sm font-bold text-green' href="https://pqina.nl/pintura/?ref=ghost.org" rel="noopener noreferrer" target="_blank">Find out more &rarr;</a>
                    </div>
                </div>

                <Form marginBottom={false} title='Pintura configuration' grouped>
                    <Toggle
                        checked={enabled}
                        direction='rtl'
                        hint={<>Enable <a className='text-green' href="https://pqina.nl/pintura/?ref=ghost.org" rel="noopener noreferrer" target="_blank">Pintura</a> for editing your images in Ghost</>}
                        label='Enable Pintura'
                        onChange={(e) => {
                            setEnabled(e.target.checked);
                        }}
                    />
                    {enabled && (
                        <>
                            <div className='flex flex-col justify-between gap-1 md:flex-row md:items-center'>
                                <div>
                                    <div>Upload Pintura script</div>
                                    <div className='text-xs text-grey-600'>Upload the <code>pintura-umd.js</code> file from the Pintura package</div>
                                </div>
                                <input ref={jsUploadRef} accept='.js' type="file" hidden onChange={async (e) => {
                                    await handleUpload(e, 'js');
                                }} />
                                <Button color='outline' disabled={uploadingState.js} label='Upload' onClick={() => {
                                    triggerUpload('js');
                                }} />
                            </div>
                            <div className='flex flex-col justify-between gap-1 md:flex-row md:items-center'>
                                <div>
                                    <div>Upload Pintura styles</div>
                                    <div className='text-xs text-grey-600'>Upload the <code>pintura.css</code> file from the Pintura package</div>
                                </div>
                                <input ref={cssUploadRef} accept='.css' type="file" hidden onChange={async (e) => {
                                    await handleUpload(e, 'css');
                                }} />
                                <Button color='outline' disabled={uploadingState.css} label='Upload' onClick={() => {
                                    triggerUpload('css');
                                }} />
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </Modal>
    );
});

export default PinturaModal;
