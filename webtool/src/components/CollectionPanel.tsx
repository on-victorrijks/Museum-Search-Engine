 import React, {
    useEffect,
    useState,
} from 'react';
import "../styles/ArtistProfile.css";

import { useCookies } from 'react-cookie';

import axios from 'axios';
import ApiResponse from '../types/ApiResponse';
import { Query } from '../types/queries';

import "../styles/CollectionPanel.css";
import { FaChevronLeft, FaChevronRight, FaPlus } from 'react-icons/fa';
import CollectionData from '../types/Collections';
import { FaC } from 'react-icons/fa6';

const CollectionItem : React.FC<{
    data: CollectionData,
    removeCollection: (identifier: string) => void,
}> = ({
    data,
    removeCollection
}) => {
    return (
        <div className="collection-item">
            <h2>{data.name}</h2>
            <p>{data.description}</p>
            <p>{data.recordIDs.length} enregistrements</p>
            <div className="collection-buttons">
                <button
                    onClick={() => {}}
                >
                    Modifier
                </button>
                <button
                    onClick={() => {}}
                    disabled={data.recordIDs.length === 0}
                >
                    Slideshow
                </button>
                <button 
                    onClick={() => removeCollection(data.identifier)}
                >
                    Supprimer
                </button>
            </div>
        </div>
    );
};

const CollectionPanel: React.FC<{
    isOpened: boolean,
    togglePanel: () => void,
    openCollectionCreationModal: () => void,
}> = ({
    isOpened,
    togglePanel,
    openCollectionCreationModal
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
                        ? <FaChevronLeft />
                        : <FaChevronRight />
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
                            <CollectionItem key={index} data={collection} removeCollection={removeCollection} />
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