import type {Meta, StoryObj} from '@storybook/react';
import {useArgs} from '@storybook/preview-api';

import Page, {CustomGlobalAction} from './Page';
import {Tab} from '../TabView';
import ViewContainer from './ViewContainer';

import {testColumns, testRows} from '../table/DynamicTable.stories';
import {exampleActions as exampleActionButtons} from './ViewContainer.stories';
import DynamicTable from '../table/DynamicTable';
import Hint from '../Hint';
import Heading from '../Heading';
import {tableRowHoverBgClasses} from '../TableRow';
import Icon from '../Icon';

const meta = {
    title: 'Global / Layout / Page',
    component: Page,
    tags: ['autodocs'],
    render: function Component(args) {
        const [, updateArgs] = useArgs();

        return <Page {...args}
            onTabChange={(tab) => {
                updateArgs({selectedTab: tab});
                args.onTabChange?.(tab);
            }}
        />;
    }
} satisfies Meta<typeof Page>;

export default meta;
type Story = StoryObj<typeof Page>;

const dummyContent = <div className='m-auto max-w-[800px] p-5 text-center'>Placeholder content</div>;

const customGlobalActions: CustomGlobalAction[] = [
    {
        iconName: 'heart',
        onClick: () => {
            alert('Clicked on custom action');
        }
    }
];

const pageTabs: Tab[] = [
    {
        id: 'active',
        title: 'Active'
    },
    {
        id: 'archive',
        title: 'Archive'
    }
];

export const Default: Story = {
    parameters: {
        layout: 'fullscreen'
    },
    args: {
        pageTabs: pageTabs,
        children: dummyContent
    }
};

export const WithHamburger: Story = {
    parameters: {
        layout: 'fullscreen'
    },
    args: {
        pageTabs: pageTabs,
        showPageMenu: true,
        children: dummyContent
    }
};

export const WithGlobalActions: Story = {
    parameters: {
        layout: 'fullscreen'
    },
    args: {
        pageTabs: pageTabs,
        showPageMenu: true,
        showGlobalActions: true,
        children: dummyContent
    }
};

export const CustomGlobalActions: Story = {
    parameters: {
        layout: 'fullscreen'
    },
    args: {
        pageTabs: pageTabs,
        showPageMenu: true,
        showGlobalActions: true,
        children: dummyContent,
        customGlobalActions: customGlobalActions
    }
};

const simpleList = <ViewContainer
    title='Members'
    type='page'
>
    <DynamicTable
        columns={testColumns}
        footer={<Hint>Just a regular table footer</Hint>}
        rows={testRows(100)}
    />
</ViewContainer>;

export const ExampleSimpleList: Story = {
    parameters: {
        layout: 'fullscreen'
    },
    name: 'Example: Simple List',
    args: {
        pageTabs: pageTabs,
        showPageMenu: true,
        showGlobalActions: true,
        children: simpleList
    }
};

const stickyList = <ViewContainer
    title='Members'
    type='page'
>
    <DynamicTable
        columns={testColumns}
        footer={<Hint>Sticky footer</Hint>}
        rows={testRows(40)}
        stickyFooter
        stickyHeader
    />
</ViewContainer>;

export const ExampleStickyList: Story = {
    parameters: {
        layout: 'fullscreen'
    },
    name: 'Example: Sticky Header/Footer List',
    args: {
        pageTabs: pageTabs,
        showPageMenu: true,
        showGlobalActions: true,
        children: stickyList
    }
};

const examplePrimaryAction = <ViewContainer
    primaryAction={{
        title: 'Add member',
        color: 'black',
        onClick: () => {
            alert('Clicked primary action');
        }
    }}
    title='Members'
    type='page'
>
    <DynamicTable
        columns={testColumns}
        footer={<Hint>Sticky footer</Hint>}
        rows={testRows(40)}
        stickyFooter
        stickyHeader
    />
</ViewContainer>;

export const ExamplePrimaryAction: Story = {
    parameters: {
        layout: 'fullscreen'
    },
    name: 'Example: Primary Action',
    args: {
        pageTabs: pageTabs,
        showPageMenu: true,
        showGlobalActions: true,
        children: examplePrimaryAction
    }
};

const exampleActionsContent = <ViewContainer
    actions={exampleActionButtons}
    primaryAction={{
        title: 'Add member',
        icon: 'add',
        color: 'black',
        onClick: () => {
            alert('Clicked primary action');
        }
    }}
    title='Members'
    type='page'
>
    <DynamicTable
        columns={testColumns}
        footer={<Hint>Sticky footer</Hint>}
        rows={testRows(40)}
        stickyFooter
        stickyHeader
    />
</ViewContainer>;

export const ExampleActions: Story = {
    parameters: {
        layout: 'fullscreen'
    },
    name: 'Example: Custom Actions',
    args: {
        pageTabs: pageTabs,
        showPageMenu: true,
        showGlobalActions: true,
        children: exampleActionsContent
    }
};

const mockIdeaCards = () => {
    const cards = [];

    for (let i = 0; i < 11; i++) {
        cards.push(
            <div className='min-h-[30vh] rounded-sm bg-grey-100 p-7 transition-all hover:bg-grey-200'>
                <Heading level={5}>
                    {i % 3 === 0 && 'Sunset drinks cruise eat sleep repeat'}
                    {i % 3 === 1 && 'Elegance Rolls Royce on my private jet'}
                    {i % 3 === 2 && 'Down to the wire Bathurst 5000 Le Tour'}
                </Heading>
                <div className='mt-4'>
                    {i % 3 === 0 && 'Numea captain’s table crystal waters paradise island the scenic route great adventure. Pirate speak the road less travelled seas the day '}
                    {i % 3 === 1 && 'Another day in paradise cruise life adventure bound gap year cruise time languid afternoons let the sea set you free'}
                    {i % 3 === 2 && <span className='text-grey-500'>No body text</span>}
                </div>
            </div>
        );
    }
    return cards;
};

const exampleCardViewContent = (
    <ViewContainer
        actions={exampleActionButtons}
        primaryAction={{
            title: 'New idea',
            icon: 'add'
        }}
        title='Ideas'
        type='page'
    >
        <div className='grid grid-cols-4 gap-7 py-7'>
            {mockIdeaCards()}
        </div>
    </ViewContainer>
);

export const ExampleCardView: Story = {
    parameters: {
        layout: 'fullscreen'
    },
    name: 'Example: Card View',
    args: {
        pageTabs: pageTabs,
        showPageMenu: true,
        showGlobalActions: true,
        children: exampleCardViewContent
    }
};

const mockPosts = () => {
    const posts = [];

    for (let i = 0; i < 11; i++) {
        posts.push(
            <div className={`grid grid-cols-[96px_auto_120px_120px_60px] items-center gap-7 border-b border-grey-200 py-5 ${tableRowHoverBgClasses}`}>
                <div className='flex h-24 w-24 items-center justify-center rounded-sm bg-grey-100'>

                </div>
                <div className='overflow-hidden'>
                    <div className='flex flex-col'>
                        <Heading className='truncate' level={5}>
                            {i % 3 === 0 && 'Sunset drinks cruise eat sleep repeat'}
                            {i % 3 === 1 && 'Elegance Rolls Royce on my private jet'}
                            {i % 3 === 2 && 'Down to the wire Bathurst 5000 Le Tour'}
                        </Heading>
                        <div className='truncate'>
                            {i % 3 === 0 && 'Numea captain’s table crystal waters paradise island the scenic route great adventure. Pirate speak the road less travelled seas the day '}
                            {i % 3 === 1 && 'Another day in paradise cruise life adventure bound gap year cruise time languid afternoons let the sea set you free'}
                            {i % 3 === 2 && <span className='text-grey-500'>No body text</span>}
                        </div>
                    </div>
                </div>
                <div className='flex flex-col'>
                    <strong>15%</strong>
                    viewed
                </div>
                <div className='flex flex-col'>
                    <strong>55%</strong>
                    opened
                </div>
                <div className='flex justify-end pr-7'>
                    <Icon name='pen' size='sm' />
                </div>
            </div>
        );
    }
    return posts;
};

const examplePostsContent = (
    <ViewContainer
        actions={exampleActionButtons}
        primaryAction={{
            title: 'New post',
            icon: 'add'
        }}
        title='Posts'
        type='page'
    >
        <div className='mb-10'>
            {<>{mockPosts()}</>}
        </div>
    </ViewContainer>
);

export const ExampleAlternativeList: Story = {
    parameters: {
        layout: 'fullscreen'
    },
    name: 'Example: Alternative List',
    args: {
        pageTabs: pageTabs,
        showPageMenu: true,
        showGlobalActions: true,
        children: examplePostsContent
    }
};