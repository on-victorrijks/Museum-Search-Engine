interface ArtPieceData {
    recordID: number;
    workID: string;
    title: string;
    earliestDate: string;
    latestDate: string;
    iconography: string[];
    classification: string;
    objectType: string;
    materials: string[];
    inscription: string;
    height: string;
    width: string;
    imageColor: string;
    author: string;
    creatorFirstName: string;
    creatorLastName: string;
    creatorBirthDate: string;
    creatorDeathDate: string;
    creatorBirthDeathPlace: string;
    creatorNationality: string;
    similarity?: number;
}

export default ArtPieceData;