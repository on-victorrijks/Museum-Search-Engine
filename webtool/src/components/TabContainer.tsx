import React, {
    useState,
} from 'react';
import { TabData } from '../types/tab';
import { FaFolderPlus, FaTimes } from 'react-icons/fa';
import SearchResults from './SearchResults';
import { FaPenToSquare } from 'react-icons/fa6';
import { Query } from '../types/queries';
import ArtPieceProfile from './Profiles/ArtPieceProfile';
import ArtistProfile from './Profiles/ArtistProfile';
import CollectionTab from './Collection/CollectionTab';
import CollectionData from '../types/Collections';
import ArtPieceData from '../types/ArtPiece';
import '../styles/tabs.css';

const renderTab = (
    loading: boolean,
    tab: TabData,
    selectedTabIdentifier: string,
    selectTab: (tabIdentifier: string) => void,
    removeTab: (tabIdentifier: string) => void,
    switchOpenInNewTab: (tabIdentifier: string) => void,
    getOpenInNewTabStatut: (tabIdentifier: string) => boolean,
    getTabName: (tab: TabData) => string,
    isEmptyQuery: (query: Query) => boolean,
    dislikeRecord: (imageInformations: ArtPieceData) => void,
    likeRecord: (imageInformations: ArtPieceData) => void,
    getLikeStatus: (recordID: number) => boolean | undefined,
    addTermFromIconography: (term: string) => void,
    getTermStatusInQuery: (term: string) => boolean,
    addTab: (tab: TabData) => void,
    openArtistProfileWrapper: (fromTabIdentifier: string, recordID: number, openInNewTab: boolean) => void,
    openArtPieceProfileWrapper: (fromTabIdentifier: string, recordID: number, openInNewTab: boolean) => void,
    selectedCollection: CollectionData|undefined,
    canLike: boolean,
    setCollectionDataForAugment: (collectionData: CollectionData) => void,
    setCollectionDataForSlideShow: (collectionData: CollectionData) => void,
) => {

    const is_selected = selectedTabIdentifier === tab.identifier;
    const is_loading = loading && is_selected;

    return (
    <div 
        key={tab.identifier} 
        className={`tab ${is_selected ? 'selected' : ''}`}
    >

        <div 
            className='tab-handler'
        >
            <h1>{getTabName(tab)}</h1>
            { (tab.type==="artpiece-profile" || tab.type==="artist-profile") &&
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

        { is_loading &&
            <div className="tab-content-loading">
                <div className="lds-ripple"><div></div><div></div></div> {/* https://loading.io/css/ */}
            </div>
        }

        <div className={`tab-content ${is_loading ? 'loading' : ''}`}>
            { tab.type === 'results' &&
                <SearchResults 
                    isEmptyQuery={isEmptyQuery(tab.content.query)}
                    results={tab.content.results} 

                    dislikeRecord={dislikeRecord}
                    likeRecord={likeRecord}
                    getLikeStatus={(recordID) => getLikeStatus(recordID)}

                    addTermFromIconography={addTermFromIconography}
                    getTermStatusInQuery={getTermStatusInQuery}

                    addTab={addTab}
                    openArtistProfile={(recordID: number) => openArtistProfileWrapper(
                        tab.identifier,
                        recordID,
                        getOpenInNewTabStatut(tab.identifier)
                    )}

                    selectedCollection={selectedCollection}

                    canLike={canLike}
                />
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
                    openArtistProfile={(recordID: number) => {
                        openArtistProfileWrapper(
                            tab.identifier,
                            recordID,
                            getOpenInNewTabStatut(tab.identifier)
                        );
                    }}

                    dislikeRecord={dislikeRecord}
                    likeRecord={likeRecord}
                    getLikeStatus={(recordID) => getLikeStatus(recordID)}

                    selectedCollection={selectedCollection}

                    canLike={canLike}
                />
            }
            { tab.type === 'artist-profile' &&
                <ArtistProfile
                    recordID={tab.content.recordID}
                    tab={tab}
                    openArtPieceProfile={(recordID: number) => openArtPieceProfileWrapper(
                        tab.identifier,
                        recordID,
                        getOpenInNewTabStatut(tab.identifier)
                    )}
                />
            }
            { tab.type === 'collection' &&
                <CollectionTab
                    collectionIdentifier={tab.content.collectionIdentifier}
                    setCollectionDataForAugment={setCollectionDataForAugment}
                    setCollectionDataForSlideShow={setCollectionDataForSlideShow}
                />
            }
        </div>
    </div>
    );
}

const TabContainer: React.FC<{
    loading: boolean;
    tabs: TabData[];
    selectedTabIdentifier: string;
    selectTab: (tabIdentifier: string) => void;
    addTab: (tab: TabData) => void;
    removeTab: (tabIdentifier: string) => void;

    dislikeRecord: (imageInformations: ArtPieceData) => void;
    likeRecord: (imageInformations: ArtPieceData) => void;
    getLikeStatus: (
        recordID: number
    ) => boolean | undefined;

    addTermFromIconography: (term: string) => void;
    getTermStatusInQuery: (term: string) => boolean;

    openArtPieceProfileWrapper: (fromTabIdentifier: string, recordID: number, openInNewTab: boolean) => void;
    openArtistProfileWrapper: (fromTabIdentifier: string, recordID: number, openInNewTab: boolean) => void;

    setCollectionDataForAugment: (collectionData: CollectionData) => void;
    setCollectionDataForSlideShow: (collectionData: CollectionData) => void;

    selectedCollection: CollectionData|undefined;

    canLike: boolean;
}> = ({
    loading,
    tabs,
    selectedTabIdentifier,
    selectTab,
    addTab,
    removeTab,
    dislikeRecord,
    likeRecord,
    getLikeStatus,
    addTermFromIconography,
    getTermStatusInQuery,
    openArtPieceProfileWrapper,
    openArtistProfileWrapper,
    setCollectionDataForAugment,
    setCollectionDataForSlideShow,
    selectedCollection,
    canLike
}) => {

    const [openInNewTabPerTab, setOpenInNewTabPerTab] = useState<Record<string, boolean>>({});

    const getTabName = (tab: TabData) => {
        switch(tab.type) {
            case 'results':
                return 'Résultats';
            case 'artpiece-profile':
                return 'Profil d\'oeuvre';
            case 'artist-profile':
                return 'Profil d\'artiste';
            case 'collection':
                return 'Collection';
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
            return true;
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
            
            {tabs.map(tab => renderTab(
                loading,
                tab,
                selectedTabIdentifier,
                selectTab,
                removeTab,
                switchOpenInNewTab,
                getOpenInNewTabStatut,
                getTabName,
                isEmptyQuery,
                dislikeRecord,
                likeRecord,
                getLikeStatus,
                addTermFromIconography,
                getTermStatusInQuery,
                addTab,
                openArtistProfileWrapper,
                openArtPieceProfileWrapper,
                selectedCollection,
                canLike,
                setCollectionDataForAugment,
                setCollectionDataForSlideShow
            ))}

        </>
    );
};

export default TabContainer;