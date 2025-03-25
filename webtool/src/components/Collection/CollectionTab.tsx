import React, {
    useState,
    useEffect
} from 'react';

import "../../styles/CollectionTab.css";
import ArtPiecesGallery from '../Artwork/ArtPiecesGallery';
import CollectionData from '../../types/Collections';
import { BsStars } from 'react-icons/bs';
import { useCookies } from 'react-cookie';
import { FaPlay, FaTrash } from 'react-icons/fa';

const CollectionHeader: React.FC<{
    collectionData: CollectionData,
    removeCollection: (collectionData: CollectionData) => void,
    setCollectionDataForAugment: (collectionData: CollectionData) => void,
    setCollectionDataForSlideShow: (collectionData: CollectionData) => void
}> = ({ 
    collectionData,
    removeCollection,
    setCollectionDataForAugment,
    setCollectionDataForSlideShow,
 }) => {
    return (
        <div className="collectionTab-header">
            <div className="collectionTab-header-text">
                <h1>{collectionData.name}</h1>
                <p>
                    {collectionData.description ? collectionData.description : <i>Pas de description</i>}
                </p>
                <h3>
                    {collectionData.recordIDs.length} oeuvres
                </h3>
            </div>
            <div className="collectionTab-header-buttons">
                <button 
                    onClick={() => removeCollection(collectionData)}
                >
                    Supprimer
                    <div className="collectionTab-header-buttons-icon">
                        <FaTrash />
                    </div>
                </button>
                <button 
                    onClick={() => setCollectionDataForAugment(collectionData)}
                    disabled={collectionData.recordIDs.length === 0}
                >
                    Augmenter avec l'IA
                    <div className="collectionTab-header-buttons-icon">
                        <BsStars />
                    </div>
                </button>
                <button
                    onClick={() => setCollectionDataForSlideShow(collectionData)}
                    disabled={collectionData.recordIDs.length === 0}
                >
                    Slideshow
                    <div className="collectionTab-header-buttons-icon">
                        <FaPlay />
                    </div>
                </button>
            </div>
        </div>
    );
}

const CollectionTab: React.FC<{
    collectionIdentifier: string,
    setCollectionDataForAugment: (collectionData: CollectionData) => void,
    setCollectionDataForSlideShow: (collectionData: CollectionData) => void
}> = ({
    collectionIdentifier,
    setCollectionDataForAugment,
    setCollectionDataForSlideShow
}) => {

    const [collections, setCollections, removeCollections] = useCookies(['fab-seg-collections']);
    const [loading, setLoading] = useState<boolean>(true);
    const [collectionData, setCollectionData] = useState<CollectionData|undefined>(undefined);

    useEffect(() => {
        setLoading(true);
        if (collections['fab-seg-collections']) {
            const collectionsData: CollectionData[] = collections['fab-seg-collections'] as CollectionData[];
            const collection = collectionsData.find((collection) => collection.identifier === collectionIdentifier);
            if (collection) {
                setCollectionData(collection);
            } else {
                // TODO: Handle error
            }
        }
        setLoading(false);
    }, [collections]);

    const deleteFromCollection = (recordID: number) => {
        if(collectionData === undefined) {
            return;
        }

        setCollections('fab-seg-collections', (collections['fab-seg-collections'] as CollectionData[]).map((collection: CollectionData) => {
            if (collection.identifier === collectionData.identifier) {
                return {
                    ...collection,
                    recordIDs: collection.recordIDs.filter((id) => id !== recordID),
                };
            } else {
                return collection;
            }
        }));
    }

    return (
        <div className="collection-tab">
            { loading
            ?
            <div className="collection-tab-center">
                <h2>Chargement de la collection...</h2>
            </div>
            :
            <>
                { collectionData===undefined
                ?
                <div className="collection-tab-center">
                    <h2>Erreur: collection introuvable</h2>
                </div>
                :
                <>
                    <CollectionHeader 
                        collectionData={collectionData} 
                        removeCollection={(collectionData: CollectionData) => {}}
                        setCollectionDataForAugment={setCollectionDataForAugment}
                        setCollectionDataForSlideShow={setCollectionDataForSlideShow}
                    />
                    <ArtPiecesGallery 
                        recordIDs={collectionData.recordIDs} 
                        deleteFromCollection={deleteFromCollection}
                    />
                    { collectionData.recordIDs.length > 0
                    ?
                    <div className="collection-tab-augment">
                        <h2>Augmenter cette collection avec l'IA</h2>
                        <p>
                            Augmentez la taille de cette collection en ajoutant des images similaires à celles déjà présentes dans la collection.
                        </p>
                        <button
                            onClick={() => setCollectionDataForAugment(collectionData)}
                        >
                            Augmenter avec l'IA
                            <div className='collection-tab-augment-icon'>
                                <BsStars />
                            </div>
                        </button>
                    </div>
                    :
                    <div className="collection-tab-center">
                        <h2>Collection vide</h2>
                    </div>
                    }
                </>
                }
            </>
            }
        </div>
    );
}
export default CollectionTab;