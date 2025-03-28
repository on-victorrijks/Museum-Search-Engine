import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { SoftQueryPart, TabIdentifier, TabData, TabType, CachedQueryResults, HardQueryPart, SoftQueryIdentifier, HardQueryIdentifier, TabQuery, TabCollection, TabArtist, TabArtwork, Query } from '../types/tab';
import { useNotification } from './NotificationContext';
import ArtPieceData from '../types/ArtPiece';
import ArtistData from '../types/ArtistData';
import { v4 as uuidv4 } from 'uuid';
import { NotificationType } from '../types/Notification';
import hash from 'object-hash';
import { useSettings } from './SettingsContext';
import axios from 'axios';
import { SuccessfulQueryResponse } from '../types/ApiResponses';

export interface TabContext {

    // Fetching data
    fetchQueryResults: (
        tabIdentifier: TabIdentifier,
        query: Query,
    ) => void;

    // General tab context
        // Tabs
        tabsIdentifiers: TabIdentifier[];
        getTabsIdentifiers: () => TabIdentifier[];

        selectedTabIdentifier: TabIdentifier | undefined;
        setSelectedTabIdentifier: (identifier: TabIdentifier) => void;

        addTab: (data: TabData) => void;
        removeTab: (identifier: TabIdentifier) => void;

        getTabData: (identifier: TabIdentifier) => TabData | undefined;

        getIsOpenInNewTab: (identifier: TabIdentifier) => boolean;
        setIsOpenInNewTab: (identifier: TabIdentifier, value: boolean) => void;

        // Data provider (data provider for a specific tab)
        isDataProviderLoading: (identifier: TabIdentifier) => boolean;
        isDataProviderLoaded: (identifier: TabIdentifier) => boolean;
        isDataProviderError: (identifier: TabIdentifier) => boolean;
        getDataProviderError: (identifier: TabIdentifier) => string | undefined;
        askForMoreResults: (identifier: TabIdentifier) => void;

        // Interactions (interactions with the selected tab)
        dislikeRecord: (imageInformations: ArtPieceData) => void;
        likeRecord: (imageInformations: ArtPieceData) => void;
        getLikeStatus: (recordID: number) => boolean | undefined;

        // Interact with the selected tab's hard query
        STF_toggle: (term: string) => void; 
        STF_getStatus: (term: string) => boolean|undefined; 
        
        // Open artwork profile
        openArtworkProfile: (originTabIdentifier: TabIdentifier, recordID: number) => void;

        // Open artist profile
        openArtistProfile: (originTabIdentifier: TabIdentifier, creatorid: string) => void;

        // Open collection
        openCollection: (collectionIdentifier: string) => void;

    // Specific tab context (depending on the tab type)
        // Query tab
        getResults: (tabIdentifier: TabIdentifier) => CachedQueryResults|undefined;
        getSoftQueries: () => SoftQueryPart[];
        getHardQueries: () => HardQueryPart[];
        isQueryEmpty: (tabIdentifier: TabIdentifier) => boolean;
        addNewSoftQuery: (softQuery: SoftQueryPart) => void;
        addNewHardQuery: (hardQuery: HardQueryPart) => void;
        updateSoftQuery: (identifier: SoftQueryIdentifier, newData: SoftQueryPart) => void;
        updateHardQuery: (identifier: HardQueryIdentifier, newData: HardQueryPart) => void;
        deleteSoftQuery: (identifier: SoftQueryIdentifier) => void;
        deleteHardQuery: (identifier: HardQueryIdentifier) => void;
        resetSoftQuery: (tabIdentifier: TabIdentifier) => void;
        resetHardQuery: (tabIdentifier: TabIdentifier) => void;
        resetQuery: (tabIdentifier: TabIdentifier) => void;

        // Collection tab
        getCollectionIdentifier: (tabIdentifier: TabIdentifier) => string | undefined;

        // Artist tab
        getCreatorid: (tabIdentifier: TabIdentifier) => string | undefined;

        // Artwork tab
        getRecordID: (tabIdentifier: TabIdentifier) => number | undefined;

        // Tree graph tab
        // TODO: Implement
}

const TabContext = createContext<TabContext | undefined>(undefined);

export const TabProvider: React.FC<{ children: ReactNode }> = ({ children }) => {

    const { settings } = useSettings();
    const { showNotification } = useNotification();

    // Fetching data
    const fetchQueryResults = async (
        tabIdentifier: TabIdentifier,
        query: Query,
    ) => {
        const tabData = getTabData(tabIdentifier);
        if(!tabData || tabData.type!=TabType.RESULTS) return;
        const tabDataProvider = (tabData as TabQuery).dataProvider;

        try {
            // Update the data provider
            tabDataProvider.isLoading = true;
            tabDataProvider.isLoaded = false;
            tabDataProvider.isError = false;
            tabDataProvider.error = undefined;

            const tabDataCasted = tabData as TabQuery;
            const hashedQuery = hash(tabDataCasted.query);
            // Check if the query has changed
            const isNewQuery = hashedQuery===tabDataCasted.query.hash;
            const currentPage = tabDataCasted.results.page;
            const isFirstPage = currentPage === 1;
            if (!isNewQuery && isFirstPage) {
                // The query has not changed and the user is requesting the first page, we can use the cached results
                tabDataProvider.isLoading = false;
                tabDataProvider.isLoaded = true;
                return;
            }

            // Fetch the data from the server
            // TODO: Ideally, we should remove all the unnecessary data from the query
            const body = {
                "hard_constraints": query.hardQueries,
                "soft_constraints": query.softQueries,
                "model_name": settings.model_name,  
                "page": currentPage,
                "page_size": settings.page_size,
                "version": settings.method,
                "rocchio_k": settings.rocchio_k,
                "rocchio_scale": settings.rocchio_scale
            };

            const response = await axios.post("http://127.0.0.1:5000/api/query", body, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = response.data;
            const success = data["success"];
            if (!success) throw new Error(data["error_message"]);

            const results = (data as SuccessfulQueryResponse).data;
            if (results==undefined) throw new Error("Aucun résultat trouvé");
            
            // Update the query hash
            tabDataCasted.query.hash = hashedQuery;

            // Update the page
            tabDataCasted.results.page = currentPage + 1;

            // Update the results
            tabDataCasted.results.results = results;

            // Update the data provider
            tabDataProvider.isLoading = false;
            tabDataProvider.isLoaded = true;

        } catch (error) {
            showNotification({
                type: NotificationType.ERROR,
                title: "Erreur lors de la requête au serveur",
                text: "Une erreur est survenue lors de la requête au serveur",
                buttons: [],
                timeout: 5000,
                errorContext: {
                    timestamp: Date.now(),
                    message: "Une erreur est survenue lors de la requête au serveur",
                    origin: "TabContext:queryServer:" + error
                }
            });
            // Update the data provider
            tabDataProvider.isLoading = false;
            tabDataProvider.isLoaded = false;
            tabDataProvider.isError = true;
            tabDataProvider.error = error as string;
        } finally {
            // Update the state
            setTabsData(tabsData.map(tab => tab.identifier === tabIdentifier ? tabData : tab));
        }
    };

    // General tab context
    const [tabsIdentifiers, setTabsIdentifiers] = useState<TabIdentifier[]>([]);
    const [tabsData, setTabsData] = useState<TabData[]>([]);
    const [selectedTabIdentifier, setSelectedTabIdentifier] = useState<TabIdentifier | undefined>(undefined);
    
    const getTabsIdentifiers = () => {
        return tabsIdentifiers;
    };

    const addTab = (data: TabData) => {
        const newIdentifier = uuidv4();
        setTabsIdentifiers([...tabsIdentifiers, newIdentifier]);
        setTabsData([...tabsData, { ...data, identifier: newIdentifier }]);
    };

    const selectFirstOtherSelectableTab = (unselectingTabIdentifier: TabIdentifier) => {
        const otherSelectableTabs = tabsData.filter(tab => tab.type===TabType.RESULTS && tab.identifier!==unselectingTabIdentifier);
        if (otherSelectableTabs.length > 0) {
            setSelectedTabIdentifier(otherSelectableTabs[0].identifier);
        } else {
            setSelectedTabIdentifier(undefined);
        }
    };

    const removeTab = (identifier: TabIdentifier) => {
        const wasSelected = selectedTabIdentifier === identifier;
        if (wasSelected) selectFirstOtherSelectableTab(identifier);
        setTimeout(() => {
            setTabsIdentifiers(tabsIdentifiers.filter(id => id !== identifier));
            setTabsData(tabsData.filter(tab => tab.identifier !== identifier));
        }, 100); // Wait for the state to be updated (TODO: find a better way to do this)
    };

    const getTabData = (identifier: TabIdentifier) => {
        return tabsData.find(tab => tab.identifier === identifier);
    };

    const getIsOpenInNewTab = (identifier: TabIdentifier) => {
        return tabsData.find(tab => tab.identifier === identifier)?.openLinksInNewTab ?? false;
    };
    
    const setIsOpenInNewTab = (identifier: TabIdentifier, value: boolean) => {
        setTabsData(tabsData.map(tab => tab.identifier === identifier ? { ...tab, openLinksInNewTab: value } : tab));
    };  

    const isDataProviderLoading = (identifier: TabIdentifier) => {
        const tabData = getTabData(identifier);
        if (!tabData || tabData.type !== TabType.RESULTS) return false;
        return (tabData as TabQuery).dataProvider.isLoading;
    };

    const isDataProviderLoaded = (identifier: TabIdentifier) => {
        const tabData = getTabData(identifier);
        if (!tabData || tabData.type !== TabType.RESULTS) return false;
        return (tabData as TabQuery).dataProvider.isLoaded;
    };

    const isDataProviderError = (identifier: TabIdentifier) => {
        const tabData = getTabData(identifier);
        if (!tabData || tabData.type !== TabType.RESULTS) return false;
        return (tabData as TabQuery).dataProvider.isError;
    };

    const getDataProviderError = (identifier: TabIdentifier) => {
        const tabData = getTabData(identifier);
        if (!tabData || tabData.type !== TabType.RESULTS) return undefined;
        return (tabData as TabQuery).dataProvider.error;
    };

    const askForMoreResults = (identifier: TabIdentifier) => {
        const tabData = getTabData(identifier);
        if (!tabData || tabData.type !== TabType.RESULTS) return;
        (tabData as TabQuery).dataProvider.askForMoreResults();
    };      

    const dislikeRecord = (imageInformations: ArtPieceData) => {
        // TODO: Implement
    };

    const likeRecord = (imageInformations: ArtPieceData) => {
        // TODO: Implement
    };

    const getLikeStatus = (recordID: number) => {
        // TODO: Implement
        return undefined;
    };

    const STF_toggle = (term: string) => {
        // TODO: Implement
    };

    const STF_getStatus = (term: string) => {
        // TODO: Implement
        return undefined;
    };
    
    const openArtworkProfile = (originTabIdentifier: TabIdentifier, recordID: number) => {
        const originTabData = getTabData(originTabIdentifier);
        if (!originTabData) return;

        const isOriginTabOpenInNewTab = getIsOpenInNewTab(originTabIdentifier);

        const newTabData : TabData = {
            type: TabType.ARTWORK,
            identifier: isOriginTabOpenInNewTab ? "N/A" : originTabIdentifier,
            recordID: recordID,
            openLinksInNewTab: isOriginTabOpenInNewTab,
        }

        if (isOriginTabOpenInNewTab) {
            // Create a new tab with the ArtPieceProfile
            addTab(newTabData);
        } else {
            // Modify the current tab so it displays the ArtPieceProfile
            setTabsData(tabsData.map(tab => tab.identifier === originTabIdentifier ? newTabData : tab));
        }
    };  

    const openArtistProfile = (originTabIdentifier: TabIdentifier, creatorid: string) => {
        const originTabData = getTabData(originTabIdentifier);
        if (!originTabData) return;

        const isOriginTabOpenInNewTab = getIsOpenInNewTab(originTabIdentifier);

        const newTabData : TabData = {
            type: TabType.ARTIST,
            identifier: isOriginTabOpenInNewTab ? "N/A" : originTabIdentifier,
            creatorid: creatorid,
            openLinksInNewTab: isOriginTabOpenInNewTab,
        }

        if (isOriginTabOpenInNewTab) {
            // Create a new tab with the ArtistProfile
            addTab(newTabData);
        } else {
            // Modify the current tab so it displays the ArtistProfile
            setTabsData(tabsData.map(tab => tab.identifier === originTabIdentifier ? newTabData : tab));
        }
    };

    const openCollection = (collectionIdentifier: string) => {
        const newTabData : TabData = {
            type: TabType.COLLECTION,
            identifier: "N/A",
            collectionIdentifier: collectionIdentifier,
            openLinksInNewTab: false,
        }
        addTab(newTabData);
    };

    // Query tab
    const getResults = () => {
        if (selectedTabIdentifier) {
            const isLoaded = isDataProviderLoaded(selectedTabIdentifier);
            if (isLoaded) {
                const tabData = getTabData(selectedTabIdentifier);
                if (tabData && tabData.type === TabType.RESULTS) {
                    return (tabData as TabQuery).results;
                }
            }
        }
        return undefined;
    };

    const getSoftQueries = () => {
        if (selectedTabIdentifier) {
            const tabData = getTabData(selectedTabIdentifier);
            if (tabData && tabData.type === TabType.RESULTS) {
                return (tabData as TabQuery).query.softQueries;
            }
        }
        return [];
    };

    const getHardQueries = () => {
        if (selectedTabIdentifier) {
            const tabData = getTabData(selectedTabIdentifier);
            if (tabData && tabData.type === TabType.RESULTS) {
                return (tabData as TabQuery).query.hardQueries;
            }
        }
        return [];
    };

    const isQueryEmpty = (tabIdentifier: TabIdentifier) => {
        if (tabIdentifier) {
            const tabData = getTabData(tabIdentifier);
            if (tabData && tabData.type === TabType.RESULTS) {
                const tabDataCasted = tabData as TabQuery;
                return tabDataCasted.query.softQueries.length === 0 && tabDataCasted.query.hardQueries.length === 0;
            }
        }
        return true;
    };
    
    const addNewSoftQuery = (softQuery: SoftQueryPart) => {
        if (selectedTabIdentifier) {
            const tabData = getTabData(selectedTabIdentifier);
            if (tabData && tabData.type === TabType.RESULTS) {
                const tabDataCasted = tabData as TabQuery;
                tabDataCasted.query.softQueries.push(softQuery);
                setTabsData(tabsData.map(tab => tab.identifier === selectedTabIdentifier ? tabDataCasted : tab));
            }
        }
    };

    const addNewHardQuery = (hardQuery: HardQueryPart) => {
        if (selectedTabIdentifier) {
            const tabData = getTabData(selectedTabIdentifier);
            if (tabData && tabData.type === TabType.RESULTS) {
                const tabDataCasted = tabData as TabQuery;
                tabDataCasted.query.hardQueries.push(hardQuery);
                setTabsData(tabsData.map(tab => tab.identifier === selectedTabIdentifier ? tabDataCasted : tab));
            }
        }
    };

    const updateSoftQuery = (identifier: SoftQueryIdentifier, newData: SoftQueryPart) => {
        if (selectedTabIdentifier) {
            const tabData = getTabData(selectedTabIdentifier);
            if (tabData && tabData.type === TabType.RESULTS) {
                const tabDataCasted = tabData as TabQuery;
                tabDataCasted.query.softQueries = tabDataCasted.query.softQueries.map(softQuery => softQuery.identifier === identifier ? newData : softQuery);
                setTabsData(tabsData.map(tab => tab.identifier === selectedTabIdentifier ? tabDataCasted : tab));
            }
        }
    };

    const updateHardQuery = (identifier: HardQueryIdentifier, newData: HardQueryPart) => {
        if (selectedTabIdentifier) {
            const tabData = getTabData(selectedTabIdentifier);
            if (tabData && tabData.type === TabType.RESULTS) {
                const tabDataCasted = tabData as TabQuery;
                tabDataCasted.query.hardQueries = tabDataCasted.query.hardQueries.map(hardQuery => hardQuery.identifier === identifier ? newData : hardQuery);
                setTabsData(tabsData.map(tab => tab.identifier === selectedTabIdentifier ? tabDataCasted : tab));
            }
        }
    };

    const deleteSoftQuery = (identifier: SoftQueryIdentifier) => {
        if (selectedTabIdentifier) {
            const tabData = getTabData(selectedTabIdentifier);
            if (tabData && tabData.type === TabType.RESULTS) {
                const tabDataCasted = tabData as TabQuery;
                tabDataCasted.query.softQueries = tabDataCasted.query.softQueries.filter(softQuery => softQuery.identifier !== identifier);
                setTabsData(tabsData.map(tab => tab.identifier === selectedTabIdentifier ? tabDataCasted : tab));
            }
        }
    };

    const deleteHardQuery = (identifier: HardQueryIdentifier) => {
        if (selectedTabIdentifier) {
            const tabData = getTabData(selectedTabIdentifier);
            if (tabData && tabData.type === TabType.RESULTS) {
                const tabDataCasted = tabData as TabQuery;
                tabDataCasted.query.hardQueries = tabDataCasted.query.hardQueries.filter(hardQuery => hardQuery.identifier !== identifier);
                setTabsData(tabsData.map(tab => tab.identifier === selectedTabIdentifier ? tabDataCasted : tab));
            }
        }
    };

    const resetSoftQuery = (tabIdentifier: TabIdentifier) => {
        if (tabIdentifier) {
            const tabData = getTabData(tabIdentifier);
            if (tabData && tabData.type === TabType.RESULTS) {
                const tabDataCasted = tabData as TabQuery;
                tabDataCasted.query.softQueries = [];
                setTabsData(tabsData.map(tab => tab.identifier === tabIdentifier ? tabDataCasted : tab));
            }
        }
    };

    const resetHardQuery = (tabIdentifier: TabIdentifier) => {
        if (tabIdentifier) {
            const tabData = getTabData(tabIdentifier);
            if (tabData && tabData.type === TabType.RESULTS) {
                const tabDataCasted = tabData as TabQuery;
                tabDataCasted.query.hardQueries = [];
                setTabsData(tabsData.map(tab => tab.identifier === tabIdentifier ? tabDataCasted : tab));
            }
        }
    };

    const resetQuery = (tabIdentifier: TabIdentifier) => {
        if (tabIdentifier) {
            resetSoftQuery(tabIdentifier);
            resetHardQuery(tabIdentifier);
        }
    };

    // Collection tab
    const getCollectionIdentifier = (tabIdentifier: TabIdentifier) => {
        if (tabIdentifier) {
            const tabData = getTabData(tabIdentifier);
            if (tabData && tabData.type === TabType.COLLECTION) {
                return (tabData as TabCollection).collectionIdentifier;
            }
        }
        return undefined;
    };

    // Artist tab
    const getCreatorid = (tabIdentifier: TabIdentifier) => {
        if (tabIdentifier) {
            const tabData = getTabData(tabIdentifier);
            if (tabData && tabData.type === TabType.ARTIST) {
                return (tabData as TabArtist).creatorid;
            }
        }
        return undefined;
    };

    // Artwork tab
    const getRecordID = (tabIdentifier: TabIdentifier) => {
        if (tabIdentifier) {
            const isLoaded = isDataProviderLoaded(tabIdentifier);
            if (isLoaded) {
                const tabData = getTabData(tabIdentifier);
                if (tabData && tabData.type === TabType.ARTWORK) {
                    return (tabData as TabArtwork).recordID;
                }
            }
        }
        return undefined;
    };

    // Tree graph tab
    // TODO: Implement

    return (
        <TabContext.Provider value={{
            // Fetching data
            fetchQueryResults,

            // General tab context
            tabsIdentifiers,
            getTabsIdentifiers,
            selectedTabIdentifier,
            setSelectedTabIdentifier,
            addTab,
            removeTab,
            getTabData,
            getIsOpenInNewTab,
            setIsOpenInNewTab,
            isDataProviderLoading,
            isDataProviderLoaded,
            isDataProviderError,
            getDataProviderError,
            askForMoreResults,

            // Interactions (interactions with the selected tab)
            dislikeRecord,
            likeRecord,
            getLikeStatus,  

            STF_toggle,
            STF_getStatus,

            openArtworkProfile,
            openArtistProfile,
            openCollection,

            // Specific tab context
            getResults,
            getSoftQueries,
            getHardQueries,
            isQueryEmpty,
            addNewSoftQuery,
            addNewHardQuery,
            updateSoftQuery,
            updateHardQuery,
            deleteSoftQuery,
            deleteHardQuery,
            resetSoftQuery,
            resetHardQuery,
            resetQuery,

            // Collection tab
            getCollectionIdentifier,

            // Artist tab
            getCreatorid,

            // Artwork tab
            getRecordID,

            // Tree graph tab
            // TODO: Implement
        }}>
            { children }
        </TabContext.Provider>
    );
};

export const useTab = () => {
    const context = useContext(TabContext);
    if (context === undefined) {
        throw new Error('useTab must be used within a TabProvider');
    }
    return context;
}; 