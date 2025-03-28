export interface TabData {
    type: string;
    identifier: string;
    content: Record<string, any>; // Dictionary-like structure
    page?: number;
} // deprecated # TODO: Remove this

export enum TabType {
    RESULTS = 'RESULTS',
    COLLECTION = 'COLLECTION',
    ARTIST = 'ARTIST',
    ARTWORK = 'ARTWORK',
    TREE_GRAPH = 'TREE_GRAPH',
}

export interface TabRegistry {
    type: TabType;
    identifier: string;
}

