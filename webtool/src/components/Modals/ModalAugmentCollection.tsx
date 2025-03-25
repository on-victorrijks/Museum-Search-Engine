import React, { useState, useEffect } from 'react';

import "../../styles/Modals/ModalAugmentCollection.css";
import { FaTimes } from 'react-icons/fa';

import CollectionData from '../../types/Collections';

import axios from "axios";
import ApiResponse from '../../types/ApiResponses';

import Slider from '@mui/material/Slider';
import { useCookies } from 'react-cookie';

const ModalAugmentCollection: React.FC<{
    askToClose: () => void;
    collectionData: CollectionData|undefined
}> = ({
    askToClose,
    collectionData
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

    const [numberOfAIAugmentedImages, setNumberOfAIAugmentedImages] = useState<number>(10);
    const [minCosineSimilarity, setMinCosineSimilarity] = useState<number>(0.8);
    const [decayCosineSimilarity, setDecayCosineSimilarity] = useState<number>(0.95);
    const [maxPatience, setMaxPatience] = useState<number>(20);

    const [AIAugmentedLoading, setAIAugmentedLoading] = useState<boolean>(false);

    const generateAIAugmentedCollection = async() => {
        setAIAugmentedLoading(true);

        // Send the query
        const body = {
            recordIDs: collectionData?.recordIDs,
            numberOfImages: numberOfAIAugmentedImages,
            min_cosine_similarity: minCosineSimilarity,
            decay_cosine_similarity: decayCosineSimilarity,
            max_patience: maxPatience
        };

        try {
            const response = await axios.post("http://127.0.0.1:5000/api/search/v2/augmentCollection", body, {
                headers: {
                'Content-Type': 'application/json',
                },
            });
        
            // Parse response.data as JSON
            const data: ApiResponse = response.data;
            const success = data["success"];
            if (!success) throw new Error(data["message"] ? data["message"].toString() : "An error occurred");
            const results = data["message"];
            if(!results) throw new Error("No results returned");

            // Add the recordIDs to the collection
            const augmentedRecordIDs = results.augmentedRecordIDs as number[];
            setCollections('fab-seg-collections', parsedCollections.map((collection: CollectionData) => {
                if (collection.identifier === collectionData?.identifier) {
                    return {
                        ...collection,
                        recordIDs: [...collection.recordIDs, ...augmentedRecordIDs],
                    };
                } else {
                    return collection;
                }
            }));

        } catch (error) {
            console.error("Error making POST request:", error);
            return { success: false, message: "An error occurred" };
        } finally {
            setAIAugmentedLoading(false);
            askToClose();
        }

    }

    return (
        <div className="modal">
            
            <div className="modal-header">
                <h1>Augmenter la taille de la collection avec l'IA</h1>
                <button className="modal-close-button" onClick={askToClose}>
                    <FaTimes />
                </button>
            </div>

            <div className="modal-content largePadding">

                { loading
                ? 
                <div className="modal-loading">
                    <h3>Chargement des données de la collection...</h3>
                </div>
                :
                <>
                    <div className="modal-input" is-disabled={AIAugmentedLoading.toString()}>
                        <label>Nombre d'images ajoutées (1-50)</label>
                        <div className="modal-input-spacer"></div>
                        <Slider
                            value={numberOfAIAugmentedImages}
                            onChange={(e, value) => {
                                value = Math.max(1, Math.min(50, value as number));
                                setNumberOfAIAugmentedImages(value);
                            }}
                            step={1}
                            min={1}
                            max={50}
                            valueLabelDisplay="on"
                            disabled={AIAugmentedLoading}
                        />
                    </div>

                    <div className="modal-input" is-disabled={AIAugmentedLoading.toString()}>
                        <label>Similarité minimale (0-1)</label>
                        <div className="modal-input-spacer"></div>
                        <Slider
                            value={minCosineSimilarity}
                            onChange={(e, value) => {
                                value = Math.max(0, Math.min(1, value as number));
                                setMinCosineSimilarity(value);
                            }}
                            step={0.01}
                            min={0}
                            max={1}
                            valueLabelDisplay="on"
                            disabled={AIAugmentedLoading}
                        />
                    </div>

                    <div className="modal-input" is-disabled={AIAugmentedLoading.toString()}>
                        <label>Decay de la similarité (0-1)</label>
                        <div className="modal-input-spacer"></div>
                        <Slider
                            value={decayCosineSimilarity}
                            onChange={(e, value) => {
                                value = Math.max(0, Math.min(1, value as number));
                                setDecayCosineSimilarity(value);
                            }}
                            step={0.01}
                            min={0}
                            max={1}
                            valueLabelDisplay="on"
                        />
                    </div>

                    <div className="modal-input" is-disabled={AIAugmentedLoading.toString()}>
                        <label>Patience maximale</label>
                        <div className="modal-input-spacer"></div>
                        <Slider
                            value={maxPatience}
                            onChange={(e, value) => {
                                value = Math.max(0, Math.min(50, value as number));
                                setMaxPatience(value);
                            }}
                            step={1}
                            min={0}
                            max={50}
                            valueLabelDisplay="on"
                            disabled={AIAugmentedLoading}
                        />
                    </div>

                    <div className="modal-buttons">
                        <button 
                            onClick={generateAIAugmentedCollection}
                            disabled={AIAugmentedLoading}
                        >
                            Augmenter la collection
                        </button>
                    </div>
                </>
                }
                
            </div>

        </div>
    );
};

export default ModalAugmentCollection;