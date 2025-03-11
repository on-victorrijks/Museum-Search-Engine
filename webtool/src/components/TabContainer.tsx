import React, {
    use,
    useEffect,
    useState,
} from 'react';
import { TabData } from '../types/tab';
import { FaFolderPlus, FaTimes } from 'react-icons/fa';
import SearchResults from './SearchResults';
import { FaPenToSquare } from 'react-icons/fa6';
import { Query } from '../types/queries';
import ArtPieceProfile from './ArtPieceProfile';

const TabContainer: React.FC<{
    tabs: TabData[];
    selectedTabIdentifier: string;
    selectTab: (tabIdentifier: string) => void;
    addTab: (tab: TabData) => void;
    removeTab: (tabIdentifier: string) => void;
    dislikeRecord: (imageInformations: Record<string, any>) => void;
    likeRecord: (imageInformations: Record<string, any>) => void;
    getLikeStatus: (
        recordID: number
    ) => boolean | undefined;
    openArtPieceProfileWrapper: (fromTabIdentifier: string, recordID: number, openInNewTab: boolean) => void;
}> = ({
    tabs,
    selectedTabIdentifier,
    selectTab,
    addTab,
    removeTab,
    dislikeRecord,
    likeRecord,
    getLikeStatus,
    openArtPieceProfileWrapper
}) => {

    const [openInNewTabPerTab, setOpenInNewTabPerTab] = useState<Record<string, boolean>>({});

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

    const getOpenInNewTabStatut = (tabIdentifier: string) => {
        const keys = Object.keys(openInNewTabPerTab);
        if (!keys.includes(tabIdentifier)) {
            return false;
        }
        return openInNewTabPerTab[tabIdentifier];
    }

    const switchOpenInNewTab = (tabIdentifier: string) => {
        const currentValue = getOpenInNewTabStatut(tabIdentifier);
        setOpenInNewTabPerTab({
            ...openInNewTabPerTab,
            [tabIdentifier]: !currentValue
        });
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
                        { tab.type==="artpiece-profile" &&
                            <button className="long" onClick={() => switchOpenInNewTab(tab.identifier)}>
                                <div className="switch" is-enabled={getOpenInNewTabStatut(tab.identifier) ? "true" : "false"}>
                                    <div className="switch-handler"></div>
                                </div>
                                <FaFolderPlus />
                            </button>
                        }
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
                                    addTab={addTab}
                                />
                            </>
                        }
                        { tab.type === 'artpiece-profile' && 
                            <ArtPieceProfile 
                                recordID={tab.content.recordID}
                                tab={tab}
                                openArtPieceProfile={(recordID: number) => openArtPieceProfileWrapper(
                                    tab.identifier,
                                    recordID, 
                                    getOpenInNewTabStatut(tab.identifier)
                                )}
                            />
                        }
                    </div>
                </div>
            ))}

        </>
    );
};

export default TabContainer;