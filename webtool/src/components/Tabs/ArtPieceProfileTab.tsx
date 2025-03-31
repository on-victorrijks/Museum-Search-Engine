import { TabData } from "../../types/tab";
import TabHandler from "./TabHandler";
import ArtPieceData from "../../types/ArtPiece";
import ArtPieceProfile from "../Profiles/ArtPieceProfile";

const ArtPieceProfileTab: React.FC<{
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
    openArtistProfileWrapper: (fromTabIdentifier: string, creatorid: string, openInNewTab: boolean) => void;
    canLike: boolean;
    openArtPieceProfileWrapper: (fromTabIdentifier: string, recordID: number, openInNewTab: boolean) => void;
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
    openArtistProfileWrapper,
    canLike,
    openArtPieceProfileWrapper
}) => {

    const is_selected = selectedTabIdentifier === tab.identifier;
    const is_loading = loading && is_selected;

    return (
        <div 
            key={tab.identifier} 
            className={`tab ${is_selected ? 'selected' : ''}`}
        >

            <TabHandler
                tab={tab}
                switchOpenInNewTab={switchOpenInNewTab}
                getOpenInNewTabStatut={getOpenInNewTabStatut}
                selectTab={selectTab}
                removeTab={removeTab}
            />

            { is_loading &&
                <div className="tab-content-loading">
                    <div className="lds-ripple"><div></div><div></div></div> {/* https://loading.io/css/ */}
                </div>
            }

            <div className={`tab-content ${is_loading ? 'loading' : ''}`}>
                <ArtPieceProfile 
                    recordID={tab.content.recordID}
                    tab={tab}
                    openArtPieceProfile={(recordID: number) => openArtPieceProfileWrapper(
                        tab.identifier,
                        recordID, 
                        getOpenInNewTabStatut(tab.identifier)
                    )}
                    openArtistProfile={(creatorid: string) => {
                        openArtistProfileWrapper(
                            tab.identifier,
                            creatorid,
                            getOpenInNewTabStatut(tab.identifier)
                        );
                    }}

                    dislikeRecord={dislikeRecord}
                    likeRecord={likeRecord}
                    getLikeStatus={(recordID) => getLikeStatus(recordID)}

                    canLike={canLike}
                />
            </div>

        </div>
    );
};

export default ArtPieceProfileTab;