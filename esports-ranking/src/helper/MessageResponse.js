import { ErrorCodes } from '../constant/ErrorCodes.js';

export function responseSuccess(data, message = 'Success') {
  return {
    code: 0,
    status: ErrorCodes.ERROR_CODE_SUCCESS,
    message,
    data,
  };
}

export function responseWithError(errorCode, message = 'Error', data = {}) {
  return {
    code: 1,
    status: errorCode,
    message,
    errors: data,
  };
}
