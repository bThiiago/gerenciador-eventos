"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const handleQueryFailedErorr_1 = require("../../../src/utils/handleQueryFailedErorr");
describe('Teste unitário da função handleQueryFailedError', () => {
    it.skip('verifica se retorna o erro corretamente handleQueryFailedError', () => {
        const query = new typeorm_1.QueryFailedError('insert seila', [], 'postgres');
        const mockRequest = {};
        const mockResponse = {
            json: jest.fn(),
        };
        query['code'] = 23505;
        query['detail'] = 'Key (email)=(teste@user.com) already exists.';
        (0, handleQueryFailedErorr_1.handleQueryFailedErorr)(query, mockRequest, mockResponse);
        expect(mockResponse.json).toBeCalledWith({
            message: 'This email is already in use'
        });
    });
    it.skip('verifica se trata NotNull corretamente', () => {
        const query = new typeorm_1.QueryFailedError('insert seila', [], 'postgres');
        const mockRequest = {};
        const mockResponse = {
            json: jest.fn(),
        };
        query['code'] = 23502;
        query['detail'] = 'null value in column "description" violates not-null constraint';
        (0, handleQueryFailedErorr_1.handleQueryFailedErorr)(query, mockRequest, mockResponse);
        expect(mockResponse.json).toBeCalledWith({
            message: 'The item "description" must be defined'
        });
    });
});
//# sourceMappingURL=handleQueryFailedError.test.js.map