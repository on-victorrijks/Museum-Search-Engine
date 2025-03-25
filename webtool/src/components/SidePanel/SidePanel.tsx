import React, { useState } from 'react';
import '../../styles/SidePanel.css';
import ResizableDiv from '../ResizableDiv';
import CollectionPanel from '../Collection/CollectionPanel';
import SearchComponent from '../SearchComponent';
import { FaExclamationTriangle, FaFolder, FaSearch } from 'react-icons/fa';
import { QueryPart } from '../../types/queries';
import { Query } from '../../types/queries';
import CollectionData from '../../types/Collections';
import { useNotification } from '../../contexts/NotificationContext';

enum SidePanelMode {
    SEARCH = "SEARCH",
    COLLECTION = "COLLECTION",
    ERROR_LOGS = "ERROR_LOGS"
}

const SidePanelHeader: React.FC<{
    title: string,
}> = ({title}) => {
    return (
        <div className="side-pannel-header">
            <h1>{title}</h1>
        </div>
    );
}

const SidePanel: React.FC<{
    loading: boolean,
    receiveQuery: (query: Query) => void,
    selectedTabIdentifier: string,
    queryParts: QueryPart[],
    setQueryParts: (queryParts: QueryPart[]) => void,
    updateQueryPartWeight: (identifier: string, weight: number) => void,
    resetQuery: () => void, 
    openCollectionInTab: (collection: CollectionData) => void,
    setModalCreateCollectionIsOpen: (isOpened: boolean) => void,
    selectedCollection: CollectionData|undefined,
    setSelectedCollection: (selectedCollection: CollectionData|undefined) => void,
    setCollectionDataForSlideShowWrapper: (collectionData: CollectionData) => void,
}> = ({
    loading,
    receiveQuery,
    selectedTabIdentifier,
    queryParts,
    setQueryParts,
    updateQueryPartWeight,
    resetQuery,
    openCollectionInTab,
    setModalCreateCollectionIsOpen,
    selectedCollection,
    setSelectedCollection,
    setCollectionDataForSlideShowWrapper,
}) => {

    const { getErrorLogs } = useNotification();

    const [mode, setMode] = useState<SidePanelMode>(SidePanelMode.SEARCH);

    return (
        <ResizableDiv minWidth={300} maxWidth={800} initialWidth={500}>
            <div className="side-panel">
            
                <div className="side-pannel-selector">
                    <div className="side-pannel-selector-icon">
                        <img src="./src/assets/logo_crown.png" alt="Logo" />
                    </div>
                    <div className="icons-selector-content">
                        <div 
                            is-selected={(mode === SidePanelMode.SEARCH).toString()}
                            className="icons-selector-item"
                            onClick={() => setMode(SidePanelMode.SEARCH)}
                        >
                            <FaSearch />
                        </div>
                        <div 
                            is-selected={(mode === SidePanelMode.COLLECTION).toString()}
                            className="icons-selector-item"
                            onClick={() => setMode(SidePanelMode.COLLECTION)}
                        >
                            <FaFolder />
                        </div>
                        <div 
                            is-selected={(mode === SidePanelMode.ERROR_LOGS).toString()}
                            className="icons-selector-item"
                            onClick={() => setMode(SidePanelMode.ERROR_LOGS)}
                        >
                            <FaExclamationTriangle />
                        </div>
                    </div>
                    <div className="side-pannel-selector-icon-bar"></div>
                </div>
                
                <div className="side-panel-content">
                    {mode === SidePanelMode.SEARCH &&
                    <>
                        <SidePanelHeader title="Recherche" />
                        <SearchComponent 
                            loading={loading}
                            receiveQuery={receiveQuery}
                            selectedTabIdentifier={selectedTabIdentifier}
                            queryParts={queryParts}
                            setQueryParts={setQueryParts}
                            updateQueryPartWeight={updateQueryPartWeight}
                            resetQuery={resetQuery}
                        />
                    </>
                    }
                    {mode === SidePanelMode.COLLECTION &&
                    <>
                        <SidePanelHeader title="Collections" />
                        <CollectionPanel 
                            openCollectionInTab={openCollectionInTab}
                            openCollectionCreationModal={() => setModalCreateCollectionIsOpen(true)}
                            selectedCollection={selectedCollection}
                            setSelectedCollection={setSelectedCollection}
                            setCollectionDataForSlideShow={setCollectionDataForSlideShowWrapper}
                        />
                    </>
                    } 
                    {mode === SidePanelMode.ERROR_LOGS &&
                    <>
                        <SidePanelHeader title="Erreurs" />
                        <div className="side-panel-content-error-logs">
                            {getErrorLogs().length === 0 &&
                            <div className="side-panel-content-error-logs-empty">
                                <h3>Aucune erreur</h3>
                            </div>
                            }
                            {getErrorLogs().map((errorLog: string, index: number) => (
                                <div key={index} className="side-panel-content-error-log">
                                    <h3>{errorLog}</h3>
                                </div>
                            ))}
                        </div>
                    </>
                    }
                </div>
            </div>
        </ResizableDiv>
    );
};

export default SidePanel; 