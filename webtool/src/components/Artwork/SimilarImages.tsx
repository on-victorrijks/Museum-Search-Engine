import React, {
    useState,
    useEffect
} from 'react';
// Import uuid
import axios from 'axios';
import ApiResponse from '../../types/ApiResponse';

import "../../styles/SimilarImages.css";
import ArtPiecesGallery from './../Artwork/ArtPiecesGallery';


const SimilarImages: React.FC<{
    recordID: number;
    openArtPieceProfile: (recordID: number) => void;
}> = ({
    recordID,
    openArtPieceProfile
}) => {

    const [loading, setLoading] = useState<boolean>(false);
    const [neighbours, setNeighbours] = useState<Record<string, any>[]>([]);

    const fetchNeighbours = async(recordID: number) => {
        const body = {
            "recordID": recordID,
        };

        try {
            const response = await axios.post("http://127.0.0.1:5000/api/search/v2/neighbours", body, {
                headers: {
                'Content-Type': 'application/json',
                },
            });
        
            // Parse response.data as JSON
            const data: ApiResponse = response.data;
            const success = data["success"];
            if (!success) throw new Error(data["message"] ? data["message"].toString() : "An error occurred");
            const results = data["message"];
            if (!results) throw new Error("No results found");
            setNeighbours(results["neighbours"]);
        } catch (error) {
            console.error("Error making POST request:", error);
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