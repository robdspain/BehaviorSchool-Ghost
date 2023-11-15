import type {Meta, StoryObj} from '@storybook/react';

import DynamicTable, {DynamicTableColumn, DynamicTableRow} from './DynamicTable';
import Avatar from '../Avatar';
import Hint from '../Hint';

const meta = {
    title: 'Global / Table / Dynamic Table',
    component: DynamicTable,
    tags: ['autodocs']
} satisfies Meta<typeof DynamicTable>;

export default meta;
type Story = StoryObj<typeof DynamicTable>;

const columns: DynamicTableColumn[] = [
    {
        title: 'Member'
    },
    {
        title: 'Status'
    },
    {
        title: 'Open rate'
    },
    {
        title: 'Location',
        noWrap: true
    },
    {
        title: 'Created',
        noWrap: true
    },
    {
        title: 'Signed up on post',
        noWrap: true,
        maxWidth: '150px'
    },
    {
        title: 'Newsletter'
    },
    {
        title: 'Billing period'
    },
    {
        title: 'Email sent'
    }
];

const rows = (noOfRows: number) => {
    const data: DynamicTableRow[] = [];
    for (let i = 0; i < noOfRows; i++) {
        data.push(
            {
                cells: [
                    (<div className='flex items-center gap-2'>
                        {i % 3 === 0 && <Avatar bgColor='green' label='JL' labelColor='white' />}
                        {i % 3 === 1 && <Avatar bgColor='orange' label='GS' labelColor='white' />}
                        {i % 3 === 2 && <Avatar bgColor='black' label='ZB' labelColor='white' />}
                        <div>
                            {i % 3 === 0 && <div className='whitespace-nowrap'>Jamie Larson</div>}
                            {i % 3 === 1 && <div className='whitespace-nowrap'>Giana Septimus</div>}
                            {i % 3 === 2 && <div className='whitespace-nowrap'>Zaire Bator</div>}
                            <div className='text-sm text-grey-700'>jamie@larson.com</div>
                        </div>
                    </div>),
                    'Free',
                    '40%',
                    'London, UK',
                    '22 June 2023',
                    'Lorem ipsum dolor sit amet, consectetur adipiscing elit',
                    'Subscribed',
                    'Monthly',
                    '1,303'
                ]
            }
        );
    }
    return data;
};

/**
 * In its simplest form this component lets you create a table with passing a
 * `columns` and `rows` parameter. You can customise each column's width, whether
 * it should wrap etc.
 */
export const Default: Story = {
    args: {
        columns: columns,
        rows: rows(10)
    }
};

/**
 * By default it's just a simple table but you can set its header or footer to
 * be sticky. In this case the container is `absolute` positioned with `inset-0`
 * so the size and layout of the table is completely controlled by its container.
 */
export const StickyHeader: Story = {
    args: {
        stickyHeader: true,
        columns: columns,
        rows: rows(40)
    }
};

export const StickyFooter: Story = {
    args: {
        stickyFooter: true,
        footer: <Hint>Here we go</Hint>,
        columns: columns,
        rows: rows(40)
    }
};

export const AllSticky: Story = {
    args: {
        stickyHeader: true,
        stickyFooter: true,
        footer: <Hint>Here we go</Hint>,
        columns: columns,
        rows: rows(40)
    }
};

export const HalfPageExample: Story = {
    decorators: [(_story: () => React.ReactNode) => (
        <div className='absolute inset-0 p-10'>
            <div className='flex h-full'>
                <div className='w-1/2'>
                    <h1 className='mb-3'>Half page example</h1>
                    <p className='max-w-2xl pb-6'>This example shows how the table can positioned on the page by its container. You can enable this mode by setting `absolute=true` or by enabling `stickyHeader` or `stickyFooter` (in these cases the component switches to `display: absolute`).</p>
                    <p className='max-w-2xl pb-6'>If you use the table like this, make sure to set the container to `display:relative`.</p>
                </div>
                <div className='relative h-1/2 flex-auto' id='componentContainer'>{_story()}</div>
            </div>
        </div>
    )],
    args: {
        stickyHeader: true,
        stickyFooter: true,
        columns: columns,
        rows: rows(40),
        footer: <Hint>This is a table footer</Hint>
    }
};

export const FullPageExample: Story = {
    decorators: [(_story: () => React.ReactNode) => (
        <div className='absolute inset-0 p-10'>
            <div className='flex h-full flex-col'>
                <h1 className='mb-3'>Page title</h1>
                <p className='max-w-2xl pb-6'>This example shows how you can create a page with arbitrary content on the top and a large table at the bottom that fills up the remaining space. The table has a sticky header row, a footer that is always visible and scrolling vertically and horizontally (resize the window to see the effect).</p>
                <p className='max-w-2xl pb-6'>The size and positioning of the table is completely controlled by its <strong>container</strong>. The container must have `relative` position. Use a column flexbox as the main container of the page then set the table container to flex-auto to fill the available horizontal space.</p>
                <div className='relative -mx-10 flex-auto'>{_story()}</div>
            </div>
        </div>
    )],
    args: {
        stickyHeader: true,
        stickyFooter: true,
        columns: columns,
        rows: rows(40),
        tableContainerClassName: 'px-10',
        footerClassName: 'mx-10',
        footer: <Hint>This is a table footer</Hint>
    }
};