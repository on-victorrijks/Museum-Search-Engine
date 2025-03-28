import ArtistData from "./ArtistData";
import ArtPieceData from "./ArtPiece";
import { JSX } from "react";

export enum TabType {
    RESULTS = 'RESULTS',
    COLLECTION = 'COLLECTION',
    ARTIST = 'ARTIST',
    ARTWORK = 'ARTWORK',
    TREE_GRAPH = 'TREE_GRAPH',
}

type TabIdentifier = string;

type TabData = TabQuery | TabCollection | TabArtist | TabArtwork;

interface TabDataBase {
    identifier: TabIdentifier;
    openLinksInNewTab: boolean;
    type: TabType;
}

// Results tab
interface TabQuery extends TabDataBase {
    type: TabType.RESULTS;
    query: Query;
    dataProvider: {
        isLoading: boolean;
        isLoaded: boolean;
        isError: boolean;
        error: string|undefined;
        askForMoreResults: () => void;
    };
    results: CachedQueryResults;
}
    // A results tab is always associated with a query
    interface Query {
        softQueries: SoftQueryPart[];
        hardQueries: HardQueryPart[];
        hash: string; // Hash of the query to avoid re-fetching results when unmodified
    }
    
        // Soft queries
        type SoftQueryPart = TermSoftQueryPart | KeywordSoftQueryPart | ColorSoftQueryPart | LuminositySoftQueryPart | PrecomputedSoftQueryPart;
        enum SoftQueryType {
            TERM = 'TERM',
            KEYWORD = 'KEYWORD',
            COLOR = 'COLOR',
            LUMINOSITY = 'LUMINOSITY',
            PRECOMPUTED = 'PRECOMPUTED',
        }
        type SoftQueryIdentifier = string;
        interface BaseSoftQueryPart {
            type: SoftQueryType;
            identifier: SoftQueryIdentifier;
            weight: number;
        }
        interface TermSoftQueryPart extends BaseSoftQueryPart {
            type: SoftQueryType.TERM;
            term: string;
            keyword?: never; color?: never; luminosity?: never; precomputed?: never;  
        }
        interface KeywordSoftQueryPart extends BaseSoftQueryPart {
            type: SoftQueryType.KEYWORD;
            keyword: string;
            term?: never; color?: never; luminosity?: never; precomputed?: never;  
        }
        interface ColorSoftQueryPart extends BaseSoftQueryPart {
            type: SoftQueryType.COLOR;
            color: string;
            term?: never; keyword?: never; luminosity?: never; precomputed?: never;  
        }
        interface LuminositySoftQueryPart extends BaseSoftQueryPart {
            type: SoftQueryType.LUMINOSITY;
            luminosity: string;
            term?: never; keyword?: never; color?: never; precomputed?: never;  
        }
        interface PrecomputedSoftQueryPart extends BaseSoftQueryPart {
            type: SoftQueryType.PRECOMPUTED;
            precomputed: {
                recordID: number;
                imageInformations: ArtPieceData;
            };
            term?: never; keyword?: never; color?: never; luminosity?: never;
        } 

        // Hard queries
        type HardQueryIdentifier = string;
        interface HardQueryPart {
            identifier: HardQueryIdentifier;
            blockType: BlockType;
            isNot: boolean;
            exactMatch: boolean;
            caseSensitive: boolean;
            keepNull: boolean;
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
        enum BlockType {
            AND = 'AND',
            OR = 'OR',
            EQUAL = 'EQUAL',
            BETWEEN = 'BETWEEN', 
            INCLUDES = 'INCLUDES',
            GROUP = 'GROUP',
        }
        interface SelectionOption {
            key: string;
            compatibleBlockTypes: BlockType[];
            userFriendlyName: string;
        }
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
            renderBlock: (
                parents: HardQueryPartControlled[], 
                setParents: (newParents: HardQueryPartControlled[]) => void, 
                queryPart: HardQueryPartControlled) 
            => JSX.Element;
            isBlockDisabled: (type: BlockType, queryParts: HardQueryPartControlled[]) => boolean;
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

    // Is also contain results that are cached to avoid re-fetching them on tab change
    interface CachedQueryResults {
        page: number;
        results: ArtPieceData[];
    }

// Collection tab
interface TabCollection extends TabDataBase {
    type: TabType.COLLECTION;
    collectionIdentifier: string;
    // No data since collections are stored using a context !
}

// Artist tab
interface TabArtist extends TabDataBase {
    type: TabType.ARTIST;
    creatorid: string;
}

// Artwork tab
interface TabArtwork extends TabDataBase {
    type: TabType.ARTWORK;
    recordID: number;
}

// Tree graph tab
// TODO: Implement







// Export all the types
export type {
    TabIdentifier,
    TabData,
    TabQuery,
    Query,
    SoftQueryPart,
    HardQueryPart,
    BlockType,
    SelectionOption,
    HardQueryPartControlled,
    GroupBlockProps,
    EqualBlockProps,
    BetweenBlockProps,
    IncludesBlockProps,
    ANDBlockProps,
    ORBlockProps,
    CachedQueryResults,
    TermSoftQueryPart,
    KeywordSoftQueryPart,
    ColorSoftQueryPart,
    LuminositySoftQueryPart,
    PrecomputedSoftQueryPart,
    SoftQueryType,
    BaseSoftQueryPart,
    TabCollection,
    TabArtist,
    TabArtwork,
    TabDataBase,
    HardQueryIdentifier,
    SoftQueryIdentifier,
};