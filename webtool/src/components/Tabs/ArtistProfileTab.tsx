import { TabData } from "../../types/tab";
import TabHandler from "./TabHandler";
import ArtistProfile from "../Profiles/ArtistProfile";

const ArtistProfileTab: React.FC<{
    selectedTabIdentifier: string;
    loading: boolean;
    tab: TabData;
    selectTab: (tabIdentifier: string) => void;
    removeTab: (tabIdentifier: string) => void;
    switchOpenInNewTab: (tabIdentifier: string) => void;
    getOpenInNewTabStatut: (tabIdentifier: string) => boolean;
    openArtPieceProfileWrapper: (fromTabIdentifier: string, recordID: number, openInNewTab: boolean) => void;
}> = ({
    selectedTabIdentifier,
    loading,
    tab,
    selectTab,
    removeTab,
    switchOpenInNewTab,
    getOpenInNewTabStatut,
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
                <ArtistProfile
                    creatorid={tab.content.creatorid}
                    tab={tab}
                    openArtPieceProfile={(recordID: number) => openArtPieceProfileWrapper(
                        tab.identifier,
                        recordID,
                        getOpenInNewTabStatut(tab.identifier)
                    )}
                />
            </div>

        </div>
    );
};

export default ArtistProfileTab;