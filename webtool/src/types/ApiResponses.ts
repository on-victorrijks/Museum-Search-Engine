import ArtistData from "./ArtistData";
import ArtPieceData from "./ArtPiece";

interface ApiResponse {
    success: boolean;
    error_code?: number;
    error_message?: string;
    data?: any;
}

interface SuccessfulQueryResponse extends ApiResponse {
    data: ArtPieceData[]
}

interface SuccessfulKeywordsResponse extends ApiResponse {
    data: string[]
}

interface SuccessfulNeighboursResponse extends ApiResponse {
    data: {
        page: number;
        page_size: number;
        results: {
            distance: number;
            recordID: number;
        }[]
    }
}

interface SuccessfulArtistDataResponse extends ApiResponse {
    data: ArtistData
}

interface SuccessfulArtPieceDataResponse extends ApiResponse {
    data: ArtPieceData
}

interface SuccessfulAugmentCollectionResponse extends ApiResponse {
    data: number[]
}

export type {
    ApiResponse,
    SuccessfulQueryResponse,
    SuccessfulKeywordsResponse,
    SuccessfulNeighboursResponse,
    SuccessfulArtistDataResponse,
    SuccessfulArtPieceDataResponse,
    SuccessfulAugmentCollectionResponse
}