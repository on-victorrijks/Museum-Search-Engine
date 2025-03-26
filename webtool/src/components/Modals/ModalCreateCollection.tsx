import React, { useState } from 'react';
import "../../styles/Modals/ModalCreateCollection.css";
import { FaTimes } from 'react-icons/fa';
import CollectionData from '../../types/Collections';
import { v4 as uuidv4 } from 'uuid';
import { useCollection } from '../../contexts/CollectionContext';

const ModalCreateCollection: React.FC<{
    askToClose: () => void;
}> = ({
    askToClose
}) => {
    const { addCollection } = useCollection();
    const [collection, setCollection] = useState<CollectionData>({
        identifier: "",
        name: "",
        description: "",
        timestamp: 0,
        recordIDs: [],
        editCount: 0,
    });

    const askToCreateCollection = () => {
        const currentDate = new Date();
        const newCollection: CollectionData = {
            ...collection,
            identifier: uuidv4(),
            timestamp: currentDate.getTime(),
        };
        addCollection(newCollection);
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