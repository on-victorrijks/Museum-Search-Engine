import { Query } from "./queries";

interface CollectionData {
    identifier: string,
    name: string,
    description: string,
    creationDate: {
        year: number,
        month: number,
        day: number,
        hour: number,
        minute: number,
        second: number,
    },
    recordIDs: string[],
}

export default CollectionData;