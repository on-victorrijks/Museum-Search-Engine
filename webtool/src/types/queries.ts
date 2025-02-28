interface QueryPart {
    identifier: string;
    type: string;
    term?: string;
    keyword?: string;
    color?: string;
    luminosity?: string;
    weight: number;
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