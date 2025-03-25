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
  
export type {
    ApiResponse,
    SuccessfulQueryResponse
}