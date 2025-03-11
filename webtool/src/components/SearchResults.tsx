import React, {
    use,
    useState,
    useEffect,  
    useRef,
    useCallback
} from 'react';
import { FaArrowRight, FaThumbsDown, FaThumbsUp } from 'react-icons/fa';

import Masonry, {ResponsiveMasonry} from "react-responsive-masonry"
import { TabData } from '../types/tab';
// Import uuid
import { v4 as uuidv4 } from 'uuid';

const MIN_COLUMN_WIDTH = 300;

interface SearchResultsArgs {
    isEmptyQuery: boolean;
    results: Record<string, any>[];
    dislikeRecord: (imageInformations: Record<string, any>) => void;
    likeRecord: (imageInformations: Record<string, any>) => void;
    getLikeStatus: (recordID: number) => boolean | undefined;
    addTab: (tab: TabData) => void;
}

const SearchResults: React.FC<SearchResultsArgs> = ({
    isEmptyQuery,
    results,
    dislikeRecord,
    likeRecord,
    getLikeStatus,
    addTab,
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


    const renderResult = (result: Record<string, any>, index: number) => {
        const recordID = result["recordID"];
        let similarity = result["similarity"];
        // Round similarity to 3 decimals
        similarity = Math.round(similarity * 1000) / 1000;

        let title = result["objectWork.titleText"];
        let author = result["objectWork.creatorDescription"];
        let iconography = result["iconography"];
        let creationDate = (result["creation.earliestDate"] || "?") + " - " + (result["creation.latestDate"] || "?");

        if (title=="") title = "Titre inconnu";
        if (author=="") author = "Auteur inconnu";

        const imageURL = "http://127.0.0.1:5000/images/" + recordID;

        const isLiked = getLikeStatus(recordID);
        const isLikedStr = isLiked === true ? "true" : isLiked === false ? "false" : "none";
        
        return (
            <div key={index} className='result' is-liked={isLikedStr}>
                <div className='result-image'>
                    <img src={imageURL} alt={title} />
                </div>
                <div className='result-content'>

                    <div className="result-interactions">
                        <button
                            className={`square ${isLiked===true && 'enabled'}`}
                            onClick={() => likeRecord(result)}
                        >
                            <FaThumbsUp />
                        </button>
                        <button
                            className={`square ${isLiked===false && 'enabled'}`}
                            onClick={() => dislikeRecord(result)}
                        >
                            <FaThumbsDown />
                        </button>
                    </div>

                    <div className="result-header-sec"></div>

                    <h2>{title}</h2>
                    <div className='result-infos'>
                        <h3>{author}</h3>
                        <div className='bubble'></div>
                        <h3>{creationDate}</h3>
                    </div>
                    <div className='result-iconography-container'>
                        { iconography.map((icon: string, index: number) => (
                            <span key={recordID + "-ico-" + index} className='result-iconography'>
                                {icon}
                            </span>
                        ))}
                    </div>
                
                    <div className='result-spacer'></div>

                    <div className='result-buttons'>
                        <button
                            onClick={() => addTab({
                                type: 'artpiece-profile',
                                identifier: uuidv4(),
                                content: {
                                    recordID: recordID,
                                    data: result
                                }
                            })}
                        >
                            <h3>Plus de détails</h3>
                            <FaArrowRight />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className='search-results' ref={componentRef}>
            {isEmptyQuery && (
                <div className='empty-query'>
                    <h2>Entrez une requête pour commencer</h2>
                </div>
            )}
            {
                !isEmptyQuery && results.length === 0 && (
                    <div className='no-results'>
                        <h2>Aucun résultat trouvé</h2>
                    </div>
                )
            }
            <Masonry 
                columnsCount={numberOfColums} 
                gutter="10px"
                sequential={true}
            >
                {results.map((result, index) => renderResult(result, index))}
            </Masonry>
        </div>
    );
}
export default SearchResults;