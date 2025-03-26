import React, {
    useState,
    useEffect
} from 'react';
import axios from 'axios';
import { ApiResponse, SuccessfulNeighboursResponse } from '../../types/ApiResponses';

import "../../styles/SimilarImages.css";
import ArtPiecesGallery from './../Artwork/ArtPiecesGallery';
import { NotificationType } from '../../types/Notification';
import { useNotification } from '../../contexts/NotificationContext';

const SimilarImages: React.FC<{
    recordID: number;
    openArtPieceProfile: (recordID: number) => void;
}> = ({
    recordID,
    openArtPieceProfile
}) => {

    const { showNotification } = useNotification();

    const [loading, setLoading] = useState<boolean>(false);
    const [neighbours, setNeighbours] = useState<Record<string, any>[]>([]);

    const fetchNeighbours = async(recordID: number) => {

        try {
            const response = await axios.get("http://127.0.0.1:5000/api/artwork/" + recordID + "/similar");
        
            // Parse response.data as JSON
            const data: ApiResponse = response.data;
            const success = data["success"];
            if (!success) throw new Error(data["error_message"] ? data["error_message"].toString() : "An error occurred");    
            const neighbours = data as SuccessfulNeighboursResponse;
            if (!neighbours) throw new Error("No data found");
            if (!neighbours.data) throw new Error("No data found");
            setNeighbours(neighbours.data.results);
        } catch (error) {
            showNotification({
                type: NotificationType.ERROR,
                title: "Erreur lors de la récupération des images similaires",
                text: "Une erreur est survenue lors de la récupération des images similaires",
                buttons: [],
                timeout: 5000,
                errorContext: {
                    timestamp: Date.now(),
                    message: "Une erreur est survenue lors de la récupération des images similaires",
                    origin: "fetchNeighbours"
                }
            });
            return { success: false, message: "An error occurred" };
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (recordID) {
            fetchNeighbours(recordID);
        }
    }, [recordID]);

    return (
        <div className="similar-images">
            { loading 
            ? 
            <div className="loading">
                <h3>Chargement des images similaires...</h3>
            </div>
            :
            <ArtPiecesGallery 
                recordIDs={neighbours.map(neighbour => neighbour["recordID"])}
                openArtPieceProfile={openArtPieceProfile}
            />
            }
        </div>
    );
}
export default SimilarImages;