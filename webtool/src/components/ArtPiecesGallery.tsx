import React, {
    useState,
    useEffect,  
    useRef,
} from 'react';

import "../styles/APG.css";
import Masonry from "react-responsive-masonry"
import { FaTimes } from 'react-icons/fa';

const MIN_COLUMN_WIDTH = 250;

const RenderImage : React.FC<{
    recordID: number,
    index: number,
    openArtPieceProfile: ((recordID: number) => void) | undefined;
    deleteFromCollection: ((recordID: number) => void) | undefined;
}> = ({
    recordID,
    index,
    openArtPieceProfile,
    deleteFromCollection,
}) => {
    const imageURL = "http://127.0.0.1:5000/images/" + recordID;
    return (
        <div 
            key={index} 
            className={"APG-item " + (openArtPieceProfile ? "hasOnClick" : "")}
            onClick={
                openArtPieceProfile 
                ? () => openArtPieceProfile(recordID)
                : undefined
            }
        >
            { deleteFromCollection &&
                <button 
                    className="APG-delete"
                    onClick={() => deleteFromCollection(recordID)}
                >
                    <FaTimes />
                </button>
            }
            <img src={imageURL} alt={recordID.toString()} />
        </div>
    );
}

const ArtPiecesGallery: React.FC<{
    recordIDs: number[],
    openArtPieceProfile?: ((recordID: number) => void) | undefined;
    deleteFromCollection?: ((recordID: number) => void) | undefined;
}> = ({
    recordIDs,
    openArtPieceProfile = undefined,
    deleteFromCollection = undefined
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
            const columns = Math.max(1, Math.floor(width / MIN_COLUMN_WIDTH));
            setNumberOfColumns(columns);
        }
    }, [size]);

    const [numberOfColums, setNumberOfColumns] = useState(5); 

    return (
        <div ref={componentRef} style={{width: "100%"}}>
            <Masonry 
                columnsCount={numberOfColums} 
                gutter="10px"
                sequential={true}
            >
                {recordIDs.map((recordID, index) => 
                <RenderImage 
                    key={index} 
                    recordID={recordID} 
                    index={index} 
                    openArtPieceProfile={openArtPieceProfile} 
                    deleteFromCollection={deleteFromCollection}
                />)}
            </Masonry>
        </div>
    );
}
export default ArtPiecesGallery;