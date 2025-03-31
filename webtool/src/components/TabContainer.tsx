import React, {
    useState,
} from 'react';
import { TabData } from '../types/tab';
import ArtPieceData from '../types/ArtPiece';
import '../styles/tabs.css';
import ResultsTab from './Tabs/ResultsTab';
import ArtPieceProfileTab from './Tabs/ArtPieceProfileTab';
import ArtistProfileTab from './Tabs/ArtistProfileTab';
import CollectionTab from './Tabs/CollectionTab';

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
    openArtistProfileWrapper: (fromTabIdentifier: string, creatorid: string, openInNewTab: boolean) => void;

    canLike: boolean;

    askForMoreResults: () => void;
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
    canLike,
    askForMoreResults
}) => {

    const [openInNewTabPerTab, setOpenInNewTabPerTab] = useState<Record<string, boolean>>({});

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

    const renderTab = (tab: TabData, index: number) => {
        switch (tab.type) {
            case 'results':
                return (
                    <ResultsTab
                        key={index}
                        tab={tab}
                        selectedTabIdentifier={selectedTabIdentifier}
                        selectTab={selectTab}
                        removeTab={removeTab}
                        switchOpenInNewTab={switchOpenInNewTab}
                        getOpenInNewTabStatut={getOpenInNewTabStatut}
                        dislikeRecord={dislikeRecord}
                        likeRecord={likeRecord}
                        getLikeStatus={getLikeStatus}
                        addTermFromIconography={addTermFromIconography}
                        getTermStatusInQuery={getTermStatusInQuery}
                        addTab={addTab}
                        openArtistProfileWrapper={openArtistProfileWrapper}
                        canLike={canLike}
                        askForMoreResults={askForMoreResults} 
                        loading={loading}        
                    />
                );
            case 'artpiece-profile':
                return (
                    <ArtPieceProfileTab
                        key={index}
                        tab={tab}
                        selectedTabIdentifier={selectedTabIdentifier}
                        selectTab={selectTab}
                        removeTab={removeTab}
                        switchOpenInNewTab={switchOpenInNewTab}
                        getOpenInNewTabStatut={getOpenInNewTabStatut}
                        dislikeRecord={dislikeRecord}
                        likeRecord={likeRecord}
                        getLikeStatus={getLikeStatus}
                        openArtistProfileWrapper={openArtistProfileWrapper}
                        canLike={canLike}
                        openArtPieceProfileWrapper={openArtPieceProfileWrapper}
                        loading={loading}
                    />
                );
            case 'artist-profile':
                return (
                    <ArtistProfileTab
                        key={index}
                        tab={tab}
                        selectedTabIdentifier={selectedTabIdentifier}
                        selectTab={selectTab}
                        removeTab={removeTab}
                        switchOpenInNewTab={switchOpenInNewTab}
                        getOpenInNewTabStatut={getOpenInNewTabStatut}
                        openArtPieceProfileWrapper={openArtPieceProfileWrapper}
                        loading={loading}
                    />
                );
            case 'collection':
                return (
                    <CollectionTab
                        key={index}
                        tab={tab}
                        selectedTabIdentifier={selectedTabIdentifier}
                        selectTab={selectTab}
                        removeTab={removeTab}
                        switchOpenInNewTab={switchOpenInNewTab}
                        getOpenInNewTabStatut={getOpenInNewTabStatut}
                        loading={loading}
                    />
                );
            default:
                return null;
        }
    }

    return tabs.map((tab, index) => renderTab(tab, index));
};

export default TabContainer;