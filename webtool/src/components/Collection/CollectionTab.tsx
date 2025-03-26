import React from 'react';

import "../../styles/CollectionTab.css";
import ArtPiecesGallery from '../Artwork/ArtPiecesGallery';
import CollectionData from '../../types/Collections';
import { BsStars } from 'react-icons/bs';
import { FaArrowRight, FaPlay, FaSort, FaTrash } from 'react-icons/fa';
import { useCollection } from '../../contexts/CollectionContext';
import { data__PathFromTwoTerms, useModal } from '../../contexts/ModalContext';
const CollectionHeader: React.FC<{
    collectionData: CollectionData,
    removeCollection: (collectionIdentifier: string) => void,
    setCollectionDataForAugment: (collectionData: CollectionData) => void,
    setCollectionDataForSlideShow: (collectionData: CollectionData) => void,
    sortCollectionBySimilarity: (collectionIdentifier: string) => void,
    loadingSortCollectionBySimilarity: Record<string, boolean>,
    openPathFromTwoTerms: (data: data__PathFromTwoTerms) => void
}> = ({ 
    collectionData,
    removeCollection,
    setCollectionDataForAugment,
    setCollectionDataForSlideShow,
    sortCollectionBySimilarity,
    loadingSortCollectionBySimilarity,
    openPathFromTwoTerms
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
                    onClick={() => removeCollection(collectionData.identifier)}
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
                <button
                    onClick={() => sortCollectionBySimilarity(collectionData.identifier)}
                    disabled={loadingSortCollectionBySimilarity[collectionData.identifier]}
                >
                    Trier par similarité
                    <div className="collectionTab-header-buttons-icon">
                        <FaSort />
                    </div>
                </button>
                <button
                    onClick={() => openPathFromTwoTerms({ collectionIdentifier: collectionData.identifier })}
                >
                    Chemin entre termes
                    <div className="collectionTab-header-buttons-icon">
                        <FaArrowRight />
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

    const { openPathFromTwoTerms } = useModal();
    const { collections, loading, sortCollectionBySimilarity, loadingSortCollectionBySimilarity, removeArtworkFromCollection, removeCollection } = useCollection();
    const collectionData = collections.find((collection) => collection.identifier === collectionIdentifier);
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
                        removeCollection={removeCollection}
                        setCollectionDataForAugment={setCollectionDataForAugment}
                        setCollectionDataForSlideShow={setCollectionDataForSlideShow}
                        sortCollectionBySimilarity={sortCollectionBySimilarity}
                        loadingSortCollectionBySimilarity={loadingSortCollectionBySimilarity}
                        openPathFromTwoTerms={openPathFromTwoTerms}
                    />
                    <ArtPiecesGallery 
                        recordIDs={collectionData.recordIDs} 
                        deleteFromCollection={(recordID: number) => removeArtworkFromCollection(collectionData.identifier, recordID)}
                        masonry={false}
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