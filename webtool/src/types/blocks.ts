enum BlockType {
  AND = 'AND',
  OR = 'OR',
  EQUAL = 'EQUAL',
  BETWEEN = 'BETWEEN', 
  INCLUDES = 'INCLUDES'
}

interface BaseBlockProps {
  type: BlockType;
  isNot?: boolean;
  onToggleNot: () => void;
  onDelete: () => void;
  changeBlockType: (type: BlockType) => void;
  setExactMatch?: (value: boolean) => void;
  exactMatch?: boolean;
}

interface SelectionOption extends Record<string, string> {
  key: string;
  userFriendlyName: string;
}

interface ColumnBlockProps extends BaseBlockProps {
    identifier: string;
    availableColumns: SelectionOption[];
    selectedColumn?: SelectionOption;
    onColumnChange: (column: SelectionOption) => void;
    inputDisabled: boolean;
    renderAutocomplete: boolean;
    autocomplete: string[];
    autocompleteLoading: boolean;
    queryAPIForAutocomplete: (columnName: string, query: string) => void;
    resetAutocomplete: () => void;
    lastFocusedInputID: string;
    setLastFocusedInputID: (id: string) => void;
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
}

interface IncludesBlockProps extends ColumnBlockProps {
  values: string[];
  currentValue: string;
  onValueAdd: (value: string) => void;
  onValueRemove: (value: string) => void;
  onCurrentValueChange: (value: string) => void;
  autocompleteOptions?: string[];
}

// Export all
export type { BaseBlockProps, ColumnBlockProps, EqualBlockProps, BetweenBlockProps, IncludesBlockProps, SelectionOption };
export { BlockType };