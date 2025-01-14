import React, {useEffect, useRef, useState} from 'react';

import {ActorProperties} from '@tryghost/admin-x-framework/api/activitypub';
import {Button, Icon, LoadingIndicator, NoValueLabel, TextField} from '@tryghost/admin-x-design-system';
import {useDebounce} from 'use-debounce';

import APAvatar from './global/APAvatar';
import ActivityItem from './activities/ActivityItem';
import FollowButton from './global/FollowButton';
import MainNavigation from './navigation/MainNavigation';
import Separator from './global/Separator';

import NiceModal from '@ebay/nice-modal-react';
import ViewProfileModal from './modals/ViewProfileModal';

import {type Account} from '../api/activitypub';
import {useSearchForUser, useSuggestedProfiles} from '../hooks/useActivityPubQueries';

interface SearchResultItem {
    actor: ActorProperties;
    handle: string;
    followerCount: number;
    followingCount: number;
    isFollowing: boolean;
}

interface SearchResultAccountProps {
    account: Account;
    update: (id: string, updated: Partial<Account>) => void;
}

const SearchResultAccount: React.FC<SearchResultAccountProps> = ({account, update}) => {
    const onFollow = () => {
        update(account.id!, {
            followedByMe: true,
            followerCount: account.followerCount + 1
        });
    };

    const onUnfollow = () => {
        update(account.id!, {
            followedByMe: false,
            followerCount: account.followerCount - 1
        });
    };

    return (
        <ActivityItem
            key={account.id}
            onClick={() => {
                NiceModal.show(ViewProfileModal, {profile: account, onFollow, onUnfollow});
            }}
        >
            <APAvatar author={account.actor}/>
            <div>
                <div className='text-grey-600'>
                    <span className='font-bold text-black'>{account.actor.name} </span>{account.handle}
                </div>
                <div className='text-sm'>{new Intl.NumberFormat().format(account.followerCount)} followers</div>
            </div>
            <FollowButton
                className='ml-auto'
                following={account.followedByMe}
                handle={account.handle}
                type='link'
                onFollow={onFollow}
                onUnfollow={onUnfollow}
            />
        </ActivityItem>
    );
};

const SearchResultAccounts: React.FC<{
    accounts: Account[];
    onUpdate: (id: string, updated: Partial<Account>) => void;
}> = ({accounts, onUpdate}) => {
    return (
        <>
            {accounts.map(account => (
                <SearchResultAccount
                    key={account.id}
                    account={account}
                    update={onUpdate}
                />
            ))}
        </>
    );
};

const SuggestedAccounts: React.FC<{
    profiles: SearchResultItem[];
    isLoading: boolean;
    onUpdate: (id: string, updated: Partial<SearchResultItem>) => void;
}> = ({profiles, isLoading, onUpdate}) => {
    return (
        <>
            <span className='mb-1 flex w-full max-w-[560px] font-semibold'>
                Suggested accounts
            </span>
            {isLoading && (
                <div className='p-4'>
                    <LoadingIndicator size='md'/>
                </div>
            )}
            {profiles.map((profile, index) => {
                return (
                    <React.Fragment key={profile.actor.id}>
                        <SearchResult
                            key={profile.actor.id}
                            result={profile}
                            update={onUpdate}
                        />
                        {index < profiles.length - 1 && <Separator />}
                    </React.Fragment>
                );
            })}
        </>
    );
};

interface SearchProps {}

const Search: React.FC<SearchProps> = ({}) => {
    // Initialise suggested profiles
    const {suggestedProfilesQuery, updateSuggestedProfile} = useSuggestedProfiles('index', 6);
    const {data: suggestedData, isLoading: isLoadingSuggested} = suggestedProfilesQuery;
    const suggested = suggestedData || [];

    // Initialise search query
    const queryInputRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState('');
    const [debouncedQuery] = useDebounce(query, 300);
    const {searchQuery, updateSearchResultAccount: updateResult} = useSearchForUser('index', query !== '' ? debouncedQuery : query);
    const {data, isFetching, isFetched} = searchQuery;

    const results = data?.accounts || [];
    const showLoading = isFetching && query.length > 0;
    const showNoResults = !isFetching && isFetched && results.length === 0 && query.length > 0 && debouncedQuery === query;
    const showSuggested = query === '' || (isFetched && results.length === 0);

    // Focus the query input on initial render
    useEffect(() => {
        if (queryInputRef.current) {
            queryInputRef.current.focus();
        }
    }, []);

    return (
        <>
            <MainNavigation page='search' />
            <div className='z-0 mx-auto flex w-full max-w-[560px] flex-col items-center pt-8'>
                <div className='relative flex w-full items-center'>
                    <Icon className='absolute left-3 top-3 z-10' colorClass='text-grey-500' name='magnifying-glass' size='sm' />
                    <TextField
                        autoComplete='off'
                        className='mb-6 mr-12 flex h-10 w-full items-center rounded-lg border border-transparent bg-grey-100 px-[33px] py-1.5 transition-colors focus:border-green focus:bg-white focus:outline-2 dark:border-transparent dark:bg-grey-925 dark:text-white dark:placeholder:text-grey-800 dark:focus:border-green dark:focus:bg-grey-950 tablet:mr-0'
                        containerClassName='w-100'
                        inputRef={queryInputRef}
                        placeholder='Enter a username...'
                        title="Search"
                        type='text'
                        value={query}
                        clearBg
                        hideTitle
                        unstyled
                        onChange={e => setQuery(e.target.value)}
                    />
                    {query && (
                        <Button
                            className='absolute top-3 p-1 sm:right-14 tablet:right-3'
                            icon='close'
                            iconColorClass='text-grey-700 !w-[10px] !h-[10px]'
                            size='sm'
                            unstyled
                            onClick={() => {
                                setQuery('');
                                queryInputRef.current?.focus();
                            }}
                        />
                    )}
                </div>
                {showLoading && <LoadingIndicator size='lg'/>}

                {showNoResults && (
                    <NoValueLabel icon='user'>
                        No users matching this username
                    </NoValueLabel>
                )}

                {!showLoading && !showNoResults && (
                    <SearchResultAccounts
                        accounts={results}
                        onUpdate={updateResult}
                    />
                )}

                {showSuggested && (
                    <SuggestedAccounts
                        isLoading={isLoadingSuggested}
                        profiles={suggested as SearchResultItem[]}
                        onUpdate={updateSuggestedProfile}
                    />
                )}
            </div>
        </>
    );
};

export default Search;
