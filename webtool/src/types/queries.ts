import { BlockType } from "./blocks";

interface QueryPart {
    identifier: string;
    type: string;
    weight: number;
    isSoft: boolean;
    term?: string;
    keyword?: string;
    color?: string;
    luminosity?: string;
    recordID?: number;
    imageInformations?: Record<string, any>;
};
interface HardQueryPartOperation extends QueryPart {
    operation: BlockType.OR | BlockType.AND;
}
interface HardQueryPartLeaf extends QueryPart {
    isNot: boolean;

    columnName: string;

    equalTo?: string;

    from?: string;
    to?: string;

    includes?: string[];

    exactMatch?: boolean;
}

interface Query {
    identifier: string;
    parts: QueryPart[];
    results: any;
}

export type {
    QueryPart,
    HardQueryPartOperation,
    HardQueryPartLeaf,
    Query,
};