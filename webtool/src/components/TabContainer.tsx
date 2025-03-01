import React, {
    use,
    useEffect,
    useState,
} from 'react';
import { TabData } from '../types/tab';
import { FaTimes } from 'react-icons/fa';
import SearchResults from './SearchResults';

interface TabContainer {
    tabs: TabData[];
    removeTab: (tabIdentifier: string) => void;
    dislikeRecord: (imageInformations: Record<string, any>) => void;
    likeRecord: (imageInformations: Record<string, any>) => void;
    getLikeStatus: (
        tabIdentifier: string,
        recordID: number
    ) => boolean | undefined;
}

const TabContainer: React.FC<TabContainer> = ({
    tabs,
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
    
    return (
        <>

            {tabs.map(tab => (
                <div key={tab.identifier} className='tab'>

                    <div className='tab-handler'>
                        <h1>{getTabName(tab)}</h1>
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
                                    results={tab.content.results} 
                                    dislikeRecord={dislikeRecord}
                                    likeRecord={likeRecord}
                                    getLikeStatus={(recordID) => getLikeStatus(tab.identifier, recordID)}
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