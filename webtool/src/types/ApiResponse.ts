interface ApiResponse {
    success: boolean;
    error_code?: number;
    error_message?: string;
    data?: any;
}
  
export default ApiResponse;