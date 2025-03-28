import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Query, QueryPart, SoftQueryPart, HardQueryPart } from '../types/queries';
import { TabRegistry } from '../types/tab';

export interface TabContext {
    // Tabs
    tabs: TabRegistry[];
    selectedTabIdentifier: string;
    setSelectedTabIdentifier: (tabIdentifier: string) => void;
    getSelectedTab: () => TabRegistry | undefined;
    addTab: (tab: TabRegistry) => void;
    removeTab: (tabIdentifier: string) => void;
    getTab: (tabIdentifier: string) => TabRegistry | undefined;
    getTabs: () => TabRegistry[];

    // Soft queries
    softQueries: SoftQueryPart[];
    addSoftQuery: (soft_query: SoftQueryPart) => void;
    removeSoftQuery: (soft_query: SoftQueryPart) => void;
    getSoftQueries: () => SoftQueryPart[];
    updateSoftQuery: (soft_query: SoftQueryPart) => void;

    // Hard queries
    hardQueries: HardQueryPart[];
    addHardQuery: (hard_query: HardQueryPart) => void;
    removeHardQuery: (hard_query: HardQueryPart) => void;
    getHardQueries: () => HardQueryPart[];
    updateHardQuery: (hard_query: HardQueryPart) => void;

}

const TabContext = createContext<TabContext | undefined>(undefined);

export const TabProvider: React.FC<{ children: ReactNode }> = ({ children }) => {

    // Tabs
    const [tabs, setTabs] = useState<TabRegistry[]>([]);
    const [selectedTabIdentifier, setSelectedTabIdentifier] = useState<string>("");

    // Soft queries
    const [softQueries, setSoftQueries] = useState<SoftQueryPart[]>([]);

    // Hard queries
    const [hardQueries, setHardQueries] = useState<HardQueryPart[]>([]);

    // Functions
    const getSelectedTab = () => {
        return tabs.find(tab => tab.identifier === selectedTabIdentifier);
    };
    const addTab = (tab: TabRegistry) => {
        setTabs([...tabs, tab]);
    };
    const removeTab = (tabIdentifier: string) => {
        setTabs(tabs.filter(tab => tab.identifier !== tabIdentifier));
    };
    const getTab = (tabIdentifier: string) => {
        return tabs.find(tab => tab.identifier === tabIdentifier);
    };
    const getTabs = () => {
        return tabs;
    };


    const addSoftQuery = (soft_query: SoftQueryPart) => {
        setSoftQueries([...softQueries, soft_query]);
    };
    const removeSoftQuery = (soft_query: SoftQueryPart) => {
        setSoftQueries(softQueries.filter(query => query !== soft_query));
    };
    const getSoftQueries = () => {
        return softQueries;
    };
    const updateSoftQuery = (soft_query: SoftQueryPart) => {
        setSoftQueries(softQueries.map(query => query === soft_query ? soft_query : query));
    };


    const addHardQuery = (hard_query: HardQueryPart) => {
        setHardQueries([...hardQueries, hard_query]);
    };
    const removeHardQuery = (hard_query: HardQueryPart) => {
        setHardQueries(hardQueries.filter(query => query !== hard_query));
    };
    const getHardQueries = () => {
        return hardQueries;
    };
    const updateHardQuery = (hard_query: HardQueryPart) => {
        setHardQueries(hardQueries.map(query => query === hard_query ? hard_query : query));
    };
    
    return (
        <TabContext.Provider value={{
            // Tabs
            tabs,
            selectedTabIdentifier,
            setSelectedTabIdentifier,
            getSelectedTab,
            addTab,
            removeTab,
            getTab,
            getTabs,

            // Soft queries
            softQueries,
            addSoftQuery,
            removeSoftQuery,
            getSoftQueries, 
            updateSoftQuery,
            
            // Hard queries
            hardQueries,
            addHardQuery,
            removeHardQuery,
            getHardQueries,
            updateHardQuery,
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