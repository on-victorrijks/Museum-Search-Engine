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

interface Query {
    identifier: string;
    parts: QueryPart[];
    results: any;
}

export type {
    QueryPart,
    Query
};