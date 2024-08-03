import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

enum PostgresErrorCode {
    UNIQUE = 23505,
    FK_VIOLATION = 23503,
    NOTNULL = 23502,
}

export function handleQueryFailedErorr(
    error: QueryFailedError,
    _: Request,
    res: Response
): Response {
    //@ts-ignore
    const errorCode = parseInt(error['code']);
    
    //@ts-ignore
    if(errorCode === PostgresErrorCode.UNIQUE) {
        //@ts-ignore
        const detail: string = error['detail'];

        const matchKey = detail.match(/.* \((?<key>\w+)\).*/);

        res.statusCode = 409;
        return res.json({
            message: `This ${matchKey.groups.key} is already in use`,
        });
    } else if (errorCode === PostgresErrorCode.FK_VIOLATION) {
        return res.status(400).json({
            message: 'Foreign key constraint violated',
        });
    } else if (errorCode === PostgresErrorCode.NOTNULL) {
        const matchKey = error.message.match(/.* "(?<key>\w+)".*/);

        if (matchKey.groups.key) {
            res.statusCode = 400;
            return res.json({
                message: `The item "${matchKey.groups.key}" must be defined`,
            });
        }
    } else {
        console.error('Erro interno', error);
        return res.status(500).send();
    }
}
