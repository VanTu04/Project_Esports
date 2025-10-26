const ErrorCodes = require('../constant/ErrorCodes');

function responseSuccess(data, message = 'Success') {
    return {
        code: 0,
        status: ErrorCodes.ERROR_CODE_SUCCESS,
        message,
        data,
    };
}

function responseWithError(errorCode, message = 'Error', data={} ) {
    return {
        code: 1,
        status: errorCode,
        message,
        errors: data, 
    };
}

module.exports = { responseSuccess, responseWithError }