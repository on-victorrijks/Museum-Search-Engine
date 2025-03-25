 import React, {
    useEffect,
    useState,
} from 'react';

import { useCookies } from 'react-cookie';

import "../../styles/CollectionPanel.css";
import { FaPlus } from 'react-icons/fa';
import CollectionData from '../../types/Collections';
import CollectionItem from './CollectionItem';

const CollectionPanel: React.FC<{
    openCollectionInTab: (collectionData: CollectionData) => void,
    openCollectionCreationModal: () => void,
    setCollectionDataForSlideShow: (collectionData: CollectionData) => void,
    selectedCollection: CollectionData|undefined
    setSelectedCollection: (collectionData: CollectionData) => void
}> = ({
    openCollectionInTab,
    openCollectionCreationModal,
    setCollectionDataForSlideShow,
    selectedCollection,
    setSelectedCollection
}) => {
    
    const [collections, setCollections, removeCollections] = useCookies(['fab-seg-collections']);
    const [loading, setLoading] = useState<boolean>(true);
    const [parsedCollections, setParsedCollections] = useState<CollectionData[]>([]);

    useEffect(() => {
        setLoading(true);
        if (collections['fab-seg-collections']) {
            const collectionsData: CollectionData[] = collections['fab-seg-collections'] as CollectionData[];
            setParsedCollections(collectionsData);
        }
        setLoading(false);
    }, [collections]);

    const removeCollection = (identifier: string) => {
        if (collections['fab-seg-collections']) {
            const collectionsData: CollectionData[] = collections['fab-seg-collections'] as CollectionData[];
            const newCollectionsData = collectionsData.filter((collection) => collection.identifier !== identifier);
            setCollections('fab-seg-collections', newCollectionsData);
        }
    }

    return (
        <div className="collection-panel">
            <div className="collection-content">
                { loading 
                ?
                    <p>Chargement...</p>
                :
                    <>
                        <div 
                            className="collection-create"
                            onClick={openCollectionCreationModal}
                        >
                            <h1><FaPlus /></h1>
                            <h2>Créer une nouvelle collection</h2>
                        </div>
                        {parsedCollections.map((collection, index) => (
                            <CollectionItem 
                                key={index} 
                                data={collection} 
                                openCollectionInTab={openCollectionInTab}
                                removeCollection={removeCollection} 
                                setCollectionDataForSlideShow={setCollectionDataForSlideShow}
                                selectedCollection={selectedCollection}
                                setSelectedCollection={setSelectedCollection}
                            />
                        ))}
                    </>
                }
            </div>

        </div>
    );
};

export default CollectionPanel;