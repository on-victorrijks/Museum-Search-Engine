import React, { useEffect, useState } from 'react';
import '../styles/SearchComponent.css';

// Use react-icons
import { FaMicrophone, FaAngleUp, FaAngleDown, FaPlus, FaTimes, FaThumbsUp, FaThumbsDown } from 'react-icons/fa';

// Import uuid
import { v4 as uuidv4 } from 'uuid';

// Import types
import { 
    Query,
    QueryPart,
    SoftQueryPart,
    HardQueryPart,
    HardQueryPartControlled,
    EqualBlockProps,
    BetweenBlockProps,
    IncludesBlockProps,
    SelectionOption,
    BlockType,
    SoftQueryType,
} from '../types/queries';

import Slider from '@mui/material/Slider';
import QueryBuilder from './QueryBuilder';
import { NotificationType } from '../types/Notification';
import { useNotification } from '../contexts/NotificationContext';

const keywords = [
    "Portrait", "Autoportrait", "Femme", "Homme", "Enfant", "Couple", 
    "Nu", "Silhouette", "Visage", "Mains", "Corps", "Yeux", "Regard",
    "Paysage", "Nature morte", "Scène de rue", "Intérieur", "Vie quotidienne",
    "Rêverie", "Fête", "Bataille", "Mythologie", "Religion", "Danse", "Musique",
    "Mer", "Montagne", "Rivière", "Forêt", "Ciel", "Nuages", "Soleil", "Lune", 
    "Nuit", "Aube", "Crépuscule", "Saisons", "Neige", "Fleurs", "Arbre", "Vent",
    "Cathédrale", "Château", "Colonne", "Voûte", "Fresque", "Mosaïque", 
    "Ruines", "Fenêtre",
    "Ange", "Démon", "Sirène", "Centaure", "Dragon", "Masque", "Squelette", 
    "Crâne", "Couronne", "Clé", "Échelle", "Labyrinthe"
];

const colors = [
    { id: 'Noir et blanc', style: 'linear-gradient(45deg, #000000, #ffffff)' },
    { id: 'Couleurs vives, coloré, couleurs intenses', style: 'conic-gradient(#ff5733, #ffc300, #28a745, #17a2b8, #6f42c1, #ff5733)' },
    { id: 'Couleurs sombres', style: 'conic-gradient(#4a322f, #3f522d, #2d4a4a, #2f2f4a, #4a2d4a, #4a322f)' },
    { id: 'Couleur rouge, ton rouge, rouge', style: 'linear-gradient(to right, rgba(255, 0, 0, 0.5), rgba(255, 0, 0, 0.8))' },
    { id: 'Couleur bleue, ton bleu, bleu', style: 'linear-gradient(to right, rgba(0, 0, 255, 0.5), rgba(0, 0, 255, 0.8))' },
    { id: 'Couleur verte, ton vert, vert', style: 'linear-gradient(to right, rgba(0, 255, 0, 0.5), rgba(0, 255, 0, 0.8))' },
];

const luminosities = [
    { id: 'Image sombre', color: '#000', text: 'Sombre', textColor: '#fff' },
    { id: 'Image claire', color: '#ababab', text: 'Clair', textColor: '#000' },
];

const formatType = (type: string) => {
    switch(type) {
        case SoftQueryType.TERM:
            return 'Texte';
        case SoftQueryType.KEYWORD:
            return 'Mot-clé';
        case SoftQueryType.COLOR:
            return 'Couleur';
        case SoftQueryType.LUMINOSITY:
            return 'Luminosité';
        case SoftQueryType.PRECOMPUTED:
            return 'Image';
        default:
            return 'Inconnu';
    }
}

// TO EXPORT
const SearchButton: React.FC<{
    canSearch: boolean,
    compileIntoTab: (isNewSearch: boolean) => void
}> = ({ 
    canSearch,
    compileIntoTab
}) => {
    return (
        <button
            className="primary"
            onClick={() => compileIntoTab(false)}
            disabled={!canSearch}
        >
            Rechercher
        </button>
    );
}

const NewQueryButton: React.FC<{
    canSearch: boolean,
    compileIntoTab: (isNewSearch: boolean) => void
}> = ({ 
    canSearch,
    compileIntoTab
}) => {
    return (
        <button
            className="secondary"
            onClick={() => compileIntoTab(true)}
            disabled={!canSearch}
        >
            Nouvel onglet
        </button>
    );
}

const renderKeyword = (
    isEnabled: boolean,
    toggleKeyword: (keyword: string) => void,
    keyword: string
) => {
    return (
        <div 
            key={keyword} 
            className={`keyword ${isEnabled ? 'enabled' : ''}`}
            onClick={() => toggleKeyword(keyword)}
        >
            <h3>{keyword}</h3>
        </div>
    );
}
const renderColor = (
    isEnabled: boolean,
    toggleColor: (colorId: string) => void,
    color: { id: string, style: string }
) => {
    return (
        <div 
            key={color.id} 
            className={`color ${isEnabled ? 'enabled' : ''}`}
            style={{ background: color.style }}
            onClick={() => toggleColor(color.id)}
        >
        </div>
    );
}
const renderLuminosity = (
    isEnabled: boolean,
    toggleLuminosity: (luminosityId: string) => void,
    luminosity: { id: string, color: string, text: string, textColor: string }
) => {
    return (
        <div 
            key={luminosity.id} 
            className={`luminosity ${isEnabled ? 'enabled' : ''}`}
            style={{ background: luminosity.color, color: luminosity.textColor }}
            onClick={() => toggleLuminosity(luminosity.id)}
        >
            <h3 
                style={{ color: luminosity.textColor }}
            >{luminosity.text}</h3>
        </div>
    );
}
const RenderSlider = (
    updateQueryPartWeight: (identifier: string, weight: number) => void,
    loading: boolean,
    queryPart: SoftQueryPart
) => {
    return (
        <div className='queryPart-Slider'>
            <div className='side min'>
                <FaThumbsDown />
            </div>
            <Slider
                defaultValue={queryPart.weight}
                step={0.25}
                min={-2}
                max={2}
                valueLabelDisplay="off"
                onChangeCommitted={(e, value) => updateQueryPartWeight(
                    queryPart.identifier, 
                    value as number
                )}
                color='primary'
                disabled={loading}
            />
            <div className='side max'>
                <FaThumbsUp />
            </div>
        </div>
    );
}
const renderSoftQueryPart = (
    removeQueryPart: (identifier: string) => void,
    updateQueryPartWeight: (identifier: string, weight: number) => void,
    loading: boolean,
    queryPart: SoftQueryPart
) => {
    let imageURL;
    if (queryPart.imageInformations) {
        imageURL = "http://127.0.0.1:5000/api/artwork/" + queryPart.imageInformations["recordID"] + "/image";
    }

    return (
        <div key={queryPart.identifier} className="queryPart">
            { queryPart.imageInformations &&
            <div className="queryPartImage" style={{ backgroundImage: `url(${imageURL})` }}>
            </div>
            }
            <div className='queryPart-Header'>
                <div className="queryPartText">
                    <h4>{formatType(queryPart.type)}</h4>
                    {queryPart.term && <h2>{queryPart.term}</h2>}
                    {queryPart.keyword && <h2>{queryPart.keyword}</h2>}
                    {queryPart.color && <h2>{queryPart.color}</h2>}
                    {queryPart.luminosity && <h2>{queryPart.luminosity}</h2>}
                    {queryPart.imageInformations && <>
                        <h2>
                            {queryPart.imageInformations["objectWork.titleText"]} - {queryPart.imageInformations["objectWork.creatorDescription"]}
                        </h2>
                    </>}
                </div>
                <button
                    onClick={() => removeQueryPart(queryPart.identifier)}
                >
                    <FaTimes />
                </button>
            </div>
            {RenderSlider(
                updateQueryPartWeight,
                loading,
                queryPart
            )}
        </div>
    );
}

enum SearchType {
    HARD = 'HARD',
    SOFT = 'SOFT',
}

interface SearchComponentProps {
    loading: boolean;
    receiveQuery: (query: Query) => void;
    selectedTabIdentifier: string;
    queryParts: QueryPart[];
    setQueryParts: (queryParts: QueryPart[]) => void;
    updateQueryPartWeight: (identifier: string, weight: number) => void;
    resetQuery: () => void;
}

const SearchComponent: React.FC<SearchComponentProps> = ({
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

    // Auto-search
    const [isAutoSearchEnabled, setIsAutoSearchEnabled] = useState<boolean>(true);

    // Soft search
    const [keywordsVisible, setKeywordsVisible] = useState<boolean>(false);
    const toggleKeywords = () => setKeywordsVisible(!keywordsVisible);
    const [localSearchTerm, setLocalSearchTerm] = useState<string>('');

    // Are blocks valid
    const [blocksValid, setBlocksValid] = useState<boolean>(true);
    const [blocksValidMessage, setBlocksValidMessage] = useState<string>('');

    const validateBlocks = (callback: (blocksValidDirect: boolean) => void) => {
        // TODO: Validate the blocks
        console.log(queryParts);
        callback(true);
    };

    const UND = () => {
        /*
            RULES: 
            AND/OR can only be placed after EQUAL, BETWEEN, or INCLUDES blocks
            EQUAL, BETWEEN, INCLUDES can only be placed after AND/OR blocks (except when it is the first block !)
            AND/OR cannot be placed last
            
            Obviously, each block must be filled with the required data
            let lastBlock = null;
            let valid = true;
            let message = '';
    
            for (let i=0; i<blocks.length; i++) {
                
                if(!validateSingleBlock(blocks[i])){
                    valid = false;
                    message = 'Chaque block doit être rempli avec les données requises';
                    break;
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

            if(valid) {
                updateQueryPartsFromBlocks();
            }
        */
    }

    useEffect(() => {
        // TODO: Verify if the blocks are valid to update blocksValid and blocksValidMessage
        validateBlocks((blocksValidDirect: boolean) => {
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

    // Remove query part
    const removeQueryPart = (identifier: string) => setQueryParts(queryParts.filter(q => q.identifier !== identifier));

    const EmptyQueryParts = () => {
        return (
            <div className='emptyQueryParts'>
                <h1>Aucun filtre appliqué</h1>
            </div>
        );
    }

    // Buttons
    const compileIntoTab = (isNewSearch:boolean) => {
        let identifier = isNewSearch ? 'N/A' : selectedTabIdentifier;
        const query = {
            identifier: identifier,
            parts: isNewSearch ? [] : queryParts,
            results: null
        };
        receiveQuery(query);
    }

    const clearAll = () => {
        setQueryParts([]);
    }

    const BottomButtons = () => {
        return (
        <div className="buttons">
            <SearchButton 
                canSearch={blocksValid && queryParts.length > 0} 
                compileIntoTab={compileIntoTab}
            />
            <NewQueryButton 
                canSearch={blocksValid && queryParts.length > 0} 
                compileIntoTab={compileIntoTab} 
            />
        </div>
        );
    }

    return (
        <div className="sb-Content">
        {/* Header */}
        <div className="header">
            <img src="./src/assets/logo.svg" alt="Logo" />
        </div>

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
            {/* Search via Text */}
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
                    { keywords.map(keyword => renderKeyword(
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

    
        <BottomButtons />

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