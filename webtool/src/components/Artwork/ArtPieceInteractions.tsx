import React from 'react';

import "../../styles/ArtPieceInteractions.css";
import { FaBookmark, FaThumbsDown, FaThumbsUp } from 'react-icons/fa';
import { useCollection } from '../../contexts/CollectionContext';


const ArtPieceInteractions: React.FC<{
    canLike: boolean,
    isLiked: boolean|undefined,
    likeRecord: () => void,
    dislikeRecord: () => void,
    recordID: number,
    absolutePosition?: boolean,
    small?: boolean
}> = ({
    canLike,
    isLiked,
    likeRecord,
    dislikeRecord,
    recordID,
    absolutePosition=false,
    small=false
}) => {

    const { getSelectedCollection, addArtworkToSelectedCollection, removeArtworkFromSelectedCollection } = useCollection();
    const isAddedToACollection = getSelectedCollection()?.recordIDs.includes(recordID) ?? false;

    return (
    <div className={`art-piece-interactions ${absolutePosition && 'absolute'} ${small ? 'small' : 'large'}`}>
        { getSelectedCollection() !== undefined &&
        <button
            className={`square ${isAddedToACollection && 'enabled'}`}
            is-selected={isAddedToACollection.toString()}
            onClick={
                isAddedToACollection
                ? () => removeArtworkFromSelectedCollection(recordID)
                : () => addArtworkToSelectedCollection(recordID)
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