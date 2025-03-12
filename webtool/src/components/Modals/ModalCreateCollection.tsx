import React, {
    useEffect,
    useState,
} from 'react';

import "../../styles/Modals/ModalCreateCollection.css";
import { FaTimes } from 'react-icons/fa';
import CollectionData from '../../types/Collections';

import { useCookies } from 'react-cookie';

// Import uuid
import { v4 as uuidv4 } from 'uuid';

const ModalCreateCollection: React.FC<{
    askToClose: () => void;
}> = ({
    askToClose
}) => {

    const [collections, setCollections, removeCollections] = useCookies(['fab-seg-collections']);
    const [collection, setCollection] = useState<CollectionData>({
        identifier: "",
        name: "",
        description: "",
        creationDate: {
            year: 0,
            month: 0,
            day: 0,
            hour: 0,
            minute: 0,
            second: 0,
        },
        recordIDs: [],
    });

    const askToCreateCollection = () => {
        const currentDate = new Date();
        const newCollection: CollectionData = {
            ...collection,
            identifier: uuidv4(),
            creationDate: {
                year: currentDate.getFullYear(),
                month: currentDate.getMonth(),
                day: currentDate.getDate(),
                hour: currentDate.getHours(),
                minute: currentDate.getMinutes(),
                second: currentDate.getSeconds(),
            },
        };
        // Add the new collection to the list of collections
        let newCollections: CollectionData[] = [];
        if (collections['fab-seg-collections']) {
            newCollections = collections['fab-seg-collections'] as CollectionData[];
        }
        newCollections.push(newCollection);
        setCollections('fab-seg-collections', newCollections);
        askToClose();
    }

    const isCollectionDataValid = () => {
        return collection.name.length > 0;
    }
    
    return (
        <div className="modal">
            
            <div className="modal-header">
                <h1>Créer une collection</h1>
                <button className="modal-close-button" onClick={askToClose}>
                    <FaTimes />
                </button>
            </div>

            <div className="modal-content">

                <div className="modal-input">
                    <label>Nom de la collection</label>
                    <input 
                        placeholder='Nom de la collection'
                        type="text" 
                        value={collection.name}
                        onChange={(e) => setCollection({
                            ...collection,
                            name: e.target.value,
                        })}
                    />
                </div>

                <div className="modal-input">
                    <label>Description</label>
                    <textarea 
                        placeholder='Description de la collection'
                        value={collection.description}
                        onChange={(e) => setCollection({
                            ...collection,
                            description: e.target.value,
                        })}
                    />
                </div>

                <div className="modal-buttons">
                    <button 
                        onClick={askToCreateCollection} 
                        disabled={!isCollectionDataValid()}
                    >
                        Créer la collection
                    </button>
                </div>

            </div>

        </div>
    );
};

export default ModalCreateCollection;