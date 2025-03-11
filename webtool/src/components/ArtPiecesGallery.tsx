import React, {
    useState,
    useEffect,  
    useRef,
} from 'react';

import "../styles/APG.css";
import Masonry from "react-responsive-masonry"

const MIN_COLUMN_WIDTH = 150;

const RenderImage : React.FC<{
    recordID: number,
    index: number,
    openArtPieceProfile: (recordID: number) => void;
}> = ({
    recordID,
    index,
    openArtPieceProfile
}) => {
    const imageURL = "http://127.0.0.1:5000/images/" + recordID;
    return (
        <div key={index} className="APG-item" onClick={() => openArtPieceProfile(recordID)}>
            <img src={imageURL} alt={recordID.toString()} />
        </div>
    );
}

const ArtPiecesGallery: React.FC<{
    recordIDs: number[],
    openArtPieceProfile: (recordID: number) => void;
}> = ({
    recordIDs,
    openArtPieceProfile
}) => {

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

    return (
        <Masonry 
            columnsCount={numberOfColums} 
            gutter="10px"
            sequential={true}
        >
            {recordIDs.map((recordID, index) => <RenderImage key={index} recordID={recordID} index={index} openArtPieceProfile={openArtPieceProfile} />)}
        </Masonry>
    );
}
export default ArtPiecesGallery;