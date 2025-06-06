import React, {
    useState,
    useEffect,  
    useRef,
} from 'react';
import { FaArrowDown, FaArrowRight } from 'react-icons/fa';

import Masonry from "react-responsive-masonry"
import { TabData } from '../types/tab';
import { v4 as uuidv4 } from 'uuid';
import ArtPieceInteractions from './Artwork/ArtPieceInteractions';
import ArtPieceData from '../types/ArtPiece';

import '../styles/SearchResults.css';

const MIN_COLUMN_WIDTH = 300;

const SearchResults: React.FC<{
    isEmptyQuery: boolean;
    results: ArtPieceData[];

    dislikeRecord: (imageInformations: ArtPieceData) => void;
    likeRecord: (imageInformations: ArtPieceData) => void;
    getLikeStatus: (recordID: number) => boolean | undefined;

    addTermFromIconography: (term: string) => void;
    getTermStatusInQuery: (term: string) => boolean;

    addTab: (tab: TabData) => void;
    openArtistProfile: (creatorid: string) => void;

    canLike: boolean;

    askForMoreResults: () => void;

    columnsCount: number;
    setColumnsCount: (columnsCount: number) => void;

    userChangedColumnsCount: boolean;
}> = ({
    isEmptyQuery,
    results,
    dislikeRecord,
    likeRecord,
    getLikeStatus,
    addTermFromIconography,
    getTermStatusInQuery,
    addTab,
    openArtistProfile,
    canLike,
    askForMoreResults,

    columnsCount,
    setColumnsCount,

    userChangedColumnsCount
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
        if (size && !userChangedColumnsCount) {
            const width = size.width;
            const columns = Math.floor(width / MIN_COLUMN_WIDTH);
            setColumnsCount(columns);
        }
    }, [size]);

    const renderResult = (result: ArtPieceData, index: number) => {
        const recordID = result.recordid;
        let similarity = result.similarity || 0;
        // Round similarity to 3 decimals
        similarity = Math.round(similarity * 1000) / 1000;

        let title = result.title;
        let author = result.creatorfirstname + " " + result.creatorlastname;
        let iconography = result.stf_values;
        let creationDate = (result.creationearliestdate || "?") + " - " + (result.creationlatestdate || "?");

        if (title=="") title = "Titre inconnu";
        if (author=="") author = "Auteur inconnu";

        const imageURL = "http://127.0.0.1:5000/api/artwork/" + recordID + "/image";

        const isLiked = getLikeStatus(recordID);
        const isLikedStr = isLiked === true ? "true" : isLiked === false ? "false" : "none";
        
        return (
            <div key={index} className='result' is-liked={isLikedStr}>
                <div className='result-image'>
                    <img src={imageURL} alt={title} />
                </div>
                <div className='result-content'>

                    <ArtPieceInteractions
                        recordID={recordID}
                        isLiked={isLiked}
                        likeRecord={() => likeRecord(result)}
                        dislikeRecord={() => dislikeRecord(result)}
                        absolutePosition={true}
                        small={true}
                        canLike={canLike}
                    />

                    <div className="result-header-sec"></div>

                    <h2>{title}</h2>
                    <h3>RecordID: {result.recordid}</h3>
                    <div className='result-infos'>
                        <h3 className="clickable" onClick={() => openArtistProfile(result.creatorid)}>{author}</h3>
                        <div className='bubble'></div>
                        <h3>{creationDate}</h3>
                    </div>
                    <div className='result-iconography-container'>
                        { iconography.map((icon: string, index: number) => (
                            <span 
                                onClick={() => addTermFromIconography(icon)}
                                is-in-query={getTermStatusInQuery(icon) ? "true" : "false"}
                                key={recordID + "-ico-" + index} 
                                className='result-iconography'
                            >
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
                columnsCount={columnsCount} 
                gutter="10px"
                sequential={true}
            >
                {results.map((result, index) => renderResult(result, index))}
            </Masonry>
            <div className='results-bottom'>
                <button onClick={askForMoreResults}>
                    <h3>Afficher plus</h3>
                    <FaArrowDown />
                </button>

            </div>
        </div>
    );
}
export default SearchResults;