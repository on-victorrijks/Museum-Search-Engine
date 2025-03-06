import React, {
    use,
    useEffect,
    useState,
} from 'react';
import { TabData } from '../types/tab';
import { FaTimes } from 'react-icons/fa';
import SearchResults from './SearchResults';
import { FaPenToSquare } from 'react-icons/fa6';
import { Query } from '../types/queries';

interface TabContainer {
    tabs: TabData[];
    selectedTabIdentifier: string;
    selectTab: (tabIdentifier: string) => void;
    removeTab: (tabIdentifier: string) => void;
    dislikeRecord: (imageInformations: Record<string, any>) => void;
    likeRecord: (imageInformations: Record<string, any>) => void;
    getLikeStatus: (
        recordID: number
    ) => boolean | undefined;
}

const TabContainer: React.FC<TabContainer> = ({
    tabs,
    selectedTabIdentifier,
    selectTab,
    removeTab,
    dislikeRecord,
    likeRecord,
    getLikeStatus
}) => {

    const getTabName = (tab: TabData) => {
        switch(tab.type) {
            case 'results':
                return 'Résultats';
            case 'imageProfile':
                return 'Image de profil';
            case 'ArtistProfile':
                return 'Profil d\'artiste';
            default:
                return 'Tab';
        }
    }
    
    const isEmptyQuery = (query: Query) => {
        return query.parts.length === 0;
    }

    return (
        <>
            
            {tabs.map(tab => (
                <div 
                key={tab.identifier} 
                className={`tab ${selectedTabIdentifier === tab.identifier ? 'selected' : ''}`}
                >

                    <div 
                        className='tab-handler'
                    >
                        <h1>{getTabName(tab)} - {tab.identifier}</h1>
                        <button
                            onClick={() => selectTab(tab.identifier)}
                        >
                            <FaPenToSquare />
                        </button>
                        <button
                            onClick={() => removeTab(tab.identifier)}
                        >
                            <FaTimes />
                        </button>
                    </div>

                    <div className='tab-content'>
                        {
                            tab.type === 'results' && <>
                                <SearchResults 
                                    isEmptyQuery={isEmptyQuery(tab.content.query)}
                                    results={tab.content.results} 
                                    dislikeRecord={dislikeRecord}
                                    likeRecord={likeRecord}
                                    getLikeStatus={(recordID) => getLikeStatus(recordID)}
                                />
                            </>
                        }
                    </div>
                </div>
            ))}

        </>
    );
};

export default TabContainer;