import { ApiResponse } from '../http/response';

export class ResponseFactory {

    static success<T>(message: string, data?: T, code = 200): ApiResponse<T> {
        return { code, message, data };
    }

    static created<T>(message = 'Recurso creado correctamente', data?: T): ApiResponse<T> {
        return { code: 201, message, data };
    }

    static noContent(message = 'Operación realizada correctamente'): ApiResponse {
        return { code: 204, message };
    }

    static badRequest(message = 'Solicitud inválida'): ApiResponse {
        return { code: 400, message };
    }

    static unauthorized(message = 'No autorizado'): ApiResponse {
        return { code: 401, message };
    }

    static forbidden(message = 'Acceso denegado'): ApiResponse {
        return { code: 403, message };
    }

    static notFound(message = 'Recurso no encontrado'): ApiResponse {
        return { code: 404, message };
    }

    static error(message = 'Error interno del servidor', code = 500): ApiResponse {
        return { code, message };
    }
}
