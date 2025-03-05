import React, { useState, useCallback, useMemo } from 'react';
import { FaX, FaChevronRight } from 'react-icons/fa6';

import '../styles/QueryBuilder.css';
import { FaBan, FaPlus, FaTrash } from 'react-icons/fa';

enum BlockType {
  AND = 'AND',
  OR = 'OR',
  EQUAL = 'EQUAL',
  BETWEEN = 'BETWEEN', 
  INCLUDES = 'INCLUDES'
}

interface BaseBlockProps {
  type: BlockType;
  isNot: boolean;
  onToggleNot: () => void;
  onDelete: () => void;
}

interface ColumnBlockProps extends BaseBlockProps {
  availableColumns: string[];
  selectedColumn?: string;
  onColumnChange: (column: string) => void;
  inputDisabled: boolean;
  renderAutocomplete: boolean;
  autocomplete: string[];
  autocompleteLoading: boolean;
  queryAPIForAutocomplete: (columnName: string, query: string) => void;
  resetAutocomplete: () => void;
}

interface EqualBlockProps extends ColumnBlockProps {
    value: string;
    onValueChange: (value: string) => void;
}

interface BetweenBlockProps extends ColumnBlockProps {
    fromValue: string;
    toValue: string;
    onFromValueChange: (value: string) => void;
    onToValueChange: (value: string) => void;
    betweenLastFocused: 'from' | 'to';
    onBetweenLastFocusedChange: (focused: 'from' | 'to') => void;
}

interface IncludesBlockProps extends ColumnBlockProps {
  values: string[];
  currentValue: string;
  onValueAdd: (value: string) => void;
  onValueRemove: (value: string) => void;
  onCurrentValueChange: (value: string) => void;
  autocompleteOptions?: string[];
}

const BaseButtons: React.FC<BaseBlockProps> = ({ isNot, onToggleNot, onDelete }) => (
    <div className="qb-block-base-buttons">
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

    <div className={"qb-block-base-not " + (isNot ? "enabled" : "")} onClick={onToggleNot}>
        <div className="qb-block-base-not-repr">
            {isNot ? <FaBan /> : null}
        </div>
        <h5>N'EST PAS</h5>
    </div>

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
    ...baseProps
}) => {
    return (
        <div className="qb-block" block-type={BlockType.EQUAL}>
            <BaseBlock {...baseProps} />
            <div className="qb-block-sep"></div>
            <div className="qb-block-content">

                {selectOptionComponent(availableColumns, selectedColumn, onColumnChange)}

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
                        />
                    </div>

                    { renderAutocomplete &&
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
                                    <h3>{option}</h3>
                                </div>
                            ))}
                        </>
                    }                
                    </div>
                    }
                </div>

            </div>
            <BaseButtons {...baseProps} />
        </div>
    );
};

const BetweenBlock: React.FC<BetweenBlockProps> = ({
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
    betweenLastFocused,
    onBetweenLastFocusedChange,
    ...baseProps
}) => (
    <div className="qb-block" block-type={BlockType.BETWEEN}>
        <BaseBlock {...baseProps} />
        <div className="qb-block-sep"></div>
        <div className="qb-block-content">

            {selectOptionComponent(availableColumns, selectedColumn, onColumnChange)}

            <div className={"qb-block-input " + (autocompleteLoading ? "loading" : "")}>
                <div className="qb-block-input-br">
                    <div className="qb-block-input-br-prefix">{">="}</div>
                    <input 
                        type="text" 
                        value={fromValue}
                        onChange={(e) => {
                            onFromValueChange(e.target.value);
                            queryAPIForAutocomplete(selectedColumn || '', e.target.value);
                        }}
                        placeholder="Valeur"
                        disabled={inputDisabled}
                        onFocus={() => onBetweenLastFocusedChange('from')}
                    />
                </div>

                { (renderAutocomplete && betweenLastFocused=="from") &&
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
                                <h3>{option}</h3>
                            </div>
                        ))}
                    </>
                }                
                </div>
                }
            </div>

            <div className="qb-block-input-inter">
                <h4>ET</h4>
            </div>

            <div className={"qb-block-input " + (autocompleteLoading ? "loading" : "")}>
                <div className="qb-block-input-br">
                    <div className="qb-block-input-br-prefix">{"<="}</div>
                    <input 
                        type="text" 
                        value={toValue}
                        onChange={(e) => {
                            onToValueChange(e.target.value);
                            queryAPIForAutocomplete(selectedColumn || '', e.target.value);
                        }}
                        placeholder="Valeur"
                        disabled={inputDisabled}
                        onFocus={() => onBetweenLastFocusedChange('to')}
                    />
                </div>

                { (renderAutocomplete && betweenLastFocused=="to") &&
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
                                <h3>{option}</h3>
                            </div>
                        ))}
                    </>
                }                
                </div>
                }

            </div>

        </div>
        <BaseButtons {...baseProps} />
    </div>
);

const IncludesBlock: React.FC<IncludesBlockProps> = ({
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
    autocompleteOptions = [],
    ...baseProps
}) => {

    return (
        <div className="qb-block" block-type={BlockType.INCLUDES}>
            <BaseBlock {...baseProps} />
            <div className="qb-block-sep"></div>
            <div className="qb-block-content column">

                <div className="qd-block-row">
                    {selectOptionComponent(availableColumns, selectedColumn, onColumnChange)}

                    <div className="qb-block-input">
                        <div className="qb-block-input-br">
                            <input 
                                type="text" 
                                value={currentValue}
                                onChange={(e) => {
                                    onCurrentValueChange(e.target.value);
                                    queryAPIForAutocomplete(selectedColumn || '', e.target.value);
                                }}
                                placeholder="Valeur"
                                disabled={inputDisabled}
                            />
                            <button 
                                onClick={() => onValueAdd(currentValue)}
                            >
                                <FaPlus />
                            </button>
                        </div>
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
            <BaseButtons {...baseProps} />
        </div>
    );
};

const OperationBlock: React.FC<BaseBlockProps> = ({ ...baseProps }) => (
    <div className="qb-block" block-type={baseProps.type}>
        <BaseBlock {...baseProps} onDelete={() => {}} onToggleNot={() => {}} />
        <div style={{flex: 1}}></div>
        <BaseButtons {...baseProps} onDelete={() => {}} onToggleNot={() => {}}/>
    </div>
);

const QueryBuilder: React.FC = () => {
  const [blocks, setBlocks] = useState<any[]>([]);
  const availableColumns = ['name', 'age', 'email', 'city'];
  const autocompleteOptions = ['New York', 'Los Angeles', 'Chicago', 'Houston'];

  const [autocomplete, setAutocomplete] = useState<string[]>([]);
  const [autocompleteLoading, setAutocompleteLoading] = useState<boolean>(false);
  const [betweenLastFocused, setBetweenLastFocused] = useState<'from' | 'to'>('from');

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
    setBlocks(blocks.filter(block => block.id !== id));
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

  /* AAA */

  const renderBlock = (block: any) => {
    const commonProps = {
      key: block.id,
      onToggleNot: () => updateBlock(block.id, { isNot: !block.isNot }),
      onDelete: () => deleteBlock(block.id),
    };

    switch (block.type) {
      case BlockType.EQUAL:
        return (
          <EqualBlock
            {...commonProps}
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
          />
        );
      case BlockType.BETWEEN:
        return (
          <BetweenBlock
            {...commonProps}
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
            betweenLastFocused={betweenLastFocused}
            onBetweenLastFocusedChange={(focused) => setBetweenLastFocused(focused)}
          />
        );
      case BlockType.INCLUDES:
        return (
          <IncludesBlock
            {...commonProps}
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
            renderAutocomplete={block.value && block.value.length > 0 && block.column && block.column.length > 0}
            autocomplete={autocomplete}
            autocompleteLoading={autocompleteLoading}
            queryAPIForAutocomplete={queryAPIForAutocomplete}
            resetAutocomplete={resetAutocomplete}
          />
        );
      case BlockType.AND:
      case BlockType.OR:
        return (
            <OperationBlock 
                {...commonProps}
                type={block.type}
                isNot={block.isNot}
            />
        );
      default:
        return null;
    }
  };

  const isBlockDisabled = (type: BlockType) => {
        /*
            RULES: AND/OR can only be placed after EQUAL, BETWEEN, or INCLUDES blocks
            EQUAL, BETWEEN, INCLUDES can only be placed after AND/OR blocks
        */
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
    <div className="query-builder">
      <div className="qb-blocks-selector">
        <div className="qt-blocks-header">
            <h3>Blocks</h3>
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
        {blocks.map(renderBlock)}
      </div>
    </div>
  );
};

export default QueryBuilder;