import { Query } from "../../types/queries";
import { TabData } from "../../types/tab";
import { useState } from 'react';
import TabHandler from "./TabHandler";
import SearchResults from "../SearchResults";
import ArtPieceData from "../../types/ArtPiece";

const ResultsTab: React.FC<{
    selectedTabIdentifier: string;
    loading: boolean;
    tab: TabData;
    selectTab: (tabIdentifier: string) => void;
    removeTab: (tabIdentifier: string) => void;
    switchOpenInNewTab: (tabIdentifier: string) => void;
    getOpenInNewTabStatut: (tabIdentifier: string) => boolean;
    dislikeRecord: (imageInformations: ArtPieceData) => void;
    likeRecord: (imageInformations: ArtPieceData) => void;
    getLikeStatus: (recordID: number) => boolean | undefined;
    addTermFromIconography: (term: string) => void;
    getTermStatusInQuery: (term: string) => boolean;
    addTab: (tab: TabData) => void;
    openArtistProfileWrapper: (fromTabIdentifier: string, creatorid: string, openInNewTab: boolean) => void;
    canLike: boolean;
    askForMoreResults: () => void;
}> = ({
    selectedTabIdentifier,
    loading,
    tab,
    selectTab,
    removeTab,
    switchOpenInNewTab,
    getOpenInNewTabStatut,
    dislikeRecord,
    likeRecord,
    getLikeStatus,
    addTermFromIconography,
    getTermStatusInQuery,
    addTab,
    openArtistProfileWrapper,
    canLike,
    askForMoreResults
}) => {

    const is_selected = selectedTabIdentifier === tab.identifier;
    const is_loading = loading && is_selected;

    const [userChangedColumnsCount, setUserChangedColumnsCount] = useState(false);
    const [columnsCount, setColumnsCount] = useState(3); 

    const MIN_COLUMNS_COUNT = 1;
    const MAX_COLUMNS_COUNT = 10;

    const canDecreaseColumnsCount = columnsCount > MIN_COLUMNS_COUNT;
    const canIncreaseColumnsCount = columnsCount < MAX_COLUMNS_COUNT;

    const setColumnsCountWrapper = (columnsCount: number) => {
        if (columnsCount < MIN_COLUMNS_COUNT) return false;
        if (columnsCount > MAX_COLUMNS_COUNT) return false;
        setColumnsCount(columnsCount);
        return true;
    }

    const decreaseColumnsCount = () => {
        setUserChangedColumnsCount(setColumnsCountWrapper(columnsCount - 1));
    }

    const increaseColumnsCount = () => {
        setUserChangedColumnsCount(setColumnsCountWrapper(columnsCount + 1));
        
    }

    const isEmptyQuery = (query: Query) => {
        return query.parts.length === 0;
    }

    return (
        <div 
            key={tab.identifier} 
            className={`tab ${is_selected ? 'selected' : ''}`}
        >

            <TabHandler
                tab={tab}
                switchOpenInNewTab={switchOpenInNewTab}
                getOpenInNewTabStatut={getOpenInNewTabStatut}
                increaseColumnsCount={increaseColumnsCount}
                canIncreaseColumnsCount={canIncreaseColumnsCount}
                decreaseColumnsCount={decreaseColumnsCount}
                canDecreaseColumnsCount={canDecreaseColumnsCount}
                selectTab={selectTab}
                removeTab={removeTab}
            />

            { is_loading &&
                <div className="tab-content-loading">
                    <div className="lds-ripple"><div></div><div></div></div> {/* https://loading.io/css/ */}
                </div>
            }

            <div className={`tab-content ${is_loading ? 'loading' : ''}`}>
                <SearchResults 
                    isEmptyQuery={isEmptyQuery(tab.content.query)}
                    results={tab.content.results} 

                    dislikeRecord={dislikeRecord}
                    likeRecord={likeRecord}
                    getLikeStatus={(recordID) => getLikeStatus(recordID)}

                    addTermFromIconography={addTermFromIconography}
                    getTermStatusInQuery={getTermStatusInQuery}

                    addTab={addTab}
                    openArtistProfile={(creatorid: string) => openArtistProfileWrapper(
                        tab.identifier,
                        creatorid,
                        getOpenInNewTabStatut(tab.identifier)
                    )}

                    canLike={canLike}

                    askForMoreResults={askForMoreResults}

                    columnsCount={columnsCount}
                    setColumnsCount={setColumnsCountWrapper}
                    
                    userChangedColumnsCount={userChangedColumnsCount}
                />
            </div>

        </div>
    );
};

export default ResultsTab;