import React, { useEffect, useState } from 'react';
import '../../../styles/SearchComponent.css';

// Use react-icons
import { FaMicrophone, FaAngleUp, FaAngleDown, FaPlus } from 'react-icons/fa';

// Import uuid
import { v4 as uuidv4 } from 'uuid';

// Import types
import { 
    BetweenBlockProps,
    BlockType,
    IncludesBlockProps,
    EqualBlockProps,
    Query,
    QueryPart,
    SoftQueryPart,
    SoftQueryType,
    GroupBlockProps,
} from '../../../types/queries';

import QueryBuilder from '../../QueryBuilder';
import { useNotification } from '../../../contexts/NotificationContext';
import axios from 'axios';
import { ApiResponse, SuccessfulKeywordsResponse } from '../../../types/ApiResponses';
import { NotificationType } from '../../../types/Notification';
import {renderKeyword, renderColor, renderLuminosity, renderSoftQueryPart, BottomButtons } from './SubComponents';
import { colors, luminosities } from '../../../constants/SearchPanel';


enum SearchType {
    HARD = 'HARD',
    SOFT = 'SOFT',
}

const SearchComponent: React.FC<{
    loading: boolean;
    receiveQuery: (query: Query) => void;
    selectedTabIdentifier: string;
    queryParts: QueryPart[];
    setQueryParts: (queryParts: QueryPart[]) => void;
    updateQueryPartWeight: (identifier: string, weight: number) => void;
    resetQuery: () => void;
}> = ({
    loading,
    receiveQuery,
    selectedTabIdentifier,
    queryParts,
    setQueryParts,
    updateQueryPartWeight,
    resetQuery
}) => {
    const { showNotification } = useNotification();
    // Which search tab is selected
    const [searchSelection, setSearchSelection] = useState<SearchType>(SearchType.SOFT);

    // Version
    const [version, setVersion] = useState<string>("power");

    // Auto-search
    const [isAutoSearchEnabled, setIsAutoSearchEnabled] = useState<boolean>(true);

    // Soft search
    const [keywordsVisible, setKeywordsVisible] = useState<boolean>(false);
    const toggleKeywords = () => setKeywordsVisible(!keywordsVisible);
    const [localSearchTerm, setLocalSearchTerm] = useState<string>('');

    // Are blocks valid
    const [blocksValid, setBlocksValid] = useState<boolean>(true);
    const [blocksValidMessage, setBlocksValidMessage] = useState<string>('');

    // Keywords
    const [keywords, setKeywords] = useState<string[]>([]);
    const [keywordLoaded, setKeywordLoaded] = useState<boolean>(false);

    useEffect(() => {
        const fetchKeywords = async () => {
            const response: ApiResponse = (await axios.get('http://127.0.0.1:5000/api/get_keywords')).data;
            if (response.success) {
                const data = (response as SuccessfulKeywordsResponse).data;
                setKeywords(data);
                setKeywordLoaded(true);
            } else {
                showNotification({
                    type: NotificationType.ERROR,
                    title: "Erreur lors de la récupération des mots-clés",
                    text: response.error_message ?? "",
                    buttons: [],
                    timeout: 5000,
                    errorContext: {
                        timestamp: Date.now(),
                        message: "Une erreur est survenue lors de la récupération des mots-clés",
                        origin: "fetchKeywords"
                    }
                });
            }
        };
        if (!keywordLoaded) {
            fetchKeywords();
        }
    }, []);

    const validateSingleBlock = (block: QueryPart) => {
        switch(block.type) {
            case BlockType.EQUAL:
                return (block as EqualBlockProps).equalTo && (block as EqualBlockProps).equalTo.length > 0 
            case BlockType.BETWEEN:
                return (block as BetweenBlockProps).from && (block as BetweenBlockProps).to
            case BlockType.INCLUDES:
                return (block as IncludesBlockProps).values && (block as IncludesBlockProps).values.length > 0
            case BlockType.GROUP:
                return (block as GroupBlockProps).children && (block as GroupBlockProps).children.length > 0
            default:
                return true;
        }
    }

    const validateBlocks = (
        blocks: QueryPart[], 
        callback: (blocksValidDirect: boolean) => void
    ) => {
        // TODO: Validate the blocks
        /*
        RULES: 
        > AND/OR can only be placed after EQUAL, BETWEEN, or INCLUDES blocks
        > EQUAL, BETWEEN, INCLUDES can only be placed after AND/OR blocks (except when it is the first block !)
        > AND/OR cannot be placed last 
        > Obviously, each block must be filled with the required data
        */
        let lastBlock = null;
        let valid = true;
        let message = '';

        for (let i=0; i<blocks.length; i++) {
            
            if(!validateSingleBlock(blocks[i])){
                valid = false;
                message = 'Chaque block doit être rempli avec les données requises';
                break;
            }

            if (lastBlock===null) {
                continue;
            }

            const block = blocks[i];
            if (block.type === BlockType.AND || block.type === BlockType.OR) {
                if(i === (blocks.length - 1)) {
                    valid = false;
                    message = 'ET/OU ne peut être placé en dernier';
                    break;
                } else if (
                    (lastBlock === null ) || 
                    (lastBlock.type !== BlockType.EQUAL && lastBlock.type !== BlockType.BETWEEN && lastBlock.type !== BlockType.INCLUDES)
                ) {
                    valid = false;
                    message = 'ET/OU ne peut être placé qu\'après des blocs ÉGAL, ENTRE ou CONTIENT';
                    break;
                }
            } else if (block.type === BlockType.EQUAL || block.type === BlockType.BETWEEN || block.type === BlockType.INCLUDES) {
                if (
                    (lastBlock !== null && i>0) && 
                    lastBlock.type !== BlockType.AND && lastBlock.type !== BlockType.OR
                ) {
                    valid = false;
                    message = 'ÉGAL, ENTRE, CONTIENT ne peut être placé qu\'après des blocs ET/OU';
                    break;
                }
            }
            lastBlock = block;
        }

        setBlocksValid(valid);
        setBlocksValidMessage(message);

        callback(valid);
    };

    useEffect(() => {
        // TODO: Verify if the blocks are valid to update blocksValid and blocksValidMessage
        validateBlocks(queryParts, (blocksValidDirect: boolean) => {
            setBlocksValid(blocksValidDirect);
            if (blocksValidDirect && isAutoSearchEnabled) {
                const canSearch = !loading && blocksValid && queryParts.length > 0;
                if (canSearch) {
                    compileIntoTab(false);
                }
            }
        });
    }, [queryParts]);

    const startAudioRecording = () => {
        alert('NOT IMPLEMENTED');
        // TODO:
    }
    
    // Manual terms
    const addTermToSearch = () => {
        if (localSearchTerm.length==0) return;

        const newQueryPart: SoftQueryPart = {
            identifier: uuidv4(),
            type: SoftQueryType.TERM,
            isSoft: true,
            term: localSearchTerm,
            weight: 1
        };
        setQueryParts([...queryParts, newQueryPart]);
        setLocalSearchTerm('');
    }

    // Keywords
    const getKeywordStatus = (keyword: string) => {
        queryParts.find(q => {
            return q.type === SoftQueryType.KEYWORD && (q as SoftQueryPart).keyword === keyword
        });
        return false;
    }
    const toggleKeyword = (keyword: string) => {
        const isEnabled = getKeywordStatus(keyword);
        if (isEnabled) {
            // Remove the keyword
            setQueryParts(queryParts.filter(q => {
                return q.type !== SoftQueryType.KEYWORD || (q as SoftQueryPart).keyword !== keyword
            }));
        } else {
            // Add the keyword
            const newQueryPart: SoftQueryPart = {
                identifier: uuidv4(),
                isSoft: true,
                type: SoftQueryType.KEYWORD,
                keyword: keyword,
                weight: 1
            };
            setQueryParts([...queryParts, newQueryPart]);
        }
    }

    // Colors
    const getColorStatus = (colorId: string) => {
        queryParts.find(q => {
            return q.type === SoftQueryType.COLOR && (q as SoftQueryPart).color === colorId
        });
        return false;
    }
    const toggleColor = (colorId: string) => {
        const isEnabled = getColorStatus(colorId);
        if (isEnabled) {
            // Remove the color
            setQueryParts(queryParts.filter(q => {
                return q.type !== SoftQueryType.COLOR || (q as SoftQueryPart).color !== colorId
            }));
        } else {
            // Add the color
            const newQueryPart: SoftQueryPart = {
                identifier: uuidv4(),
                isSoft: true,
                type: SoftQueryType.COLOR,
                color: colorId,
                weight: 1
            };
            setQueryParts([...queryParts, newQueryPart]);
        }
    }

    // Luminosity
    const getLuminosityStatus = (luminosityId: string) => {
        queryParts.find(q => {
            return q.type === SoftQueryType.LUMINOSITY && (q as SoftQueryPart).luminosity === luminosityId
        });
        return false;
    }
    const toggleLuminosity = (luminosityId: string) => {
        const isEnabled = getLuminosityStatus(luminosityId);
        if (isEnabled) {
            // Remove the luminosity
            setQueryParts(queryParts.filter(q => {
                return q.type !== SoftQueryType.LUMINOSITY || (q as SoftQueryPart).luminosity !== luminosityId
            }));
        } else {
            // Add the luminosity
            const newQueryPart: SoftQueryPart = {
                identifier: uuidv4(),
                isSoft: true,
                type: SoftQueryType.LUMINOSITY,
                luminosity: luminosityId,
                weight: 1
            };
            setQueryParts([...queryParts, newQueryPart]);
        }
    }

    const removeQueryPart = (identifier: string) => setQueryParts(queryParts.filter(q => q.identifier !== identifier));

    const EmptyQueryParts = () => {
        return (
            <div className='emptyQueryParts'>
                <h1>Aucun filtre appliqué</h1>
            </div>
        );
    }

    const compileIntoTab = (isNewSearch:boolean) => {
        let identifier = isNewSearch ? 'N/A' : selectedTabIdentifier;
        const query = {
            identifier: identifier,
            parts: isNewSearch ? [] : queryParts,
            results: null,
            version: version,
            rocchio_k: 5,
            rocchio_scale: 1.0
        };
        receiveQuery(query);
    }

    return (
        <div className="sb-Content">

        <div className="search-selections">
            <div 
                className={"search-selection " + (searchSelection === 'HARD' ? 'selected' : '')}
                onClick={() => setSearchSelection(SearchType.HARD)}
            >
                <h1>Contraintes d'exclusion</h1>
            </div>
            <div 
                className={"search-selection " + (searchSelection === 'SOFT' ? 'selected' : '')}
                onClick={() => setSearchSelection(SearchType.SOFT)}
            >
                <h1>Contraintes de tri</h1>
            </div>
        </div>

        { searchSelection === SearchType.HARD &&
            <QueryBuilder 
                queryParts={queryParts}
                setQueryParts={setQueryParts}
                blocksValid={blocksValid}
                blocksValidMessage={blocksValidMessage}
            />
        }

        { searchSelection === SearchType.SOFT &&
        <>
            <div className='search-section'>
            
            <div className="searchSection">
                <h1>Version de l'algorithme</h1>
                <div className="textForm">
                    <select 
                        value={version}
                        onChange={(e) => setVersion(e.target.value)}
                    >
                        <option value="classic">Classique</option>
                        <option value="power">Power</option>
                        <option value="rocchio">Rocchio</option>
                    </select>
                </div>                
            </div>

            <div className="searchSection">
                <h1>Rechercher via du texte</h1>
                <div className="textForm">
                    <input 
                        type="text" 
                        placeholder="Un homme avec un chien"
                        value={localSearchTerm}
                        onChange={(e) => setLocalSearchTerm(e.target.value)}
                    />
                    <button
                        className='microphone'
                        onClick={() => startAudioRecording()}
                    >
                        <FaMicrophone />
                    </button>
                    <button
                        onClick={() => addTermToSearch()}
                    >
                        <FaPlus />
                    </button>
                </div>                
            </div>

            {/* Search via Keywords */}
            <div className="searchSection">

                <div className="dropHeader" id="dropHeader" onClick={toggleKeywords}>
                    <h1>Rechercher via des mots-clés</h1>
                    <div className="drop">
                        {
                            keywordsVisible ? 
                            <FaAngleUp /> : 
                            <FaAngleDown />
                        }
                    </div>
                </div>

                {keywordsVisible && 
                <div className="container" id="keywords_container">
                    { keywordLoaded && keywords.map(keyword => renderKeyword(
                        getKeywordStatus(keyword),
                        toggleKeyword,
                        keyword
                    )) }
                </div>
                }

            </div>

            {/* Search via Colors */}
            <div className="searchSection">
                <h1>Rechercher via des couleurs</h1>
                <div className="container" id="colors_container">
                    {colors.map(color => renderColor(
                        getColorStatus(color.id),
                        toggleColor,
                        color
                    ))}
                </div>
            </div>

            {/* Search via Luminosity */}
            <div className="searchSection">
                <h1>Rechercher via une luminosité</h1>
                <div className="container" id="luminosity_container">
                    {luminosities.map(luminosity => renderLuminosity(
                        getLuminosityStatus(luminosity.id),
                        toggleLuminosity,
                        luminosity
                    ))}
                </div>
            </div>

            </div>

            {/* Queries Container */}
            <div className="queries">
                <div className='queryPartsHeader'>
                    <h1>Vos filtres</h1>
                </div>
                <div className='queries_container'>
                {
                    queryParts.length > 0 
                    ? queryParts.map(queryPart => {
                        if (queryPart.isSoft) {
                            return renderSoftQueryPart(
                                removeQueryPart,
                                updateQueryPartWeight,
                                loading,
                                queryPart as SoftQueryPart
                            );
                        }
                        return null;
                    })
                    : <EmptyQueryParts />
                }
                </div>
            </div>
        </>
        }

    
        <BottomButtons 
            blocksValid={blocksValid}
            queryParts={queryParts}
            compileIntoTab={compileIntoTab}
            resetQuery={resetQuery}
            isAutoSearchEnabled={isAutoSearchEnabled}
            setIsAutoSearchEnabled={setIsAutoSearchEnabled}
        />

        </div>
    );
};

export default SearchComponent;


/*
// IN CASE THEY PREFER A SLIDE WITH TICKS
const RenderSlider_v1 = (queryPart: QueryPart) => {
    return (
        <div className='queryPart-Slider-v1'>
            <Slider
                defaultValue={queryPart.weight}
                step={0.25}
                min={-2}
                max={2}
                valueLabelDisplay="off"
                marks={weights}
                onChange={(e, value) => {
                    queryPart.weight = value as number;
                }}
                color='primary'
            />
        </div>
    );
}
*/