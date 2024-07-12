/* eslint-disable ghost/ghost-custom/max-api-complexity */
const path = require('path');
const errors = require('@tryghost/errors');
const imageTransform = require('@tryghost/image-transform');

const {customAlphabet} = require('nanoid');
const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const nanoid = customAlphabet(alphabet, 10);
const nanoidSuffixRegex = /^.*(_[a-zA-Z0-9]{10})$/;
const generateSuffix = () => `_${nanoid()}`;

const storage = require('../../adapters/storage');
const config = require('../../../shared/config');

/** @type {import('@tryghost/api-framework').Controller} */
const controller = {
    docName: 'images',
    upload: {
        statusCode: 201,
        headers: {
            cacheInvalidate: false
        },
        permissions: false,
        async query(frame) {
            const store = storage.getStorage('images');

            // Normalize
            const imageOptimizationOptions = config.get('imageOptimization');

            // Trim _o from file name (not allowed suffix)
            frame.file.name = frame.file.name.replace(/_o(\.\w+?)$/, '$1');

            // Add a random suffix to the image name before the extension. If
            // the image already has a suffix, replace it with a new one. This
            // removes the ability to guess the path of the source image when
            // the upload is an edit of an existing image
            const fileNameInfo = path.parse(frame.file.name);
            const currentNanoid = nanoidSuffixRegex.exec(fileNameInfo.name);

            if (currentNanoid) {
                frame.file.name = frame.file.name.replace(currentNanoid[1], generateSuffix());
            } else {
                frame.file.name = `${fileNameInfo.name}${generateSuffix()}${fileNameInfo.ext}`;
            }

            // CASE: image transform is not capable of transforming file (e.g. .gif)
            if (imageTransform.shouldResizeFileExtension(frame.file.ext) && imageOptimizationOptions.resize) {
                const out = `${frame.file.path}_processed`;
                const originalPath = frame.file.path;

                const options = Object.assign({
                    in: originalPath,
                    out,
                    ext: frame.file.ext,
                    width: config.get('imageOptimization:defaultMaxWidth')
                }, imageOptimizationOptions);

                try {
                    await imageTransform.resizeFromPath(options);
                } catch (err) {
                    // If the image processing fails, we don't want to store the image because it's corrupted/invalid
                    throw new errors.BadRequestError({
                        message: 'Image processing failed',
                        context: err.message,
                        help: 'Please verify that the image is valid'
                    });
                }

                // Store the processed/optimized image
                const processedImageUrl = await store.save({
                    ...frame.file,
                    path: out
                });

                let processedImageName = path.basename(processedImageUrl);
                let processedImageDir = undefined;

                if (store.urlToPath) {
                    // Currently urlToPath is not part of StorageBase, so not all storage provider have implemented it
                    const processedImagePath = store.urlToPath(processedImageUrl);

                    // Get the path and name of the processed image
                    // We want to store the original image on the same name + _o
                    // So we need to wait for the first store to finish before generating the name of the original image
                    processedImageName = path.basename(processedImagePath);
                    processedImageDir = path.dirname(processedImagePath);
                }

                // Store the original image
                await store.save({
                    ...frame.file,
                    path: originalPath,
                    name: imageTransform.generateOriginalImageName(processedImageName)
                }, processedImageDir);

                return processedImageUrl;
            }

            return store.save(frame.file);
        }
    }
};

module.exports = controller;
