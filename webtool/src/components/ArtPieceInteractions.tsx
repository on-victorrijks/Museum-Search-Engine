import React, {
    useState,
} from 'react';

import "../styles/ArtPieceInteractions.css";
import { FaBookmark, FaThumbsDown, FaThumbsUp } from 'react-icons/fa';
import CollectionData from '../types/Collections';



const ArtPieceInteractions: React.FC<{
    selectedCollection: CollectionData|undefined,
    addToSelectedCollection: (recordID: number) => void,
    removeFromSelectedCollection: (recordID: number) => void,
    canLike: boolean,
    isLiked: boolean|undefined,
    isAddedToACollection: boolean,
    likeRecord: () => void,
    dislikeRecord: () => void,
    recordID: number,
    absolutePosition?: boolean,
    small?: boolean
}> = ({
    selectedCollection,
    addToSelectedCollection,
    removeFromSelectedCollection,
    canLike,
    isLiked,
    isAddedToACollection,
    likeRecord,
    dislikeRecord,
    recordID,
    absolutePosition=false,
    small=false
}) => {

    return (
    <div className={`art-piece-interactions ${absolutePosition && 'absolute'} ${small ? 'small' : 'large'}`}>
        { selectedCollection !== undefined &&
        <button
            className={`square ${isAddedToACollection===true && 'enabled'}`}
            is-selected={isAddedToACollection.toString()}
            onClick={
                isAddedToACollection
                ? () => removeFromSelectedCollection(recordID)
                : () => addToSelectedCollection(recordID)
            }
        >
            { !small &&
                <>
                    { isAddedToACollection
                    ? <h3>Retirer de la collection</h3>
                    : <h3>Ajouter à la collection</h3>
                    }
                </>
            }
            <FaBookmark />
        </button>
        }
        <button
            className={`square ${isLiked===true && 'enabled'}`}
            onClick={likeRecord}
            disabled={!canLike}
        >
            <FaThumbsUp />
        </button>
        <button
            className={`square ${isLiked===false && 'enabled'}`}
            onClick={dislikeRecord}
            disabled={!canLike}
        >
            <FaThumbsDown />
        </button>
    </div>
    );
}

export default ArtPieceInteractions;