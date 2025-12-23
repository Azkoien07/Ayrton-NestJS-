import { ApiResponse } from '../http/response';
import { HttpCodes } from './responseCodes';

export class ResponseFactory {

    static success<T>(message: string, data?: T, code = HttpCodes.OK): ApiResponse<T> {
        return { code, message, data };
    }

    static created<T>(message = 'Recurso creado correctamente', data?: T): ApiResponse<T> {
        return { code: HttpCodes.CREATED, message, data };
    }

    static noContent(message = 'Operación realizada correctamente'): ApiResponse {
        return { code: HttpCodes.NO_CONTENT, message };
    }

    static badRequest(message = 'Solicitud inválida'): ApiResponse {
        return { code: HttpCodes.BAD_REQUEST, message };
    }

    static unauthorized(message = 'No autorizado'): ApiResponse {
        return { code: HttpCodes.UNAUTHORIZED, message };
    }

    static forbidden(message = 'Acceso denegado'): ApiResponse {
        return { code: HttpCodes.FORBIDDEN, message };
    }

    static notFound(message = 'Recurso no encontrado'): ApiResponse {
        return { code: HttpCodes.NOT_FOUND, message };
    }

    static error(message = 'Error interno del servidor', code = HttpCodes.INTERNAL_ERROR): ApiResponse {
        return { code, message };
    }
}
