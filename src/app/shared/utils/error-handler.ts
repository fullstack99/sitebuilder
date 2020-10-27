export function getHttpError(httpError: any) {
    if (httpError && httpError.error && httpError.error.error_description) {
        return httpError.error.error_description
    }
    else if (httpError && httpError.error) {
        return httpError.error.error;
    }
}