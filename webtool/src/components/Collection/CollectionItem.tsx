import React from 'react';
import CollectionData from '../../types/Collections';
import { useCollection } from '../../contexts/CollectionContext';
import "../../styles/CollectionItem.css";
import { FaCheck, FaPlay } from 'react-icons/fa';

const CollectionItem: React.FC<{
    data: CollectionData,
    openCollectionInTab?: (collectionData: CollectionData) => void,
    setCollectionDataForSlideShow?: (collectionData: CollectionData) => void,
    showButtons?: boolean,
    onClick?: (identifier: string) => void,
    maxImages?: number,
    candidateRecordID?: number,
    cursor?: string
}> = ({
    data,
    openCollectionInTab = () => {},
    setCollectionDataForSlideShow = () => {},
    showButtons = true,
    onClick = () => {},
    maxImages = 5,
    candidateRecordID = -1,
    cursor = "default"
}) => {

    const alreadyInCollection = data.recordIDs.includes(candidateRecordID);
    const { getSelectedCollection, setSelectedCollectionIdentifier, removeCollection } = useCollection();
    const isSelected = getSelectedCollection()?.identifier === data.identifier;

    return (
        <div 
            className="collection-item"
            is-selected={isSelected.toString()}
            already-in-collection={alreadyInCollection.toString()}
            onClick={() => onClick(data.identifier)}
            style={{
                cursor: cursor
            }}
        >
            { alreadyInCollection &&
                <div className="collection-info">
                    <h2>Cette image se trouve déja dans cette collection</h2>
                </div>
            }
            { data.recordIDs.length > 0 && 
            <div className="collection-item-image">
                {
                    data.recordIDs.slice(0, maxImages).map((recordID) => (
                        <img 
                            key={recordID}
                            src={"http://127.0.0.1:5000/api/artwork/" + recordID + "/image"}
                            alt=""
                        />
                    ))
                }
            </div>
            }
            <div className="collection-item-text">
                <h2>{data.name}</h2>
                <h4>{new Date(data.timestamp).toLocaleDateString()}</h4>
                <p>{data.description}</p>
                <p>{data.recordIDs.length} enregistrements</p>
            </div>
            { showButtons &&
            <div className="collection-item-buttons">
                <button
                    onClick={() => setSelectedCollectionIdentifier(data.identifier)}
                    is-selected={isSelected.toString()}
                >
                    {
                        isSelected
                        ? "Selectionnée"
                        : "Selectionner"
                    }
                    { isSelected &&
                    <div className="collection-item-button-icon">
                        <FaCheck />
                    </div>
                    }
                </button>
                <button
                    onClick={() => openCollectionInTab(data)}
                >
                    Ouvrir
                </button>
                <button 
                    onClick={() => removeCollection(data.identifier)}
                >
                    Supprimer
                </button>
                <button
                    onClick={() => setCollectionDataForSlideShow(data)}
                    disabled={data.recordIDs.length === 0}
                >
                    <div className="collection-item-button-icon">
                        <FaPlay />
                    </div>
                </button>
            </div>
            }
        </div>
    );
};

export default CollectionItem;
