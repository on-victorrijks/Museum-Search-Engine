import React, {
    useState,
    useEffect,  
    useRef,
} from 'react';
// Import uuid
import axios from 'axios';
import ApiResponse from '../types/ApiResponse';

import "../styles/SimilarImages.css";
import Masonry from "react-responsive-masonry"

const MIN_COLUMN_WIDTH = 150;

const RenderNeighbour : React.FC<{
    neighbour: Record<string, any>,
    index: number,
    openArtPieceProfile: (recordID: number) => void;
}> = ({
    neighbour,
    index,
    openArtPieceProfile
}) => {
    const imageURL = "http://127.0.0.1:5000/images/" + neighbour["recordID"];
    return (
        <div key={index} className="similar-images-neighbour" onClick={() => openArtPieceProfile(neighbour["recordID"])}>
            <img src={imageURL} alt="Similar image" />
        </div>
    );
}

const SimilarImages: React.FC<{
    recordID: number;
    openArtPieceProfile: (recordID: number) => void;
}> = ({
    recordID,
    openArtPieceProfile
}) => {

    const [loading, setLoading] = useState<boolean>(false);
    const [neighbours, setNeighbours] = useState<Record<string, any>[]>([]);

    const componentRef = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  
    useEffect(() => {
        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (entry) {
            setSize({
                width: entry.contentRect.width,
                height: entry.contentRect.height,
            });
            }
        });
    
        if (componentRef.current) {
            observer.observe(componentRef.current);
        }
    
        return () => {
            if (componentRef.current) {
            observer.disconnect();
            }
        };
    }, []);

    useEffect(() => {
        if (size) {
            const width = size.width;
            const columns = Math.floor(width / MIN_COLUMN_WIDTH);
            setNumberOfColumns(columns);
        }
    }, [size]);

    const [numberOfColums, setNumberOfColumns] = useState(3); 

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
        <div className="similar-images" ref={componentRef}>
            { loading 
            ? 
            <div className="loading">
                <h3>Chargement des images similaires...</h3>
            </div>
            :
            <Masonry 
                columnsCount={numberOfColums} 
                gutter="10px"
                sequential={true}
            >
                {neighbours.map((neighbour, index) => <RenderNeighbour key={index} neighbour={neighbour} index={index} openArtPieceProfile={openArtPieceProfile} />)}
            </Masonry>
            }
        </div>
    );
}
export default SimilarImages;