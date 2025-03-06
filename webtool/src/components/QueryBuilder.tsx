import React, { useState, useRef, useEffect } from 'react';

import '../styles/QueryBuilder.css';
import { FaBan, FaCheck, FaPlus, FaTrash } from 'react-icons/fa';
import { RiResetLeftFill } from 'react-icons/ri';
import axios from 'axios';

import ApiResponse from '../types/ApiResponse';

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
    ANDBlockProps,
    ORBlockProps,
    SelectionOption,
    BlockType,
    SoftQueryType,
    GroupBlockProps,
} from '../types/queries';

// Export
const BaseButtons: React.FC<HardQueryPartControlled> = ({ 
    type, 
    setBlockType, 
    onDelete
 }) => (
    <div className="qb-block-base-buttons">
        { (type===BlockType.OR) &&
        <button 
            onClick={() => setBlockType && setBlockType(BlockType.AND)} 
            className="long"
        >
            <h3>Remplacer par <b>{getFrenchType(BlockType.AND)}</b></h3>
        </button>        
        }
        { (type===BlockType.AND) &&
        <button 
            onClick={() => setBlockType && setBlockType(BlockType.OR)} 
            className="long"
        >
            <h3>Remplacer par <b>{getFrenchType(BlockType.OR)}</b></h3>
        </button>        
        }
        <button 
            onClick={onDelete} 
        >
            <FaTrash />
        </button>
    </div>
);

const isBlockDisabled = (
    type: BlockType,
    queryParts: QueryPart[]
) => {
    const hardQueryParts: HardQueryPart[] = queryParts.filter((queryPart: QueryPart) => !queryPart.isSoft) as HardQueryPart[];

    let lastBlock = null;
    if (hardQueryParts.length > 0) lastBlock = hardQueryParts[hardQueryParts.length - 1];
    const lastBlockType = lastBlock ? lastBlock.type : null;

    const RULES : Record<BlockType, (null|BlockType)[]> = {
        // Hypothesis block type: [Allowed if last block is of type]
        [BlockType.GROUP]: [null, BlockType.AND, BlockType.OR],
        [BlockType.AND]: [BlockType.EQUAL, BlockType.BETWEEN, BlockType.INCLUDES, BlockType.GROUP],
        [BlockType.OR]: [BlockType.EQUAL, BlockType.BETWEEN, BlockType.INCLUDES, BlockType.GROUP],
        [BlockType.EQUAL]: [null, BlockType.AND, BlockType.OR],
        [BlockType.BETWEEN]: [null, BlockType.AND, BlockType.OR],
        [BlockType.INCLUDES]: [null, BlockType.AND, BlockType.OR],
    }

    // Check if lastBlockType is in RULES[type]
    const RULES_FOR_TYPE : (null|BlockType)[] = RULES[type];
    return !RULES_FOR_TYPE.includes(lastBlockType as BlockType);
};

const getFrenchType = (type: BlockType) => {
    switch (type) {
        case BlockType.GROUP:
            return 'GROUPE';
        case BlockType.AND:
            return 'ET';
        case BlockType.OR:
            return 'OU';
        case BlockType.EQUAL:
            return 'ÉGAL';
        case BlockType.BETWEEN:
            return 'ENTRE';
        case BlockType.INCLUDES:
            return 'CONTIENT';
        default:
            return '';
    }
};

const BaseBlock: React.FC<HardQueryPartControlled> = ({ 
    blockType,
    
    isNot,

    setIsNot,

    exactMatch,
    setExactMatch,

    caseSensitive,
    setCaseSensitive,

    keepNull,
    setKeepNull,
}) => {
    const qbOptionsVisible = blockType===BlockType.EQUAL || blockType===BlockType.BETWEEN || blockType===BlockType.INCLUDES;

    return (
        <div className="qb-block-base">
            
            { qbOptionsVisible &&
            <div className="qb-block-base-options">
                { isNot !== undefined &&
                <div className={"qb-block-base-option " + (isNot ? "enabled" : "")} onClick={() => setIsNot && setIsNot(!isNot)}>
                    <div className="qb-block-base-option-repr">
                        {isNot ? <FaCheck /> : null}
                    </div>
                    {
                        blockType===BlockType.INCLUDES
                        ? <h5>NE (CONTIENT) PAS</h5>
                        : <h5>N'EST PAS</h5>
                    }
                </div>
                }
                { (exactMatch!==undefined && setExactMatch!==undefined) &&
                <div className={"qb-block-base-option " + (exactMatch ? "enabled" : "")} onClick={() => setExactMatch(!exactMatch)}>
                    <div className="qb-block-base-option-repr">
                        {exactMatch ? <FaCheck /> : null}
                    </div>
                    {
                        blockType===BlockType.INCLUDES
                        ? <h5>TOUS</h5>
                        : <h5>EXACTEMENT</h5>
                    }
                </div>
                }
                { (caseSensitive!==undefined && setCaseSensitive!==undefined) &&
                <div className={"qb-block-base-option " + (caseSensitive ? "enabled" : "")} onClick={() => setCaseSensitive(!caseSensitive)}>
                    <div className="qb-block-base-option-repr">
                        {caseSensitive ? <FaCheck /> : null}
                    </div>
                    <h5>SENSIBLE À LA CASSE</h5>
                </div>
                }
                { (keepNull!==undefined && setKeepNull!==undefined) &&
                <div className={"qb-block-base-option " + (keepNull ? "enabled" : "")} onClick={() => setKeepNull(!keepNull)}>
                    <div className="qb-block-base-option-repr">
                        {keepNull ? <FaCheck /> : null}
                    </div>
                    <h5>GARDER LES NULL</h5>
                </div>
                }
            </div>
            }
        
            <h4>{getFrenchType(blockType as BlockType)}</h4>
        </div>
    );
}

const SelectKey: React.FC<HardQueryPartControlled> = ({
    ...props
}) => (
    <select 
        value={props.selectedColumn?.key || ''} 
        onChange={(e) => {
            // Get the selected column with the key
            const selectedColumn = props.availableColumns?.find((col:SelectionOption) => col.key === e.target.value);
            // Update the selected column
            if(props.setSelectedColumn && selectedColumn) props.setSelectedColumn(selectedColumn);
        }}  
        className="border rounded p-1"
        >
        <option value="">Select Column</option>
        {props.availableColumns?.map((col: SelectionOption) => (
            <option key={col.key} value={col.key}>{col.userFriendlyName}</option>
        ))}
    </select>
);

const GroupBlock: React.FC<GroupBlockProps> = ({
    ...props
}) => {
    
    const createChild = (type: BlockType) => {
        const newQueryPart : HardQueryPart = {
            identifier: uuidv4(),
            type: type,
            isSoft: false,

            selectedColumn: props.availableColumns[0],
            blockType: type,
            isNot: false,
            exactMatch: false,
            caseSensitive: false,
            keepNull: false,
        };
        props.onChildAdd(newQueryPart as HardQueryPartControlled);
    }

    const receiveChildUpdate = (newChildren: QueryPart[]) => {
        props.updateBlock(props.identifier, { children: newChildren });
    }

    return (
        <div className="qb-block" block-type={BlockType.GROUP}>
            <div className="qb-block-header">
                <BaseBlock {...props} />
                <div style={{flex: 1}}></div>
                <BaseButtons {...props} />
            </div>  
            <div className="qt-blocks" style={{width: '100%'}}>
                {Object.values(BlockType).map(type => (
                    <button
                        key={type}
                        block-type={type}
                        onClick={() => createChild(type)}
                        disabled={isBlockDisabled(type, props.children)}
                    >
                        <h3>{getFrenchType(type)}</h3>
                    </button>
                ))}
            </div>
            <div className="qb-block-group-children">
                {props.children.length === 0 && 
                <div className="qb-block-group-children-empty">
                    <h3>Aucune contrainte</h3>
                </div>
                }
                {props.children.map((child: QueryPart) => {
                    return props.renderBlock(
                        props.children,
                        receiveChildUpdate,
                        child as HardQueryPartControlled
                    );
                })}
            </div>
        </div>
    );
}

const EqualBlock: React.FC<EqualBlockProps> = ({
    ...props
}) => {
    const input_id = `input-${props.identifier}`;
    return (
        <div className="qb-block" block-type={BlockType.EQUAL}>
            <div className="qb-block-header">
                <SelectKey {...props} />
                <BaseBlock {...props} />
                <BaseButtons {...props} />
            </div>
            <div className="qb-block-content">

                <div className={"qb-block-input " + (props.autocompleteLoading ? "loading" : "")}>
                    <div className="qb-block-input-br">
                        <input 
                            type="text" 
                            value={props.equalTo}
                            onChange={(e) => {
                                // Change the input's value
                                props.setEqualTo(e.target.value);
                                // Query the API for autocomplete
                                if (props.selectedColumn && props.queryAPIForAutocomplete) {
                                    props.queryAPIForAutocomplete(props.selectedColumn.key, e.target.value);
                                }
                            }}
                            placeholder="Valeur"
                            disabled={props.inputDisabled}
                            onFocus={() => {
                                if(props.setLastFocusedInputID) props.setLastFocusedInputID(input_id);
                            }}
                        />
                    </div>

                    { (props.renderAutocomplete && input_id==props.lastFocusedInputID) &&
                    <div className="autocomplete-container">
                    { 
                        props.autocompleteLoading
                        ? <div className="autocomplete-loading">Chargement...</div>
                        : <>
                            {props.autocomplete && props.autocomplete.map((option, index) => (
                                <div 
                                    key={"autocomplete-" + index} 
                                    className="autocomplete-option"
                                    onClick={() => {
                                        props.setEqualTo(option.toString());
                                        if(props.resetAutocomplete) props.resetAutocomplete();
                                    }}
                                >
                                    <h3 is-autocomplete-option="true">{option}</h3>
                                </div>
                            ))}
                        </>
                    }                
                    </div>
                    }
                </div>

            </div>
        </div>
    );
};

const BetweenBlock: React.FC<BetweenBlockProps> = ({
    ...props
}) => {
    const input_before_id = `input-before-${props.identifier}`;
    const input_after_id = `input-after-${props.identifier}`;
    return (
        <div className="qb-block" block-type={BlockType.BETWEEN}>
            <div className="qb-block-header">
                <SelectKey {...props} />
                <BaseBlock {...props} />
                <BaseButtons {...props} />
            </div>

            <div className="qb-block-content">

                <div className={"qb-block-input " + (props.autocompleteLoading ? "loading" : "")}>
                    <div className="qb-block-input-br">
                        <div className="qb-block-input-br-prefix">
                            <h3>{">="}</h3>
                        </div>
                        <input 
                            type="text" 
                            value={props.from}
                            onChange={(e) => {
                                props.onFromValueChange(e.target.value);
                                if (props.selectedColumn && props.queryAPIForAutocomplete) {
                                    props.queryAPIForAutocomplete(props.selectedColumn.key, e.target.value);
                                }
                            }}
                            placeholder="Valeur"
                            disabled={props.inputDisabled}
                            onFocus={() => {
                                if(props.setLastFocusedInputID) props.setLastFocusedInputID(input_before_id);
                            }}
                        />
                    </div>

                    { (props.renderAutocomplete && props.lastFocusedInputID==input_before_id) &&
                    <div className="autocomplete-container">
                    { 
                        props.autocompleteLoading
                        ? <div className="autocomplete-loading">Chargement...</div>
                        : <>
                            {props.autocomplete && props.autocomplete.map((option, index) => (
                                <div 
                                    key={"autocomplete-" + index} 
                                    className="autocomplete-option"
                                    onClick={() => {
                                        props.onFromValueChange(option.toString());
                                        if(props.resetAutocomplete) props.resetAutocomplete();
                                    }}
                                >
                                    <h3 is-autocomplete-option="true">{option}</h3>
                                </div>
                            ))}
                        </>
                    }                
                    </div>
                    }
                </div>

                <div className={"qb-block-input " + (props.autocompleteLoading ? "loading" : "")}>
                    <div className="qb-block-input-br">
                        <div className="qb-block-input-br-prefix">
                            <h3>{"<="}</h3>
                        </div>
                        <input 
                            type="text" 
                            value={props.to}
                            onChange={(e) => {
                                props.onToValueChange(e.target.value);
                                if (props.selectedColumn && props.queryAPIForAutocomplete) {
                                    props.queryAPIForAutocomplete(props.selectedColumn.key, e.target.value);
                                }
                            }}
                            placeholder="Valeur"
                            disabled={props.inputDisabled}
                            onFocus={() => {
                                if(props.setLastFocusedInputID) props.setLastFocusedInputID(input_after_id);
                            }}
                        />
                    </div>

                    { (props.renderAutocomplete && props.lastFocusedInputID==input_after_id) &&
                    <div className="autocomplete-container">
                    { 
                        props.autocompleteLoading
                        ? <div className="autocomplete-loading">Chargement...</div>
                        : <>
                            {props.autocomplete && props.autocomplete.map((option, index) => (
                                <div 
                                    key={"autocomplete-" + index} 
                                    className="autocomplete-option"
                                    onClick={() => {
                                        props.onToValueChange(option.toString());
                                        if(props.resetAutocomplete) props.resetAutocomplete();
                                    }}
                                >
                                    <h3 is-autocomplete-option="true">{option}</h3>
                                </div>
                            ))}
                        </>
                    }                
                    </div>
                    }

                </div>

            </div>
        </div>
    );
}

const IncludesBlock: React.FC<IncludesBlockProps> = ({
    ...props
}) => {
    const input_id = `input-${props.identifier}`;
    return (
        <div className="qb-block" block-type={BlockType.INCLUDES}>

            <div className="qb-block-header">
                <SelectKey {...props} />
                <BaseBlock {...props} />
                <BaseButtons {...props} />
            </div>

            <div className="qb-block-content">

                <div className="qd-block-row">
                    <div className={"qb-block-input " + (props.autocompleteLoading ? "loading" : "")}>
                        <div className="qb-block-input-br">
                            <input 
                                type="text" 
                                value={props.currentValue}
                                onChange={(e) => {
                                    props.onCurrentValueChange(e.target.value);
                                    if (props.selectedColumn && props.queryAPIForAutocomplete) {
                                        props.queryAPIForAutocomplete(props.selectedColumn.key, e.target.value);
                                    }
                                }}
                                placeholder="Valeur"
                                disabled={props.inputDisabled}
                                onFocus={() => {
                                    if(props.setLastFocusedInputID) props.setLastFocusedInputID(input_id);
                                }}
                            />
                            <button 
                                onClick={() => props.onValueAdd(props.currentValue)}
                                disabled={props.currentValue.length === 0}
                            >
                                <FaPlus />
                            </button>
                        </div>

                        { (props.renderAutocomplete && props.lastFocusedInputID==input_id) &&
                        <div className="autocomplete-container">
                        { 
                            props.autocompleteLoading
                            ? <div className="autocomplete-loading">Chargement...</div>
                            : <>
                                {props.autocomplete && props.autocomplete.map((option, index) => (
                                    <div 
                                        key={"autocomplete-" + index} 
                                        className="autocomplete-option"
                                        onClick={() => {
                                            props.onCurrentValueChange(option.toString());
                                            if(props.resetAutocomplete) props.resetAutocomplete();
                                        }}
                                    >
                                        <h3 is-autocomplete-option="true">{option}</h3>
                                    </div>
                                ))}
                            </>
                        }                
                        </div>
                        }

                    </div>

                </div>

                <div className="qd-block-row">
                    <div className="qb-block-values">
                        { props.values.length === 0 && <h4>Aucune valeur</h4>}
                        { props.values.map((value, index) => (
                            <div key={index} className="qb-block-value">
                                <h4>{value}</h4>
                                <button onClick={() => props.onValueRemove(value)}>
                                    <FaTrash />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

const ANDBlock: React.FC<ANDBlockProps> = ({ ...props }) => (
    <div className="qb-block-operation" block-type={BlockType.AND}>
        <BaseBlock {...props} blockType={BlockType.AND} type={BlockType.AND}/>
        <BaseButtons {...props} blockType={BlockType.AND} type={BlockType.AND}/>
    </div>
);

const ORBlock: React.FC<ORBlockProps> = ({ ...props }) => (
    <div className="qb-block-operation" block-type={BlockType.OR}>
        <BaseBlock {...props} blockType={BlockType.OR} type={BlockType.OR}/>
        <BaseButtons {...props} blockType={BlockType.OR} type={BlockType.OR}/>
    </div>
);

const getColumns = async (
    setAvailableColumns: (columns: SelectionOption[]) => void,
    setColumnsLoaded: (loaded: boolean) => void
) => {
    try {
        const response = await axios.get("http://127.0.0.1:5000/api/search/v2/get_columns", {
            headers: {
            'Content-Type': 'application/json',
            },
        });
    
        // Parse response.data as JSON
        const data: ApiResponse = response.data;
        const success = data["success"];
        if (!success) throw new Error(data["message"] ? data["message"].toString() : "An error occurred");
        const results = data["message"];
        setAvailableColumns(results ? results["columns"] : []);
    } catch (error) {
        console.error("Error making POST request:", error);
        return { success: false, message: "An error occurred" };
    } finally {
        setColumnsLoaded(true);
    }
};
const queryAPIForAutocomplete = async (
    setAutocomplete: (options: string[]) => void,
    setAutocompleteLoading: (loading: boolean) => void,
    key: string,
    query: string
) => {
    if(!key || !query || key === '' || query === '') return;
    setAutocompleteLoading(true);

    try {
        const response = await axios.post("http://127.0.0.1:5000/api/search/v2/autocomplete", {
            key,
            query
        }, {
            headers: {
            'Content-Type': 'application/json',
            },
        });
    
        // Parse response.data as JSON
        const data: ApiResponse = response.data;
        const success = data["success"];
        if (!success) throw new Error(data["message"] ? data["message"].toString() : "An error occurred");        
        setAutocomplete(data["message"] ? data["message"]["results"] : []);
    } catch (error) {
        console.error("Error making POST request:", error);
        return { success: false, message: "An error occurred" };
    } finally {
        setAutocompleteLoading(false);
    }
}

const QueryBuilder: React.FC<{
    queryParts: QueryPart[];
    setQueryParts: (queryParts: QueryPart[]) => void;
    blocksValid: boolean;
    blocksValidMessage: string;
}> = ({
    queryParts,
    setQueryParts,
    blocksValid,
    blocksValidMessage,
}) => {

    const [columnsLoaded, setColumnsLoaded] = useState<boolean>(false);
    const [availableColumns, setAvailableColumns] = useState<SelectionOption[]>([]);

    const [autocomplete, setAutocomplete] = useState<string[]>([]);
    const [autocompleteLoading, setAutocompleteLoading] = useState<boolean>(false);
    const [lastFocusedInputID, setLastFocusedInputID] = useState<string>('');
    const wrapperRef = useRef<HTMLDivElement>(null); // Replace HTMLDivElement with the correct type

    useEffect(() => {
        if (!columnsLoaded) getColumns(setAvailableColumns, setColumnsLoaded);
    }, [columnsLoaded]);

    // Handle click outside of the autocomplete
    const handleClickOutside = (
        event: MouseEvent
    ) => {
        const target = event.target as Node;
        const is_auto_option = target instanceof HTMLElement && target.getAttribute('is-autocomplete-option');
        if (wrapperRef.current && !is_auto_option) {
            setAutocomplete([]);
        }
    };
    React.useEffect(() => {
        document.addEventListener('click', handleClickOutside, true);
        return () => {
            document.removeEventListener('click', handleClickOutside, true);
        };
    }, []);

    const renderBlock = (
        parents: QueryPart[],
        setParents: (parents: QueryPart[]) => void,
        queryPart: HardQueryPartControlled
    ) => {
        const updateBlock = (
            identifier: string,
            newData: Record<string, any>
        ) => {
            setParents(parents.map((local_queryPart: QueryPart) => {
                if(local_queryPart.identifier === identifier) {
                    return {
                        ...local_queryPart,
                        ...newData
                    }
                }
                return local_queryPart;
            }));
        };

        const commonProps = {
            ...queryPart,
            updateBlock: updateBlock,
            onDelete: () => {
                setParents(parents.filter((part: QueryPart) => part.identifier !== queryPart.identifier));
            },
            setKey: (key: string) => {
                const selectedColumn = availableColumns.find((col: SelectionOption) => col.key === key);
                if (selectedColumn && queryPart.setSelectedColumn) {
                    queryPart.setSelectedColumn(selectedColumn);
                }
                updateBlock(queryPart.identifier, { selectedColumn });
            },
            setBlockType: (type: BlockType) => updateBlock(queryPart.identifier, { type }),
            setIsNot: (isNot: boolean) => updateBlock(queryPart.identifier, { isNot }),
            setExactMatch: (exactMatch: boolean) => updateBlock(queryPart.identifier, { exactMatch }),
            setCaseSensitive: (caseSensitive: boolean) => updateBlock(queryPart.identifier, { caseSensitive }),
            setKeepNull: (keepNull: boolean) => updateBlock(queryPart.identifier, { keepNull }),
            availableColumns,
            setSelectedColumn: (column: SelectionOption) => updateBlock(queryPart.identifier, { selectedColumn: column }),
            resetAutocomplete: () => {
                setAutocomplete([]);
            },
            autocomplete: autocomplete,
            autocompleteLoading: autocompleteLoading,
            queryAPIForAutocomplete: (key: string, query: string|number) => queryAPIForAutocomplete(setAutocomplete, setAutocompleteLoading, key, query.toString()),
            lastFocusedInputID: lastFocusedInputID,
            setLastFocusedInputID: setLastFocusedInputID,
        };

        let userSelectedColumn = false;
        let inputEmpty = false;

        switch (queryPart.type) {
            case BlockType.GROUP:

                const deleteChildrenFromGroup = (childIdentifier: string) => {
                    // TODO: Handle recursive deletion
                }

                const queryPart_GROUP = (queryPart as GroupBlockProps);
                return (
                    <GroupBlock
                        {...commonProps}
                        blockType={BlockType.GROUP}
                        children={queryPart_GROUP.children || []}
                        onChildAdd={(child: QueryPart) => updateBlock(queryPart.identifier, { children: [...(queryPart_GROUP.children || []), child] })}
                        onChildDelete={deleteChildrenFromGroup}
                        renderBlock={renderBlock}
                        isBlockDisabled={isBlockDisabled}
                    />
                );
            case BlockType.EQUAL:
                const queryPart_EQUAL = (queryPart as EqualBlockProps);
                userSelectedColumn = queryPart_EQUAL.selectedColumn!==undefined;
                inputEmpty = (queryPart_EQUAL.equalTo || '').length === 0;
                return (
                    <EqualBlock
                        {...commonProps}
                        inputDisabled={!userSelectedColumn}
                        renderAutocomplete={userSelectedColumn && !inputEmpty}
                        blockType={BlockType.EQUAL}
                        equalTo={queryPart.equalTo || ''}
                        setEqualTo={(equalTo: string) => commonProps.updateBlock(queryPart.identifier, {equalTo})}
                    />
                );
            case BlockType.BETWEEN:
                const queryPart_BETWEEN = (queryPart as BetweenBlockProps);
                userSelectedColumn = queryPart_BETWEEN.selectedColumn!==undefined;
                let inputEmpty_from = (queryPart_BETWEEN.from || '').length === 0;
                let inputEmpty_to = (queryPart_BETWEEN.to || '').length === 0;
                inputEmpty = inputEmpty_from && inputEmpty_to;

                return (
                    <BetweenBlock
                        {...commonProps}
                        inputDisabled={!userSelectedColumn}
                        renderAutocomplete={userSelectedColumn && (inputEmpty_from || inputEmpty_to)}
                        blockType={BlockType.BETWEEN}
                        from={queryPart_BETWEEN.from || ''}
                        to={queryPart_BETWEEN.to || ''}
                        onFromValueChange={(from: string) => commonProps.updateBlock(queryPart.identifier, {from})}
                        onToValueChange={(to: string) => commonProps.updateBlock(queryPart.identifier, {to})}
                    />
                );
            case BlockType.INCLUDES:
                const queryPart_INCLUDES = (queryPart as IncludesBlockProps);
                userSelectedColumn = queryPart_INCLUDES.selectedColumn!==undefined;
                inputEmpty = (queryPart_INCLUDES.currentValue || '').length === 0;
                
                return (
                    <IncludesBlock
                        {...commonProps}
                        blockType={BlockType.INCLUDES}
                        values={queryPart_INCLUDES.values || []}
                        currentValue={queryPart_INCLUDES.currentValue || ''}
                        onValueAdd={(value: string) => updateBlock(queryPart.identifier, { values: [...(queryPart_INCLUDES.values || []), value], currentValue: '' })}
                        onValueRemove={(value: string) => updateBlock(queryPart.identifier, { values: (queryPart_INCLUDES.values || []).filter((v: string) => v !== value) })}
                        onCurrentValueChange={(currentValue: string) => updateBlock(queryPart.identifier, { currentValue })}
                        isNot={queryPart_INCLUDES.isNot}
                        inputDisabled={!userSelectedColumn}
                        renderAutocomplete={userSelectedColumn && !inputEmpty}
                    />
                );
            case BlockType.AND:
                return (
                    <ANDBlock 
                        {...commonProps}
                        blockType={BlockType.AND}
                    />
                );
            case BlockType.OR:
                return (
                    <ORBlock 
                        {...commonProps}
                        blockType={BlockType.OR}
                    />
                );
            default:
                return <></>
        }
    };

    const createNewBlock = (type: BlockType) => {
        if(!availableColumns || availableColumns.length === 0) return;
        const newQueryPart : HardQueryPart = {
            identifier: uuidv4(),
            type: type,
            isSoft: false,

            selectedColumn: availableColumns[0],
            blockType: type,
            isNot: false,
            exactMatch: false,
            caseSensitive: false,
            keepNull: false,
        };
        setQueryParts([...queryParts, newQueryPart]);
    }

    return (
        <div className="query-builder" ref={wrapperRef}>
        <div className="qb-blocks-selector">
            <div className="qt-tools">
                { blocksValid
                    ? 
                    <div className="qt-verif valid">
                        <div className="qt-verif-header">
                            <div className="qt-verif-icon"><FaCheck /></div>
                            <h3>Votre contrainte est valide</h3>
                        </div>
                    </div>
                    :
                    <div className="qt-verif invalid">
                        <div className="qt-verif-header">
                            <div className="qt-verif-icon"><FaBan /></div>
                            <h3>Votre contrainte est invalide</h3>
                        </div>
                        <div className="qt-verif-content">
                            <h4>{blocksValidMessage}</h4>
                        </div>
                    </div>
                }
                <button
                    onClick={() => setQueryParts(queryParts.filter((queryPart: QueryPart) => queryPart.isSoft))}
                >
                    <div className="qt-tool-icon"><RiResetLeftFill /></div>
                </button>
            </div>
            <div className='qt-blocks'>
                {Object.values(BlockType).map(type => (
                    <button
                        key={type}
                        block-type={type}
                        onClick={() => createNewBlock(type)}
                        disabled={isBlockDisabled(type, queryParts)}
                    >   
                        <h3>{getFrenchType(type)}</h3>
                    </button>
                ))}
            </div>
        </div>

        <div className="qb-conditions">
            { columnsLoaded
            ? queryParts.map((queryPart: QueryPart) => {
                if(queryPart.isSoft) return null;
                return renderBlock(
                    queryParts,
                    setQueryParts,
                    queryPart as HardQueryPartControlled
                );
            })
            : 
            <div className="qb-loading">
                <h3>Chargement des colonnes...</h3>
            </div>
            }
        </div>
        </div>
    );
};

export default QueryBuilder;