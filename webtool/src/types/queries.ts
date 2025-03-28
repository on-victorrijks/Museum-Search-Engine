import { JSX } from 'react';
import ArtPieceData from './ArtPiece';

// Type definitions for queries
interface Query {
    identifier: string;
    parts: QueryPart[];
    results: any;
}
//// A part of a query
interface QueryPart {
    identifier: string;
    type: SoftQueryType | BlockType;
    isSoft: boolean;
};

// Soft queries (filtering)
interface SoftQueryPart extends QueryPart {
    weight: number;
    term?: string;
    keyword?: string;
    color?: string;
    luminosity?: string;
    recordID?: number;
    imageInformations?: ArtPieceData;
}
//// The type of soft queries
enum SoftQueryType {
    TERM = 'TERM',
    KEYWORD = 'KEYWORD',
    COLOR = 'COLOR',
    LUMINOSITY = 'LUMINOSITY',
    PRECOMPUTED = 'PRECOMPUTED',
}

// Blocks
//// The type of block available to build a hard query
enum BlockType {
    AND = 'AND',
    OR = 'OR',
    EQUAL = 'EQUAL',
    BETWEEN = 'BETWEEN', 
    INCLUDES = 'INCLUDES',
    GROUP = 'GROUP',
}
//// The options available for a selection
interface SelectionOption {
    key: string;
    compatibleBlockTypes: BlockType[];
    userFriendlyName: string;
}
//// The type of hard queries
interface HardQueryPart extends QueryPart {
    // The type of block
    blockType: BlockType;
    // Is not
    isNot: boolean;
    // Exact match
    exactMatch: boolean;
    // Case sensitivity
    caseSensitive: boolean;
    // Keep null
    keepNull: boolean;
    // Selected column
    selectedColumn: SelectionOption;
    // GROUP BLOCK
    children?: HardQueryPart[];
    // EQUAL
    equalTo?: string;
    // BETWEEN
    from?: string|number;
    to?: string|number;
    // INCLUDES
    includes?: (string|number)[];
}
//// The props used to control a block
interface HardQueryPartControlled extends HardQueryPart {
    // Update block
    updateBlock: (
        identifier: string,
        newData: Record<string, any>
    ) => void;

    // Delete
    onDelete: () => void;

    // Key
    setKey: (value: string) => void;

    // Block type
    setBlockType: (value: BlockType) => void;

    // Is not 
    setIsNot: (value: boolean) => void;

    // Exact match
    setExactMatch: (value: boolean) => void;

    // Case sensitivity
    setCaseSensitive: (value: boolean) => void;

    // Keep null
    setKeepNull: (value: boolean) => void;

    // Options available for the selection
    availableColumns: SelectionOption[];
    setSelectedColumn: (column: SelectionOption) => void;

    // Autocomplete
    autocomplete: (string|number)[];
    autocompleteLoading: boolean;
    queryAPIForAutocomplete: (key: string, query: string|number) => void;
    resetAutocomplete: () => void;

    // Input focus tracker
    lastFocusedInputID: string;
    setLastFocusedInputID: (id: string) => void;

    //// The entries below must be defined in the component !!
    inputDisabled?: boolean;
    renderAutocomplete?: boolean;
}

interface GroupBlockProps extends HardQueryPartControlled {
    blockType: BlockType.GROUP;
    children: HardQueryPart[];
    onChildAdd: (child: HardQueryPartControlled) => void;
    onChildDelete: (childIdentifier: string) => void;
    renderBlock: (parents: QueryPart[], setParents: (newParents: QueryPart[]) => void, queryPart: HardQueryPartControlled) => JSX.Element;
    isBlockDisabled: (type: BlockType, queryParts: QueryPart[]) => boolean;
}
interface EqualBlockProps extends HardQueryPartControlled {
    blockType: BlockType.EQUAL;
    equalTo: string;
    setEqualTo: (value: string) => void;
}
interface BetweenBlockProps extends HardQueryPartControlled {
    blockType: BlockType.BETWEEN;
    from: string;
    to: string;
    onFromValueChange: (value: string) => void;
    onToValueChange: (value: string) => void;
}
interface IncludesBlockProps extends HardQueryPartControlled {
    blockType: BlockType.INCLUDES;
    values: string[];
    currentValue: string;
    onValueAdd: (value: string) => void;
    onValueRemove: (value: string) => void;
    onCurrentValueChange: (value: string) => void;
}
interface ANDBlockProps extends HardQueryPartControlled {
    blockType: BlockType.AND
}
interface ORBlockProps extends HardQueryPartControlled {
    blockType: BlockType.OR
}

// Export all
export { 
    BlockType,
    SoftQueryType,
 };
export type {
    Query,
    QueryPart,
    SoftQueryPart,
    HardQueryPart,
    HardQueryPartControlled,
    GroupBlockProps,
    EqualBlockProps,
    BetweenBlockProps,
    IncludesBlockProps,
    ANDBlockProps,
    ORBlockProps,
    SelectionOption,
};