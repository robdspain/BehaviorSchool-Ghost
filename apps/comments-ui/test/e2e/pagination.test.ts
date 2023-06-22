import {MockedApi, initialize} from '../utils/e2e';
import {expect, test} from '@playwright/test';

test.describe('Pagination', async () => {
    test('Shows pagination button on top if more than 5 comments', async ({page}) => {
        const mockedApi = new MockedApi({});

        mockedApi.addComment({
            html: '<p>This is comment 1</p>'
        });
        mockedApi.addComment({
            html: '<p>This is comment 2</p>'
        });
        mockedApi.addComment({
            html: '<p>This is comment 3</p>'
        });
        mockedApi.addComment({
            html: '<p>This is comment 4</p>'
        });
        mockedApi.addComment({
            html: '<p>This is comment 5</p>'
        });
        mockedApi.addComment({
            html: '<p>This is comment 6</p>'
        });

        const {frame} = await initialize({
            mockedApi,
            page,
            publication: 'Publisher Weekly'
        });

        await expect(frame.getByTestId('pagination-component')).toBeVisible();

        // Check text in pagination button
        await expect(frame.getByTestId('pagination-component')).toContainText('Show 1 previous comment');

        // Test total comments with test-id comment-component is 5
        await expect(frame.getByTestId('comment-component')).toHaveCount(5);

        // Check only the first 5 comments are visible
        await expect(frame.getByText('This is comment 1')).toBeVisible();
        await expect(frame.getByText('This is comment 2')).toBeVisible();
        await expect(frame.getByText('This is comment 3')).toBeVisible();
        await expect(frame.getByText('This is comment 4')).toBeVisible();
        await expect(frame.getByText('This is comment 5')).toBeVisible();
        await expect(frame.getByText('This is comment 6')).not.toBeVisible();

        // Click the pagination button
        await frame.getByTestId('pagination-component').click();

        // Check only 6 visible (not more than that)
        await expect(frame.getByTestId('comment-component')).toHaveCount(6);

        // Check comments 6 is visible
        await expect(frame.getByText('This is comment 6')).toBeVisible();

        // Check the pagination button is not visible
        await expect(frame.getByTestId('pagination-component')).not.toBeVisible();
    });
});

