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
import {renderKeyword, renderColor, renderLuminosity, renderSoftQueryPart, SearchButton, NewQueryButton, ClearButton, AutoSearchButton } from './SubComponents';
import { colors, luminosities } from '../../../constants/SearchPanel';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../../contexts/SettingsContext';


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

    const { t } = useTranslation();

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

            if(blocks[i].isSoft) {
                continue;
            }
            
            if(!validateSingleBlock(blocks[i])){
                valid = false;
                message = t('search.validation.blockRequired');
                break;
            }

            const block = blocks[i];
            if (lastBlock===null) {
                lastBlock = block;
                continue;
            }


            if (block.type === BlockType.AND || block.type === BlockType.OR) {
                if(i === (blocks.length - 1)) {
                    valid = false;
                    message = t('search.validation.andOrLast');
                    break;
                } else if (
                    (lastBlock === null ) || 
                    (
                        lastBlock.type !== BlockType.EQUAL 
                        && lastBlock.type !== BlockType.BETWEEN 
                        && lastBlock.type !== BlockType.INCLUDES 
                        && lastBlock.type !== BlockType.GROUP)
                ) {
                    valid = false;
                    message = t('search.validation.andOrAfter');
                    break;
                }
            } else if (block.type === BlockType.EQUAL || block.type === BlockType.BETWEEN || block.type === BlockType.INCLUDES) {
                if (
                    (lastBlock !== null && i>0) && 
                    lastBlock.type !== BlockType.AND && lastBlock.type !== BlockType.OR
                ) {
                    valid = false;
                    message = t('search.validation.equalAfter');
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
                <h1>{t('search.filters.empty')}</h1>
            </div>
        );
    }

    const compileIntoTab = (isNewSearch:boolean) => {
        let identifier = isNewSearch ? 'N/A' : selectedTabIdentifier;
        const query = {
            identifier: identifier,
            parts: isNewSearch ? [] : queryParts,
            results: null,
        };
        receiveQuery(query);
    }

    const { serverSettingsInfos } = useSettings();

    return (
        <div className="sb-Content">

        <div className="search-selections">
            <div 
                className={"search-selection " + (searchSelection === 'HARD' ? 'selected' : '')}
                onClick={() => setSearchSelection(SearchType.HARD)}
            >
                <h1>{t('search.constraints.exclusion')}</h1>
            </div>
            <div 
                className={"search-selection " + (searchSelection === 'SOFT' ? 'selected' : '')}
                onClick={() => setSearchSelection(SearchType.SOFT)}
            >
                <h1>{t('search.constraints.sorting')}</h1>
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
                <h1>{t('search.text.title')}</h1>
                <div className="textForm">
                    <input 
                        type="text" 
                        placeholder={t('search.text.placeholder')}
                        value={localSearchTerm}
                        onChange={(e) => setLocalSearchTerm(e.target.value)}
                    />
                    { false &&
                        <button
                            className='microphone'
                            onClick={() => startAudioRecording()}
                        >
                            <FaMicrophone />
                        </button>
                    }
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
                    <h1>{t('search.keywords.title')}</h1>
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
                    { serverSettingsInfos.keywords.map(keyword => renderKeyword(
                        getKeywordStatus(keyword),
                        toggleKeyword,
                        keyword
                    )) }
                </div>
                }

            </div>

            {/* Search via Colors */}
            <div className="searchSection">
                <h1>{t('search.colors.title')}</h1>
                <div className="container" id="colors_container">
                    { serverSettingsInfos.colors.map(color => renderColor(
                        getColorStatus(color),
                        toggleColor,
                        color
                    ))}
                </div>
            </div>

            {/* Search via Luminosity */}
            <div className="searchSection">
                <h1>{t('search.luminosity.title')}</h1>
                <div className="container" id="luminosity_container">
                    {serverSettingsInfos.luminosities.map(luminosity => renderLuminosity(
                        getLuminosityStatus(luminosity),
                        toggleLuminosity,
                        luminosity
                    ))}
                </div>
            </div>

            </div>

            {/* Queries Container */}
            <div className="queries">
                <div className='queryPartsHeader'>
                    <h1>{t('search.filters.title')}</h1>
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

    
        <div className="buttons">
            <SearchButton
                canSearch={blocksValid && queryParts.length > 0} 
                compileIntoTab={compileIntoTab}
                text={t('search.buttons.search')}
            />
            <NewQueryButton 
                canSearch={blocksValid && queryParts.length > 0} 
                compileIntoTab={compileIntoTab} 
                text={t('search.buttons.newQuery')}
            />
            <ClearButton
                canReset={queryParts.length > 0}
                resetQuery={resetQuery}
            />
            <AutoSearchButton
                isAutoSearchEnabled={isAutoSearchEnabled}
                setIsAutoSearchEnabled={setIsAutoSearchEnabled}
            />
        </div>

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