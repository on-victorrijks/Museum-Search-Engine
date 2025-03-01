import React, {
    use,
    useState,
    useEffect,  
} from 'react';
import { FaArrowRight, FaThumbsDown, FaThumbsUp } from 'react-icons/fa';

interface SearchResultsArgs {
    results: Record<string, any>[];
    dislikeRecord: (imageInformations: Record<string, any>) => void;
    likeRecord: (imageInformations: Record<string, any>) => void;
    getLikeStatus: (recordID: number) => boolean | undefined;
}

const SearchResults: React.FC<SearchResultsArgs> = ({
    results,
    dislikeRecord,
    likeRecord,
    getLikeStatus
}) => {

    const renderResult = (result: Record<string, any>, index: number) => {
        const recordID = result["recordID"];
        let similarity = result["similarity"];
        // Round similarity to 3 decimals
        similarity = Math.round(similarity * 1000) / 1000;

        let title = result["objectWork.titleText"];
        let author = result["objectWork.creatorDescription"];
        let iconography = result["iconography"];
        let creationDate = result["objectWork.creationDateDescription"];

        if (!title) title = "Titre inconnu";
        if (!author) author = "Auteur inconnu";
        if (!iconography) iconography = [];
        if (!creationDate) creationDate = "Date inconnue";

        const imageURL = "http://127.0.0.1:5000/images/" + recordID;

        const isLiked = getLikeStatus(recordID);
    
        return (
            <div key={index} className='result'>
                <div className='result-image'>
                    <img src={imageURL} alt={title} />
                    <div className='result-similarity'>
                        <h4>{similarity}</h4>
                    </div>
                </div>
                <div className='result-content'>
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

                        <button
                            onClick={() => {
                                console.log("Viewing record", recordID);
                            }}
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
        <>
            {results.map((result, index) => renderResult(result, index))}
        </>
    );
}
export default SearchResults;