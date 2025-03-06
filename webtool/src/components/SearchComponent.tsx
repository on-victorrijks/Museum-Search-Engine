import React, { useEffect, useState } from 'react';
import '../styles/SearchComponent.css';
import { TabData } from '../types/tab';
import { QueryPart, Query, HardQueryPartOperation, HardQueryPartLeaf } from '../types/queries';

// Use react-icons
import { FaSearch, FaMicrophone, FaAngleUp, FaAngleDown, FaPlus, FaTimes, FaThumbsUp, FaThumbsDown } from 'react-icons/fa';

// Import uuid
import { v4 as uuidv4 } from 'uuid';

import { BlockType } from '../types/blocks';

import Slider from '@mui/material/Slider';
import QueryBuilder from './QueryBuilder';

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
    { id: 'Couleurs vives', style: 'conic-gradient(#ff5733, #ffc300, #28a745, #17a2b8, #6f42c1, #ff5733)' },
    { id: 'Couleurs sombres', style: 'conic-gradient(#4a322f, #3f522d, #2d4a4a, #2f2f4a, #4a2d4a, #4a322f)' },
    { id: 'Teinte rouge', style: 'linear-gradient(to right, rgba(255, 0, 0, 0.5), rgba(255, 0, 0, 0.8))' },
    { id: 'Teinte bleue', style: 'linear-gradient(to right, rgba(0, 0, 255, 0.5), rgba(0, 0, 255, 0.8))' },
    { id: 'Teinte verte', style: 'linear-gradient(to right, rgba(0, 255, 0, 0.5), rgba(0, 255, 0, 0.8))' },
];

const luminosities = [
    { id: 'Image sombre', color: '#000', text: 'Sombre', textColor: '#fff' },
    { id: 'Image claire', color: '#ababab', text: 'Clair', textColor: '#000' },
];

const weights = [
    {
      value: -2,
      label: "Je ne veux pas du tout voir cela",
    },
    {
      value: -1,
      label: "Je n'aimerai pas voir ca"
    },
    {
      value: 0,
      label: 'Neutre'
    },
    {
      value: 1,
      label: "J'aimerai voir ca"
    },
    {
      value: 2,
      label: "Je veux absolument voir cela"
    }
  ];

interface SearchComponent {
    loading: boolean;
    receiveQuery: (query: Query) => void;
    
    selectedTabIdentifier: string;

    queryParts: QueryPart[];
    setQueryParts: (queryParts: QueryPart[]) => void;

    updateQueryPartWeight: (identifier: string, weight: number) => void;

    resetQuery: () => void;
}

// TO EXPORT
const SearchButton: React.FC<{
    loading: boolean,
    blocks: any[],
    blocksValid: boolean,
    queryParts: QueryPart[],
    compileIntoTab: (isNewSearch: boolean) => void
}> = ({ 
    loading,
    blocks, 
    blocksValid, 
    queryParts, 
    compileIntoTab
}) => {
    const hard_valid = blocks.length > 0 && blocksValid;
    const soft_valid = blocksValid && queryParts.length > 0;
    const canSearch = !loading && (hard_valid || soft_valid);
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
    loading: boolean,
    blocks: any[],
    blocksValid: boolean,
    queryParts: QueryPart[],
    compileIntoTab: (isNewSearch: boolean) => void
}> = ({ 
    loading,
    blocks, 
    blocksValid, 
    queryParts, 
    compileIntoTab
}) => {

    const hard_valid = blocks.length > 0 && blocksValid;
    const soft_valid = blocksValid && queryParts.length > 0;
    const canSearch = !loading && (hard_valid || soft_valid);

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


//
const SearchComponent: React.FC<SearchComponent> = ({
    loading,
    receiveQuery,
    selectedTabIdentifier,
    queryParts,
    setQueryParts,
    updateQueryPartWeight,
    resetQuery
}) => {

    const [blocks, setBlocks] = useState<any[]>([]);
    const [blocksValid, setBlocksValid] = useState<boolean>(true);
    const [blocksValidMessage, setBlocksValidMessage] = useState<string>('');

    const [searchSelection, setSearchSelection] = useState<"HARD"|"SOFT">("SOFT");

    const [keywordsVisible, setKeywordsVisible] = useState<boolean>(false);
    const [localSearchTerm, setLocalSearchTerm] = useState<string>('');
    const [isAutoSearchEnabled, setIsAutoSearchEnabled] = useState<boolean>(true);

    const validateSingleBlock = (block: any) => {
        if (block.type === BlockType.AND || block.type === BlockType.OR) {
            return true;
        } else if (block.type === BlockType.EQUAL) {
            return block.column && block.column.length > 0 && block.value && block.value.length > 0;
        } else if (block.type === BlockType.BETWEEN) {
            return block.column && block.column.length > 0 && block.fromValue && block.fromValue.length > 0 && block.toValue && block.toValue.length > 0;
        } else if (block.type === BlockType.INCLUDES) {
            return block.column && block.column.length > 0 && block.values && block.values.length > 0;
        }
        return false;
    };

    const validateBlocks = () => {
        /*
            RULES: 
            AND/OR can only be placed after EQUAL, BETWEEN, or INCLUDES blocks
            EQUAL, BETWEEN, INCLUDES can only be placed after AND/OR blocks (except when it is the first block !)
            AND/OR cannot be placed last
            
            Obviously, each block must be filled with the required data
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
    }

    const updateQueryPartsFromBlocks = () => {
        const softQueryParts = queryParts.filter(q => q.isSoft);
        const hardQueryParts = blocks.map(block => {
            const isOperation = block.type === BlockType.AND || block.type === BlockType.OR;
            if (isOperation) {
                const newQueryPart : HardQueryPartOperation = {
                    identifier: uuidv4(),
                    type: block.type,
                    isSoft: false,
                    operation: block.type,
                    weight: 1
                };
                return newQueryPart;
            } else {
                const newQueryPart : HardQueryPartLeaf= {
                    identifier: uuidv4(),
                    type: block.type,
                    isSoft: false,
                    columnName: block.column,
                    weight: 1,
                    isNot: block.isNot ? true : false
                };
                if (block.type === BlockType.EQUAL) {
                    newQueryPart.equalTo = block.value;
                } else if (block.type === BlockType.BETWEEN) {
                    newQueryPart.from = block.fromValue;
                    newQueryPart.to = block.toValue;
                } else if (block.type === BlockType.INCLUDES) {
                    newQueryPart.includes = block.values;
                }
                return newQueryPart;
            }
        });
        
        const newQueryParts = [...softQueryParts, ...hardQueryParts];
        console.log(newQueryParts);
        setQueryParts(newQueryParts);
    }

    useEffect(() => {
        // Validate blocks
        validateBlocks();
    }, [blocks]);

    const toggleKeywords = () => {
        setKeywordsVisible(!keywordsVisible);
    };

    const startAudioRecording = () => {
        alert('NOT IMPLEMENTED');
        // TODO:
    }

    const addNewQueryTerm = (newQueryPart: QueryPart) => {
        newQueryPart.identifier = uuidv4();
        setQueryParts([...queryParts, newQueryPart]);
    }
    
    useEffect(() => {
        if (isAutoSearchEnabled) {
            if (queryParts.length > 0) {
                compileIntoTab(false);
            }
        }
    }, [queryParts]);

    // Manual terms
    const addTermToSearch = () => {
        if (localSearchTerm.length > 0) {
            const newQueryPart: QueryPart = {
                identifier: 'N/A',
                type: 'term',
                isSoft: true,
                term: localSearchTerm,
                weight: 1
            };
            addNewQueryTerm(newQueryPart);
            setLocalSearchTerm('');
        } else {
            alert('Veuillez entrer un terme de recherche');
        }
    }

    // Keywords
    const toggleKeyword = (keyword: string) => {
        const isEnabled = queryParts.find(q => q.type === 'keyword' && q.keyword === keyword);
        if (isEnabled) {
            setQueryParts(queryParts.filter(q => !(q.type === 'keyword' && q.keyword === keyword)));
        } else {
            const newQueryPart: QueryPart = {
                identifier: 'N/A',
                isSoft: true,
                type: 'keyword',
                keyword: keyword,
                weight: 1
            };
            addNewQueryTerm(newQueryPart);
        }
    }

    const renderKeyword = (keyword: string) => {
        const isEnabled = queryParts.find(q => q.type === 'keyword' && q.keyword === keyword);
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

    // Colors
    const toggleColor = (colorId: string) => {
        const isEnabled = queryParts.find(q => q.type === 'color' && q.color === colorId);
        if (isEnabled) {
            setQueryParts(queryParts.filter(q => !(q.type === 'color' && q.color === colorId)));
        } else {
            const newQueryPart: QueryPart = {
                identifier: 'N/A',
                isSoft: true,
                type: 'color',
                color: colorId,
                weight: 1
            };
            addNewQueryTerm(newQueryPart);
        }
    }

    const renderColor = (color: { id: string, style: string }) => {
        const isEnabled = queryParts.find(q => q.type === 'color' && q.color === color.id);
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

    // Luminosity
    const toggleLuminosity = (luminosityId: string) => {
        const isEnabled = queryParts.find(q => q.type === 'luminosity' && q.luminosity === luminosityId);
        if (isEnabled) {
            setQueryParts(queryParts.filter(q => !(q.type === 'luminosity' && q.luminosity === luminosityId)));
        } else {
            const newQueryPart: QueryPart = {
                identifier: 'N/A',
                isSoft: true,
                type: 'luminosity',
                luminosity: luminosityId,
                weight: 1
            };
            addNewQueryTerm(newQueryPart);
        }
    }

    const renderLuminosity = (luminosity: { id: string, color: string, text: string, textColor: string }) => {
        const isEnabled = queryParts.find(q => q.type === 'luminosity' && q.luminosity === luminosity.id);
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

    // Remove query part
    const removeQueryPart = (identifier: string) => {
        const userRemovingLastElement = queryParts.length === 1;
        setQueryParts(queryParts.filter(q => q.identifier !== identifier));
        if (userRemovingLastElement) {
            resetQuery();
        }
    }

    // Render queries
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

    const RenderSlider = (queryPart: QueryPart) => {
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

    const renderQueryPart = (queryPart: QueryPart) => {
        if(!queryPart.isSoft) {
            return null;
        }

        const formatType = (type: string) => {
            switch(type) {
                case 'term':
                    return 'Texte';
                case 'keyword':
                    return 'Mot-clé';
                case 'color':
                    return 'Couleur';
                case 'luminosity':
                    return 'Luminosité';
                case 'precomputed':
                    return 'Image';
                default:
                    return 'Inconnu';
            }
        }

        let imageURL;
        if (queryPart.imageInformations) {
            imageURL = "http://127.0.0.1:5000/images/" + queryPart.imageInformations["recordID"];
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
                {RenderSlider(queryPart)}
            </div>
        );
    }

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
                loading={loading}
                blocks={blocks}
                blocksValid={blocksValid}
                queryParts={queryParts}
                compileIntoTab={compileIntoTab}
            />
            <NewQueryButton 
                loading={loading}
                blocks={blocks}
                blocksValid={blocksValid}
                queryParts={queryParts}
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
                onClick={() => setSearchSelection('HARD')}
            >
                <h1>Contraintes d'exclusion</h1>
            </div>
            <div 
                className={"search-selection " + (searchSelection === 'SOFT' ? 'selected' : '')}
                onClick={() => setSearchSelection('SOFT')}
            >
                <h1>Contraintes de tri</h1>
            </div>
        </div>

        { searchSelection === 'HARD' &&
            <QueryBuilder 
                blocks={blocks}
                setBlocks={setBlocks}
                blocksValid={blocksValid}
                setBlocksValid={setBlocksValid}
                blocksValidMessage={blocksValidMessage}
                setBlocksValidMessage={setBlocksValidMessage}
            />
        }

        { searchSelection === 'SOFT' &&
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
                    { keywords.map(keyword => renderKeyword(keyword)) }    
                </div>
                }

            </div>

            {/* Search via Colors */}
            <div className="searchSection">
                <h1>Rechercher via des couleurs</h1>
                <div className="container" id="colors_container">
                    {colors.map(color => renderColor(color))}
                </div>
            </div>

            {/* Search via Luminosity */}
            <div className="searchSection">
                <h1>Rechercher via une luminosité</h1>
                <div className="container" id="luminosity_container">
                    {luminosities.map(luminosity => renderLuminosity(luminosity))}
                </div>
            </div>

            </div>

            {/* Queries Container */}
            <div className="queries">
                <div className='queryPartsHeader'>
                    <h1>Vos filtres - {selectedTabIdentifier}</h1>
                </div>
                <div className='queries_container'>
                {
                    queryParts.length > 0 
                    ? queryParts.map(queryPart => renderQueryPart(queryPart))
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
