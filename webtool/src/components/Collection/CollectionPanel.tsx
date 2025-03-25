 import React, {
    useEffect,
    useState,
} from 'react';

import { useCookies } from 'react-cookie';

import "../../styles/CollectionPanel.css";
import { FaChevronLeft, FaChevronRight, FaPlus } from 'react-icons/fa';
import CollectionData from '../../types/Collections';
import CollectionItem from './CollectionItem';

const CollectionPanel: React.FC<{
    isOpened: boolean,
    togglePanel: () => void,
    openCollectionInTab: (collectionData: CollectionData) => void,
    openCollectionCreationModal: () => void,
    setCollectionDataForSlideShow: (collectionData: CollectionData) => void,
    selectedCollection: CollectionData|undefined
    setSelectedCollection: (collectionData: CollectionData) => void
}> = ({
    isOpened,
    togglePanel,
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
        <div className="collection-panel" is-opened={isOpened.toString()}>

            <div className="collection-header">
                <div
                    className="collection-toggler"
                    onClick={togglePanel}
                >
                    {
                        isOpened
                        ? <FaChevronRight />
                        : <FaChevronLeft />
                    }
                </div>
                <h1>Vos collections</h1>
            </div>

            <div className="collection-content">
                { loading 
                ?
                    <p>Chargement...</p>
                :
                    <>
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
                        <div 
                            className="collection-create"
                            onClick={openCollectionCreationModal}
                        >
                            <h1><FaPlus /></h1>
                            <h2>Créer une nouvelle collection</h2>
                        </div>
                    </>
                }
            </div>

        </div>
    );
};

export default CollectionPanel;