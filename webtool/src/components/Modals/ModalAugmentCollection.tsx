import React, { useState } from 'react';

import "../../styles/Modals/ModalAugmentCollection.css";
import { FaTimes } from 'react-icons/fa';

import CollectionData from '../../types/Collections';

import axios from "axios";
import { ApiResponse } from '../../types/ApiResponses';

import Slider from '@mui/material/Slider';
import { NotificationType } from '../../types/Notification';
import { useNotification } from '../../contexts/NotificationContext';
import { useCollection } from '../../contexts/CollectionContext';
import { useModal } from '../../contexts/ModalContext';
import { useSettings } from '../../contexts/SettingsContext';

const RenderParametersConvexFill: React.FC<{
    numberOfAIAugmentedImages: number;
    setNumberOfAIAugmentedImages: (value: number) => void;
    minCosineSimilarity: number;
    setMinCosineSimilarity: (value: number) => void;
    decayCosineSimilarity: number;
    setDecayCosineSimilarity: (value: number) => void;
    maxPatience: number;
    setMaxPatience: (value: number) => void;
    AIAugmentedLoading: boolean;
}> = ({
    numberOfAIAugmentedImages,
    setNumberOfAIAugmentedImages,
    minCosineSimilarity,
    setMinCosineSimilarity,
    decayCosineSimilarity,
    setDecayCosineSimilarity,
    maxPatience,
    setMaxPatience,
    AIAugmentedLoading,
}) => {
    return (<>
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
            onChange={(_e, value) => {
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
            onChange={(_e, value) => {
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
    </>);
};

const RenderParametersShortestPath: React.FC<{}> = () => {
    return (<></>);
};

const RenderParameters: React.FC<{
    method: string;
    numberOfAIAugmentedImages: number;
    setNumberOfAIAugmentedImages: (value: number) => void;
    minCosineSimilarity: number;
    setMinCosineSimilarity: (value: number) => void;
    decayCosineSimilarity: number;
    setDecayCosineSimilarity: (value: number) => void;
    maxPatience: number;
    setMaxPatience: (value: number) => void;
    AIAugmentedLoading: boolean;
}> = ({
    method,
    numberOfAIAugmentedImages,
    setNumberOfAIAugmentedImages,
    minCosineSimilarity,
    setMinCosineSimilarity,
    decayCosineSimilarity,
    setDecayCosineSimilarity,
    maxPatience,
    setMaxPatience,
    AIAugmentedLoading,
}) => {
    switch (method) {
        case "convex_fill":
            return <RenderParametersConvexFill
                numberOfAIAugmentedImages={numberOfAIAugmentedImages}
                setNumberOfAIAugmentedImages={setNumberOfAIAugmentedImages}
                minCosineSimilarity={minCosineSimilarity}
                setMinCosineSimilarity={setMinCosineSimilarity}
                decayCosineSimilarity={decayCosineSimilarity}
                setDecayCosineSimilarity={setDecayCosineSimilarity}
                maxPatience={maxPatience}
                setMaxPatience={setMaxPatience}
                AIAugmentedLoading={AIAugmentedLoading}
            />;
        case "shortest_path":
            return <RenderParametersShortestPath />;
        default:
            return null;
    }
};

const ModalAugmentCollection: React.FC<{}> = ({}) => {
    const { showNotification } = useNotification();
    const { batchAddArtworksToSelectedCollection, getCollection } = useCollection();
    const { closeAugmentCollection, data__AugmentCollection } = useModal();
    const { settings } = useSettings();
    
    // Method
    const [method, setMethod] = useState<string>("convex_fill");

    // Convex fill parameters
    const [numberOfAIAugmentedImages, setNumberOfAIAugmentedImages] = useState<number>(10);
    const [minCosineSimilarity, setMinCosineSimilarity] = useState<number>(0.8);
    const [decayCosineSimilarity, setDecayCosineSimilarity] = useState<number>(0.95);
    const [maxPatience, setMaxPatience] = useState<number>(20);

    // Shortest path parameters
    // none

    const [AIAugmentedLoading, setAIAugmentedLoading] = useState<boolean>(false);

    const generateAIAugmentedCollection = async() => {
        try {

            setAIAugmentedLoading(true);

            const collectionData = getCollection(data__AugmentCollection.collectionIdentifier);
            if (!collectionData) {
                throw new Error("Collection non trouvée");
            }
    
            // Send the query
            const body : Record<string, any> = {
                recordIDs: collectionData?.recordIDs,
                model_name: settings.model_name,
                method: method,
            };
    
            if (method === "convex_fill") {
                body.numberOfImages = numberOfAIAugmentedImages;
                body.similarityThreshold = minCosineSimilarity;
                body.decayRate = decayCosineSimilarity;
                body.patience = maxPatience;
            }

            const response = await axios.post("http://127.0.0.1:5000/api/collection/augment", body, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        
            // Parse response.data as JSON
            const data: ApiResponse = response.data;
            const success = data["success"];
            if (!success) throw new Error(data["error_message"] ? data["error_message"].toString() : "An error occurred");
            const results = data["data"] as number[];
            const augmentedRecordIDs = results;
            // Add the recordIDs to the collection
            if (collectionData) { // Redundant but ts
                batchAddArtworksToSelectedCollection(collectionData.identifier, augmentedRecordIDs);
            }
        } catch (error) {
            showNotification({
                type: NotificationType.ERROR,
                title: "Erreur lors de l'augmentation de la collection",
                text: "Une erreur est survenue lors de l'augmentation de la collection",
                buttons: [],
                timeout: 5000,
                errorContext: {
                    timestamp: Date.now(),
                    message: "Une erreur est survenue lors de l'augmentation de la collection",
                    origin: "generateAIAugmentedCollection:" + error
                }
            });
            return { success: false, message: "An error occurred" };
        } finally {
            setAIAugmentedLoading(false);
            closeAugmentCollection();
        }
    }

    return (
        <div className="modal">
            
            <div className="modal-header">
                <h1>Augmenter la taille de la collection avec l'IA</h1>
                <button className="modal-close-button" onClick={closeAugmentCollection}>
                    <FaTimes />
                </button>
            </div>

            <div className="modal-content largePadding">

                <div className="modal-input">
                    <label>Méthode</label>
                    <select value={method} onChange={(e) => setMethod(e.target.value)}>
                        <option value="convex_fill">Convex Fill</option>
                        <option value="shortest_path">Shortest Path</option>
                    </select>
                </div>

                <RenderParameters
                    method={method}

                    numberOfAIAugmentedImages={numberOfAIAugmentedImages}
                    setNumberOfAIAugmentedImages={setNumberOfAIAugmentedImages}

                    minCosineSimilarity={minCosineSimilarity}
                    setMinCosineSimilarity={setMinCosineSimilarity}

                    decayCosineSimilarity={decayCosineSimilarity}
                    setDecayCosineSimilarity={setDecayCosineSimilarity}

                    maxPatience={maxPatience}
                    setMaxPatience={setMaxPatience}

                    AIAugmentedLoading={AIAugmentedLoading}
                />

                <div className="modal-buttons">
                    <button 
                        onClick={generateAIAugmentedCollection}
                        disabled={AIAugmentedLoading}
                    >
                        Augmenter la collection
                    </button>
                </div>
            </div>

        </div>
    );
};

export default ModalAugmentCollection;