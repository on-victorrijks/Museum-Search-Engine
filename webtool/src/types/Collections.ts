interface CollectionData {
    identifier: string,
    name: string,
    description: string,
    timestamp: number,
    recordIDs: number[],
    editCount: number,
}

export default CollectionData;