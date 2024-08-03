import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { handleQueryFailedErorr } from '../../../src/utils/handleQueryFailedErorr';

describe('Teste unitário da função handleQueryFailedError', () => {
    it.skip('verifica se retorna o erro corretamente handleQueryFailedError', () => {
        const query = new QueryFailedError('insert seila', [], 'postgres');
        const mockRequest: Partial<Request> = {};
        const mockResponse: Partial<Response> = {
            json: jest.fn(),
        };

        query['code'] = 23505;
        query['detail'] = 'Key (email)=(teste@user.com) already exists.';

        handleQueryFailedErorr(query, mockRequest as Request, mockResponse as Response);

        expect(mockResponse.json).toBeCalledWith({
            message: 'This email is already in use'
        });
    });

    it.skip('verifica se trata NotNull corretamente', () => {
        const query = new QueryFailedError('insert seila', [], 'postgres');
        const mockRequest: Partial<Request> = {};
        const mockResponse: Partial<Response> = {
            json: jest.fn(),
        };

        query['code'] = 23502;
        query['detail'] = 'null value in column "description" violates not-null constraint';

        handleQueryFailedErorr(query, mockRequest as Request, mockResponse as Response);

        expect(mockResponse.json).toBeCalledWith({
            message: 'The item "description" must be defined'
        });

    });
});