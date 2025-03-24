import React from 'react';
import CollectionData from '../types/Collections';

import "../styles/CollectionItem.css";
import { FaCheck, FaPlay } from 'react-icons/fa';

const CollectionItem: React.FC<{
    data: CollectionData,
    removeCollection: (identifier: string) => void,
    openCollectionInTab?: (collectionData: CollectionData) => void,
    setCollectionDataForSlideShow?: (collectionData: CollectionData) => void,
    selectedCollection?: CollectionData|undefined,
    setSelectedCollection?: (collectionData: CollectionData) => void,
    showButtons?: boolean,
    onClick?: (identifier: string) => void,
    maxImages?: number,
    candidateRecordID?: number,
    cursor?: string
}> = ({
    data,
    removeCollection,
    openCollectionInTab = (collectionData: CollectionData) => {},
    setCollectionDataForSlideShow = (collectionData: CollectionData) => {},
    selectedCollection = undefined,
    setSelectedCollection = (collectionData: CollectionData) => {},
    showButtons = true,
    onClick = () => {},
    maxImages = 5,
    candidateRecordID = -1,
    cursor = "default"
}) => {

    const alreadyInCollection = data.recordIDs.includes(candidateRecordID);
    const isSelected = selectedCollection !== undefined && selectedCollection.identifier === data.identifier;

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
                <p>{data.description}</p>
                <p>{data.recordIDs.length} enregistrements</p>
            </div>
            { showButtons &&
            <div className="collection-item-buttons">
                <button
                    onClick={() => setSelectedCollection(data)}
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
