import React, { createContext, useContext, useState, useEffect } from 'react';
import { useCookies } from 'react-cookie';
import CollectionData from '../types/Collections';
import { useNotification } from './NotificationContext';
import { NotificationType } from '../types/Notification';

interface CollectionContextType {
    collections: CollectionData[];
    loading: boolean;
    addCollection: (collection: CollectionData) => void;
    removeCollection: (identifier: string) => void;
    editCollection: (identifier: string, updatedCollection: CollectionData) => void;
    setSelectedCollectionIdentifier: (identifier: string) => void;
    selectedCollectionIdentifier: string|undefined;
    getSelectedCollection: () => CollectionData|undefined;
    addArtworkToSelectedCollection: (artworkID: number) => void;
    removeArtworkFromSelectedCollection: (artworkID: number) => void;
    getIsAddedToCollection: (collection: CollectionData|undefined, recordID: number) => boolean;
    batchAddArtworksToSelectedCollection: (collectionIdentifier: string, artworkIDs: number[]) => boolean;
}

const CollectionContext = createContext<CollectionContextType | undefined>(undefined);

export const CollectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [cookies, setCollections] = useCookies(['fab-seg-collections']);
    const [loading, setLoading] = useState<boolean>(true);
    const [parsedCollections, setParsedCollections] = useState<CollectionData[]>([]);
    const [selectedCollectionIdentifier, setSelectedCollectionIdentifier] = useState<string|undefined>(undefined);

    const { showNotification } = useNotification();

    const customSort = (a: CollectionData, b: CollectionData) => {
        if (a.identifier === selectedCollectionIdentifier) {
            return -1;
        }
        if (b.identifier === selectedCollectionIdentifier) {
            return 1;
        }
        return b.timestamp - a.timestamp;
    }

    const getUpdatedCollections = () => {
        const collectionsData: CollectionData[] = [...cookies['fab-seg-collections']] as CollectionData[];
        return collectionsData.sort((a, b) => customSort(a, b));
    }

    useEffect(() => {
        setLoading(true);
        if (cookies['fab-seg-collections']) {
            setParsedCollections(getUpdatedCollections());
        }
        setLoading(false);
    }, [cookies, selectedCollectionIdentifier]);

    const addCollection = (collection: CollectionData) => {
        const currentCollections = cookies['fab-seg-collections'] || [];
        const newCollections = [...currentCollections, collection];
        setCollections('fab-seg-collections', newCollections);
    };

    const removeCollection = (identifier: string) => {
        if (cookies['fab-seg-collections']) {
            const collectionsData: CollectionData[] = cookies['fab-seg-collections'] as CollectionData[];
            const newCollectionsData = collectionsData.filter((collection) => collection.identifier !== identifier);
            setCollections('fab-seg-collections', newCollectionsData);
        }
    };

    const editCollection = (identifier: string, updatedCollection: CollectionData) => {
        if (cookies['fab-seg-collections']) {
            const collectionsData: CollectionData[] = cookies['fab-seg-collections'] as CollectionData[];
            const newCollectionsData = collectionsData.map((collection) => {
                if (collection.identifier === identifier) {
                    updatedCollection.editCount = collection.editCount + 1;
                    return updatedCollection;
                }
                return collection;
            });
            setCollections('fab-seg-collections', newCollectionsData);
        }
    };

    const addArtworkToSelectedCollection = (artworkID: number) => {
        if (!selectedCollectionIdentifier) {
            showNotification({
                type: NotificationType.ERROR,
                title: "Collection non trouvée",
                text: "Veuillez sélectionner une collection",
                buttons: [],
                timeout: 5000,
                errorContext: {
                    timestamp: Date.now(),
                    message: "Aucune collection sélectionnée",
                    origin: "addArtworkToSelectedCollection"
                }
            });
            return;
        }

        const updatedCollections = getUpdatedCollections();
        const collection = updatedCollections.find((collection) => collection.identifier === selectedCollectionIdentifier);
        if (collection) {
            collection.recordIDs.push(artworkID);
            editCollection(selectedCollectionIdentifier, collection);
        } else {
            setSelectedCollectionIdentifier(undefined);
            showNotification({
                type: NotificationType.ERROR,
                title: "Collection non trouvée",
                text: "La collection spécifiée n'existe pas",
                buttons: [],
                timeout: 5000,
                errorContext: {
                    timestamp: Date.now(),
                    message: "La collection spécifiée n'existe pas",
                    origin: "addArtworkToCollection"
                }
            });
        }
    }

    const removeArtworkFromSelectedCollection = (artworkID: number) => {
        if (!selectedCollectionIdentifier) {
            showNotification({
                type: NotificationType.ERROR,
                title: "Collection non trouvée",
                text: "Veuillez sélectionner une collection",
                buttons: [],
                timeout: 5000,
                errorContext: {
                    timestamp: Date.now(),
                    message: "Aucune collection sélectionnée",
                    origin: "removeArtworkFromSelectedCollection"
                }
            });
            return;
        }

        const updatedCollections = getUpdatedCollections();
        const collection = updatedCollections.find((collection) => collection.identifier === selectedCollectionIdentifier);
        if (collection) {
            collection.recordIDs = collection.recordIDs.filter((id) => id !== artworkID);
            editCollection(selectedCollectionIdentifier, collection);
        }
    }

    const getSelectedCollection = () => {
        return parsedCollections.find((collection) => collection.identifier === selectedCollectionIdentifier);
    }

    const getIsAddedToCollection = (collection: CollectionData|undefined, recordID: number) => {
        // We don't just use selectedCollection, we ask for the consumer to provide the collection (most often it is the selectedCollection).
        // This is because the consumer will not trigger a re-render when a recordID is added or removed from a collection.
        if (!collection) {
            return false;
        }
        return collection.recordIDs.includes(recordID);
    }

    const batchAddArtworksToSelectedCollection = (collectionIdentifier: string, artworkIDs: number[]) => {
        const updatedCollections = getUpdatedCollections();
        const collection = updatedCollections.find((collection) => collection.identifier === collectionIdentifier);
        if (collection) {
            collection.recordIDs.push(...artworkIDs);
            editCollection(collectionIdentifier, collection);
        }
        return false;
    }

    return (
        <CollectionContext.Provider value={{
            collections: parsedCollections,
            loading,
            addCollection,
            removeCollection,
            editCollection,
            setSelectedCollectionIdentifier,
            selectedCollectionIdentifier,
            getSelectedCollection,
            addArtworkToSelectedCollection,
            removeArtworkFromSelectedCollection,
            getIsAddedToCollection,
            batchAddArtworksToSelectedCollection
        }}>
            {children}
        </CollectionContext.Provider>
    );
};

export const useCollection = () => {
    const context = useContext(CollectionContext);
    if (context === undefined) {
        throw new Error('useCollection must be used within a CollectionProvider');
    }
    return context;
}; 