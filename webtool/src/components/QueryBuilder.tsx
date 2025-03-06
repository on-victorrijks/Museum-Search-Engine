import React, { useState, useRef, useEffect } from 'react';

import '../styles/QueryBuilder.css';
import { FaBan, FaCheck, FaPlus, FaTrash } from 'react-icons/fa';
import { RiResetLeftFill } from 'react-icons/ri';
import axios from 'axios';

import {
    BlockType,
    BaseBlockProps,
    EqualBlockProps,
    BetweenBlockProps,
    IncludesBlockProps
} from '../types/blocks';
import ApiResponse from '../types/ApiResponse';

const BaseButtons: React.FC<BaseBlockProps> = ({ type, isNot, onToggleNot, onDelete, changeBlockType }) => (
    <div className="qb-block-base-buttons">
        { (type===BlockType.OR) &&
        <button 
            onClick={() => changeBlockType(BlockType.AND)} 
            className="long"
        >
            <h3>Remplacer par <b>{getFrenchType(BlockType.AND)}</b></h3>
        </button>        
        }
        { (type===BlockType.AND) &&
        <button 
            onClick={() => changeBlockType(BlockType.OR)} 
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

const getFrenchType = (type: BlockType) => {
    switch (type) {
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

const BaseBlock: React.FC<BaseBlockProps> = ({ 
  type, 
  isNot, 
  onToggleNot 
}) => (
  <div className="qb-block-base">

    { isNot !== undefined &&
    <div className={"qb-block-base-not " + (isNot ? "enabled" : "")} onClick={onToggleNot}>
        <div className="qb-block-base-not-repr">
            {isNot ? <FaBan /> : null}
        </div>
        {
            type===BlockType.INCLUDES
            ? <h5>NE (CONTIENT) PAS</h5>
            : <h5>N'EST PAS</h5>
        }
    </div>
    }

    <h4>{getFrenchType(type)}</h4>
  </div>
);

const selectOptionComponent = (
    availableColumns: string[], 
    selectedColumn: string | undefined, 
    onColumnChange: (column: string) => void
) => (
    <select 
          value={selectedColumn || ''} 
          onChange={(e) => onColumnChange(e.target.value)}
          className="border rounded p-1"
        >
          <option value="">Select Column</option>
          {availableColumns.map(col => (
            <option key={col} value={col}>{col}</option>
          ))}
    </select>
);

const EqualBlock: React.FC<EqualBlockProps> = ({
    identifier,
    availableColumns,
    selectedColumn,
    onColumnChange,
    value,
    onValueChange,
    inputDisabled,
    renderAutocomplete,
    autocomplete,
    autocompleteLoading,
    queryAPIForAutocomplete,
    resetAutocomplete,
    lastFocusedInputID,
    setLastFocusedInputID,
    ...baseProps
}) => {
    const input_id = `input-${identifier}`;
    return (
        <div className="qb-block" block-type={BlockType.EQUAL}>
            <div className="qb-block-header">
                {selectOptionComponent(availableColumns, selectedColumn, onColumnChange)}
                <BaseBlock {...baseProps} />
                <BaseButtons {...baseProps} />
            </div>
            <div className="qb-block-content">

                <div className={"qb-block-input " + (autocompleteLoading ? "loading" : "")}>
                    <div className="qb-block-input-br">
                        <input 
                            type="text" 
                            value={value}
                            onChange={(e) => {
                                onValueChange(e.target.value);
                                queryAPIForAutocomplete(selectedColumn || '', e.target.value);
                            }}
                            placeholder="Valeur"
                            disabled={inputDisabled}
                            onFocus={() => setLastFocusedInputID(input_id)}
                        />
                    </div>

                    { (renderAutocomplete && input_id==lastFocusedInputID) &&
                    <div className="autocomplete-container">
                    { 
                        autocompleteLoading
                        ? <div className="autocomplete-loading">Chargement...</div>
                        : <>
                            {autocomplete.map((option, index) => (
                                <div 
                                    key={"autocomplete-" + index} 
                                    className="autocomplete-option"
                                    onClick={() => {
                                        onValueChange(option);
                                        resetAutocomplete();
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
    identifier,
    availableColumns,
    selectedColumn,
    onColumnChange,
    fromValue,
    toValue,
    onFromValueChange,
    onToValueChange,
    inputDisabled,
    renderAutocomplete,
    autocomplete,
    autocompleteLoading,
    queryAPIForAutocomplete,
    resetAutocomplete,
    lastFocusedInputID,
    setLastFocusedInputID,
    ...baseProps
}) => {
    const input_before_id = `input-before-${identifier}`;
    const input_after_id = `input-after-${identifier}`;
    return (
        <div className="qb-block" block-type={BlockType.BETWEEN}>
            <div className="qb-block-header">
                {selectOptionComponent(availableColumns, selectedColumn, onColumnChange)}
                <BaseBlock {...baseProps} />
                <BaseButtons {...baseProps} />
            </div>

            <div className="qb-block-content">

                <div className={"qb-block-input " + (autocompleteLoading ? "loading" : "")}>
                    <div className="qb-block-input-br">
                        <div className="qb-block-input-br-prefix">
                            <h3>{">="}</h3>
                        </div>
                        <input 
                            type="text" 
                            value={fromValue}
                            onChange={(e) => {
                                onFromValueChange(e.target.value);
                                queryAPIForAutocomplete(selectedColumn || '', e.target.value);
                            }}
                            placeholder="Valeur"
                            disabled={inputDisabled}
                            onFocus={() => setLastFocusedInputID(input_before_id)}
                        />
                    </div>

                    { (renderAutocomplete && lastFocusedInputID==input_before_id) &&
                    <div className="autocomplete-container">
                    { 
                        autocompleteLoading
                        ? <div className="autocomplete-loading">Chargement...</div>
                        : <>
                            {autocomplete.map((option, index) => (
                                <div 
                                    key={"autocomplete-" + index} 
                                    className="autocomplete-option"
                                    onClick={() => {
                                        onFromValueChange(option);
                                        resetAutocomplete();
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

                <div className={"qb-block-input " + (autocompleteLoading ? "loading" : "")}>
                    <div className="qb-block-input-br">
                        <div className="qb-block-input-br-prefix">
                            <h3>{"<="}</h3>
                        </div>
                        <input 
                            type="text" 
                            value={toValue}
                            onChange={(e) => {
                                onToValueChange(e.target.value);
                                queryAPIForAutocomplete(selectedColumn || '', e.target.value);
                            }}
                            placeholder="Valeur"
                            disabled={inputDisabled}
                            onFocus={() => setLastFocusedInputID(input_after_id)}
                        />
                    </div>

                    { (renderAutocomplete && lastFocusedInputID==input_after_id) &&
                    <div className="autocomplete-container">
                    { 
                        autocompleteLoading
                        ? <div className="autocomplete-loading">Chargement...</div>
                        : <>
                            {autocomplete.map((option, index) => (
                                <div 
                                    key={"autocomplete-" + index} 
                                    className="autocomplete-option"
                                    onClick={() => {
                                        onToValueChange(option);
                                        resetAutocomplete();
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
    identifier,
    availableColumns,
    selectedColumn,
    onColumnChange,
    values,
    currentValue,
    onValueAdd,
    onValueRemove,
    onCurrentValueChange,
    inputDisabled,
    renderAutocomplete,
    autocomplete,
    autocompleteLoading,
    queryAPIForAutocomplete,
    resetAutocomplete,
    lastFocusedInputID,
    setLastFocusedInputID,
    ...baseProps
}) => {
    const input_id = `input-${identifier}`;
    return (
        <div className="qb-block" block-type={BlockType.INCLUDES}>

            <div className="qb-block-header">
                {selectOptionComponent(availableColumns, selectedColumn, onColumnChange)}
                <BaseBlock {...baseProps} />
                <BaseButtons {...baseProps} />
            </div>

            <div className="qb-block-content">

                <div className="qd-block-row">
                    <div className={"qb-block-input " + (autocompleteLoading ? "loading" : "")}>
                        <div className="qb-block-input-br">
                            <input 
                                type="text" 
                                value={currentValue}
                                onChange={(e) => {
                                    onCurrentValueChange(e.target.value);
                                    queryAPIForAutocomplete(selectedColumn || '', e.target.value);
                                    setLastFocusedInputID(input_id);
                                }}
                                placeholder="Valeur"
                                disabled={inputDisabled}
                            />
                            <button 
                                onClick={() => onValueAdd(currentValue)}
                                disabled={currentValue.length === 0}
                            >
                                <FaPlus />
                            </button>
                        </div>

                        { (renderAutocomplete && lastFocusedInputID==input_id) &&
                        <div className="autocomplete-container">
                        { 
                            autocompleteLoading
                            ? <div className="autocomplete-loading">Chargement...</div>
                            : <>
                                {autocomplete.map((option, index) => (
                                    <div 
                                        key={"autocomplete-" + index} 
                                        className="autocomplete-option"
                                        onClick={() => {
                                            onValueAdd(option);
                                            resetAutocomplete();
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
                        { values.length === 0 && <h4>Aucune valeur</h4>}
                        {values.map((value, index) => (
                            <div key={index} className="qb-block-value">
                                <h4>{value}</h4>
                                <button onClick={() => onValueRemove(value)}><FaTrash /></button>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

const OperationBlock: React.FC<BaseBlockProps> = ({ ...baseProps }) => (
    <div className="qb-block-operation" block-type={baseProps.type}>
        <BaseBlock {...baseProps} />
        <BaseButtons {...baseProps}/>
    </div>
);

const QueryBuilder: React.FC<{
    blocks: any[];
    setBlocks: (blocks: any[]) => void;
    blocksValid: boolean;
    setBlocksValid: (valid: boolean) => void;
    blocksValidMessage: string;
    setBlocksValidMessage: (message: string) => void;
}> = ({
    blocks,
    setBlocks,
    blocksValid,
    setBlocksValid,
    blocksValidMessage,
    setBlocksValidMessage
}) => {

    //const [blocks, setBlocks] = useState<any[]>([]);
    const [columnsLoaded, setColumnsLoaded] = useState<boolean>(false);
    const [availableColumns, setAvailableColumns] = useState<string[]>([]);
    const autocompleteOptions = ['New York', 'Los Angeles', 'Chicago', 'Houston'];

    const [autocomplete, setAutocomplete] = useState<string[]>([]);
    const [autocompleteLoading, setAutocompleteLoading] = useState<boolean>(false);
    const [lastFocusedInputID, setLastFocusedInputID] = useState<string>('');
    const wrapperRef = useRef<HTMLDivElement>(null); // Replace HTMLDivElement with the correct type


    useEffect(() => {
        if (!columnsLoaded) {
            getColumns();
        }
    }, [columnsLoaded]);

    const getColumns = async () => {
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

  const addBlock = (type: BlockType) => {
    const newBlock = {
      id: Date.now(),
      type,
      isNot: false,
    };

    if (type === BlockType.AND || type === BlockType.OR) {
      const lastBlock = blocks[blocks.length - 1];
      const validBlockTypes = [BlockType.EQUAL, BlockType.BETWEEN, BlockType.INCLUDES];
      if (!lastBlock || !validBlockTypes.includes(lastBlock.type)) {
        alert('AND/OR can only be placed after EQUAL, BETWEEN, or INCLUDES blocks');
        return;
      }
    }

    setBlocks([...blocks, newBlock]);
  };

  const updateBlock = (id: number, updates: Partial<any>) => {
    setBlocks(blocks.map(block => 
      block.id === id ? { ...block, ...updates } : block
    ));
  };

  const deleteBlock = (id: number) => {
    // Delete the block with the given id
    // If by deleting this block we have the first block being AND/OR, we remove it also
    const newBlocks : any[] = [];
    blocks.forEach((block) => {
        if (block.id !== id) {
            const isAND_OR = block.type === BlockType.AND || block.type === BlockType.OR;
            if(newBlocks.length === 0 && isAND_OR) return; // Skip the first AND/OR block
            newBlocks.push(block);
        }
    });
    setBlocks(newBlocks);
  };

  /* AAA */

    const queryAPIForAutocomplete = async (
        columnName: string,
        query: string
    ) => {
        if(columnName === '' || query === '') return;
        
        // Simulate API call
        setAutocompleteLoading(true);
        await new Promise(resolve => setTimeout(resolve, 500));
        setAutocomplete([
            `${columnName}+${query}1`,
            `${columnName}+${query}2`,
            `${columnName}+${query}3`,
            `${columnName}+${query}4`,
            `${columnName}+${query}5`,
        ]);
        setAutocompleteLoading(false);
    }

    const resetAutocomplete = () => {
        setAutocomplete([]);
    }

  const renderBlock = (block: any) => {
    const commonProps = {
      key: block.id, // This causes an issue, but it's fine for now
      onToggleNot: () => updateBlock(block.id, { isNot: !block.isNot }),
      onDelete: () => deleteBlock(block.id),
    };

    switch (block.type) {
      case BlockType.EQUAL:
        return (
          <EqualBlock
            {...commonProps}
            identifier={block.id}
            type={BlockType.EQUAL}
            availableColumns={availableColumns}
            selectedColumn={block.column}
            onColumnChange={(column) => {
                resetAutocomplete();
                updateBlock(block.id, { column, value: '' });
            }}
            value={block.value || ''}
            onValueChange={(value) => updateBlock(block.id, { value })}
            isNot={block.isNot}

            inputDisabled={block.column === undefined}
            renderAutocomplete={block.value && block.value.length > 0 && block.column && block.column.length > 0}
            autocomplete={autocomplete}
            autocompleteLoading={autocompleteLoading}
            queryAPIForAutocomplete={queryAPIForAutocomplete}
            resetAutocomplete={resetAutocomplete}
            lastFocusedInputID={lastFocusedInputID}
            setLastFocusedInputID={setLastFocusedInputID}
            changeBlockType={(type: BlockType) => {}}
          />
        );
      case BlockType.BETWEEN:
        return (
          <BetweenBlock
            {...commonProps}
            identifier={block.id}
            type={BlockType.BETWEEN}
            availableColumns={availableColumns}
            selectedColumn={block.column}
            onColumnChange={(column) => {
                resetAutocomplete();
                updateBlock(block.id, { column, fromValue: '', toValue: '' });
            }}
            fromValue={block.fromValue || ''}
            toValue={block.toValue || ''}
            onFromValueChange={(fromValue) => updateBlock(block.id, { fromValue })}
            onToValueChange={(toValue) => updateBlock(block.id, { toValue })}
            isNot={block.isNot}

            inputDisabled={block.column === undefined}
            renderAutocomplete={
                (block.fromValue && block.fromValue.length > 0 && block.column && block.column.length > 0) ||
                (block.toValue && block.toValue.length > 0 && block.column && block.column.length > 0)
            }
            autocomplete={autocomplete}
            autocompleteLoading={autocompleteLoading}
            queryAPIForAutocomplete={queryAPIForAutocomplete}
            resetAutocomplete={resetAutocomplete}
            lastFocusedInputID={lastFocusedInputID}
            setLastFocusedInputID={setLastFocusedInputID}
            changeBlockType={(type: BlockType) => {}}
          />
        );
      case BlockType.INCLUDES:
        return (
          <IncludesBlock
            {...commonProps}
            identifier={block.id}
            type={BlockType.INCLUDES}
            availableColumns={availableColumns}
            selectedColumn={block.column}
            onColumnChange={(column) => updateBlock(block.id, { column, values: [], currentValue: '' })}
            values={block.values || []}
            currentValue={block.currentValue || ''}
            onValueAdd={(value) => updateBlock(block.id, { 
                values: [...(block.values || []), value],
                currentValue: ''
            })}
            onValueRemove={(value) => updateBlock(block.id, { 
              values: (block.values || []).filter((v: string) => v !== value) 
            })}
            onCurrentValueChange={(currentValue) => updateBlock(block.id, { currentValue })}
            autocompleteOptions={autocompleteOptions}
            isNot={block.isNot}

            inputDisabled={block.column === undefined}
            renderAutocomplete={block.currentValue && block.currentValue.length > 0 && block.column && block.column.length > 0}
            autocomplete={autocomplete}
            autocompleteLoading={autocompleteLoading}
            queryAPIForAutocomplete={queryAPIForAutocomplete}
            resetAutocomplete={resetAutocomplete}
            lastFocusedInputID={lastFocusedInputID}
            setLastFocusedInputID={setLastFocusedInputID}
            changeBlockType={(type: BlockType) => {}}
          />
        );
      case BlockType.AND:
      case BlockType.OR:
        return (
            <OperationBlock 
                {...commonProps}
                type={block.type}
                changeBlockType={(type: BlockType) => updateBlock(block.id, { type })}
            />
        );
      default:
        return null;
    }
  };

    const isBlockDisabled = (type: BlockType) => {
        let lastBlock = null;
        if (blocks.length > 0) lastBlock = blocks[blocks.length - 1];

        const hypoBlockIsAndOr = type === BlockType.AND || type === BlockType.OR;
        const hypoBlockIsEqualBetweenIncludes = type === BlockType.EQUAL || type === BlockType.BETWEEN || type === BlockType.INCLUDES;

        if (lastBlock === null) {
            // No blocks yet ==> EQUAL, BETWEEN, INCLUDES can be added
            return !hypoBlockIsEqualBetweenIncludes;
        } else {
            const lastBlockIsAndOr = lastBlock.type === BlockType.AND || lastBlock.type === BlockType.OR;
            const lastBlockIsEqualBetweenIncludes = lastBlock.type === BlockType.EQUAL || lastBlock.type === BlockType.BETWEEN || lastBlock.type === BlockType.INCLUDES;

            if (lastBlockIsAndOr) {
                // Last block is AND/OR ==> EQUAL, BETWEEN, INCLUDES can be added
                return !hypoBlockIsEqualBetweenIncludes;
            } else if (lastBlockIsEqualBetweenIncludes) {
                // Last block is EQUAL, BETWEEN, INCLUDES ==> AND/OR can be added
                return !hypoBlockIsAndOr;
            }
        }
        return true;
    };

    const getTypeIcon = (type: BlockType) => {
        return null; // For now, we may add icons later
        switch (type) {
            case BlockType.AND:
                return null;
            case BlockType.OR:
                return null;
            case BlockType.EQUAL:
                return <span>=</span>;
            case BlockType.BETWEEN:
                return <span>⇔</span>;
            case BlockType.INCLUDES:
                return <span>∋</span>;
            default:
                return null;
        }
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
                onClick={() => setBlocks([])}
            >
                <div className="qt-tool-icon"><RiResetLeftFill /></div>
            </button>
        </div>
        <div className='qt-blocks'>
            {Object.values(BlockType).map(type => (
            <button
                key={type}
                block-type={type}
                onClick={() => addBlock(type)}
                disabled={isBlockDisabled(type)}
            >   
                {getTypeIcon(type)}
                <h3>{getFrenchType(type)}</h3>
            </button>
            ))}
        </div>
      </div>

      <div className="qb-conditions">
        { columnsLoaded
        ? blocks.map(renderBlock)
        : <h3>Chargement des colonnes...</h3>
        }
      </div>
    </div>
  );
};

export default QueryBuilder;