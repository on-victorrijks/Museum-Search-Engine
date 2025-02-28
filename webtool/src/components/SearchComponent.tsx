import React, { useState } from 'react';
import '../styles/SearchComponent.css';
import { TabData } from '../types/tab';
import { QueryPart, Query } from '../types/queries';

// Use react-icons
import { FaSearch, FaMicrophone, FaAngleUp, FaAngleDown, FaPlus, FaTimes, FaThumbsUp, FaThumbsDown } from 'react-icons/fa';

// Import uuid
import { v4 as uuidv4 } from 'uuid';

import Slider from '@mui/material/Slider';

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
    receiveQuery: (query: Query) => void;
}

const SearchComponent: React.FC<SearchComponent> = ({
    receiveQuery
}) => {

    const [queryIdentifier, setQueryIdentifier] = useState<string>(uuidv4());

    const [keywordsVisible, setKeywordsVisible] = useState<boolean>(false);

    const [localSearchTerm, setLocalSearchTerm] = useState<string>('');

    const [queryParts, setQueryParts] = useState<QueryPart[]>([]);

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


    // Manual terms
    const addTermToSearch = () => {
        if (localSearchTerm.length > 0) {
            const newQueryPart: QueryPart = {
                identifier: 'N/A',
                type: 'term',
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
        console.log(queryParts);
        setQueryParts(queryParts.filter(q => q.identifier !== identifier));
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
                    onChange={(e, value) => {
                        queryPart.weight = value as number;
                    }}
                    color='primary'
                />
                <div className='side max'>
                    <FaThumbsUp />
                </div>
            </div>
        );
    }

    const renderQueryPart = (queryPart: QueryPart) => {
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
                default:
                    return 'Inconnu';
            }
        }

        return (
            <div key={queryPart.identifier} className="queryPart">
                <div className='queryPart-Header'>
                    <div className="queryPartText">
                        <h4>{formatType(queryPart.type)}</h4>
                        {queryPart.term && <h2>{queryPart.term}</h2>}
                        {queryPart.keyword && <h2>{queryPart.keyword}</h2>}
                        {queryPart.color && <h2>{queryPart.color}</h2>}
                        {queryPart.luminosity && <h2>{queryPart.luminosity}</h2>}
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
    const compileIntoTab = () => {
        const query = {
            identifier: queryIdentifier,
            parts: queryParts,
            results: null
        };
        receiveQuery(query);
    }

    const clearAll = () => {
        setQueryParts([]);
        // Modify the query identifier
        setQueryIdentifier(uuidv4());
    }

    return (
        <div className="sb-Content">
        {/* Header */}
        <div className="header">
            <img src="./src/assets/logo.svg" alt="Logo" />
        </div>

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
                <h1>Vos filtres</h1>
            </div>
            <div className='queries_container'>
            {
                queryParts.length > 0 
                ? queryParts.map(queryPart => renderQueryPart(queryPart))
                : <EmptyQueryParts />
            }
            </div>
        </div>

        {/* Buttons */}
        <div className="buttons">
            <button
                className="primary"
                onClick={compileIntoTab}
                disabled={queryParts.length === 0}
            >
                Rechercher
            </button>
            <button
                className="secondary"
                onClick={clearAll}
                disabled={queryParts.length === 0}
            >
                Réinitialiser
            </button>
        </div>

        </div>
    );
};

export default SearchComponent;
