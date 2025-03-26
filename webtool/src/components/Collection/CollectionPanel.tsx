import React from 'react';
import { FaPlus } from 'react-icons/fa';
import "../../styles/CollectionPanel.css";
import CollectionData from '../../types/Collections';
import CollectionItem from './CollectionItem';
import { useCollection } from '../../contexts/CollectionContext';

const CollectionPanel: React.FC<{
    openCollectionInTab: (collectionData: CollectionData) => void,
    openCollectionCreationModal: () => void,
    setCollectionDataForSlideShow: (collectionData: CollectionData) => void,
}> = ({
    openCollectionInTab,
    openCollectionCreationModal,
    setCollectionDataForSlideShow,
}) => {
    
    const { collections, loading } = useCollection();

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
                        {collections.map((collection, index) => (
                            <CollectionItem 
                                key={index} 
                                data={collection} 
                                openCollectionInTab={openCollectionInTab}
                                setCollectionDataForSlideShow={setCollectionDataForSlideShow}
                            />
                        ))}
                    </>
                }
            </div>
        </div>
    );
};

export default CollectionPanel;