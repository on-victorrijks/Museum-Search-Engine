import React, {
    useEffect,
    useState,
} from 'react';

import "../../styles/Modals/ModalSelectCollection.css";
import { FaPlus, FaTimes } from 'react-icons/fa';
import CollectionData from '../../types/Collections';

import { useCookies } from 'react-cookie';

// Import uuid
import CollectionItem from '../Collection/CollectionItem';


const ModalAddToCollection: React.FC<{
    askToClose: () => void;
    openCollectionCreationModal: () => void;
    recordID: number|undefined;
}> = ({
    askToClose,
    openCollectionCreationModal,
    recordID
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

    const addToCollection = (identifier: string) => {
        if(recordID === undefined) {
            // TODO: Handle error
            askToClose();
            return;
        }

        setCollections('fab-seg-collections', parsedCollections.map((collection: CollectionData) => {
            if (collection.identifier === identifier) {
                return {
                    ...collection,
                    recordIDs: [...collection.recordIDs, recordID],
                };
            } else {
                return collection;
            }
        }));
        askToClose();
    };

    return (
        <div className="modal">
            
            <div className="modal-header">
                <h1>Dans quelle collection voulez-vous ajouter cette oeuvre ?</h1>
                <button className="modal-close-button" onClick={askToClose}>
                    <FaTimes />
                </button>
            </div>

            <div className="modal-content">
                { loading
                ? 
                <div className="modal-loading">
                    <h3>Chargement des collections...</h3>
                </div>
                :
                <>
                    { parsedCollections.length === 0 || recordID === undefined
                    ?
                    <div 
                        className="modal-collection-create"
                        onClick={() => {
                            //askToClose();
                            openCollectionCreationModal();
                        }}
                    >
                        <h1><FaPlus /></h1>
                        <h2>Créer une nouvelle collection</h2>
                    </div>
                    :
                    <>
                        { parsedCollections
                        .filter((collectionData: CollectionData) => !collectionData.recordIDs.includes(recordID))
                        .map((collectionData: CollectionData, index: number) => 
                            <CollectionItem 
                                key={index} 
                                data={collectionData} 
                                removeCollection={() => {}}
                                onClick={(identifier: string) => addToCollection(identifier)}
                                showButtons={false}
                                maxImages={5}
                                candidateRecordID={recordID}
                                cursor='pointer'
                            />
                        ) }
                    </>
                    }
                </>
                }
            </div>

        </div>
    );
};

export default ModalAddToCollection;