    import React, { useEffect, useState } from 'react';
    import '../../styles/SidePanel.css';
    import ResizableDiv from '../ResizableDiv';
    import CollectionPanel from '../Collection/CollectionPanel';
    import SearchComponent from './Search/SearchComponent';
    import { FaExclamationTriangle, FaFolder, FaSearch, FaCog } from 'react-icons/fa';
    import { QueryPart } from '../../types/queries';
    import { Query } from '../../types/queries';
    import CollectionData from '../../types/Collections';
    import { useNotification } from '../../contexts/NotificationContext';
    import { ErrorLog } from '../../types/Error';
    import { NotificationType } from '../../types/Notification';
    import { useModal } from '../../contexts/ModalContext';
import SettingsComponent from './Settings/SettingsComponent';

    enum SidePanelMode {
        SEARCH = "SEARCH",
        COLLECTION = "COLLECTION",
        ERROR_LOGS = "ERROR_LOGS",
        SETTINGS = "SETTINGS"
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

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleString();
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
    }> = ({
        loading,
        receiveQuery,
        selectedTabIdentifier,
        queryParts,
        setQueryParts,
        updateQueryPartWeight,
        resetQuery,
        openCollectionInTab,
    }) => {

        const { getErrorLogs, showNotification } = useNotification();

        const [mode, setMode] = useState<SidePanelMode>(SidePanelMode.SEARCH);

        const generateErrorLogsForTesting = () => {
            const i = 0;
            showNotification({
                type: NotificationType.ERROR,
                title: "Test error : " + i,
                text: "Test explanation " + i,
                buttons: [],
                errorContext: {
                    timestamp: Date.now(),
                    message: "Test error " + i,
                    origin: "generateErrorLogsForTesting():" + i
                }
            });
        }

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
                        <div 
                            className="icons-selector-item"
                            onClick={() => setMode(SidePanelMode.SETTINGS)}
                        >
                            <FaCog />
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
                            <CollectionPanel openCollectionInTab={openCollectionInTab}/>
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
                                {getErrorLogs().map((errorLog: ErrorLog, index: number) => (
                                    <div key={index} className="side-panel-content-error-log">
                                        <h4>{formatDate(errorLog.timestamp)}</h4>
                                        <p>{errorLog.message}</p>
                                        <div className="side-panel-content-error-log-origin">
                                            <p>{errorLog.origin}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                        }
                        {mode === SidePanelMode.SETTINGS &&
                        <>
                            <SidePanelHeader title="Paramètres" />
                            <SettingsComponent />
                        </>
                        }
                    </div>
                </div>
            </ResizableDiv>
        );
    };

    export default SidePanel; 