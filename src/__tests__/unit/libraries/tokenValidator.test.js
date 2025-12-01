// mock jsonwebtoken.verify
const mockJwtVerify = jest.fn();

jest.mock('jsonwebtoken', () => ({
    __esModule: true,
    default: {
        verify: mockJwtVerify,
    },
}));

// mock jwks-rsa so it doesn't try to hit a real JWKS endpoint
const mockGetSigningKey = jest.fn();

jest.mock('jwks-rsa', () => {
    return jest.fn(() => ({
        getSigningKey: mockGetSigningKey,
    }));
});


// import the library under test
const { validateToken } = require('../../../libraries/tokenValidator');

describe('Library - validateToken', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.FORBIDDEN_FIELDS_IN_TOKEN = '';
    });

    test('resolves decoded payload when jwt.verify succeeds and no forbidden fields', async () => {
        const token = 'dummy-token';
        const decoded = { userId: '123', deviceId: 'abc' };

        // mock jwt.verify implementation
        mockJwtVerify.mockImplementation((t, getKey, options, callback) => {
            // we can optionally assert on options here if we want
            callback(null, decoded);
        });

        const result = await validateToken(token);

        expect(mockJwtVerify).toHaveBeenCalledTimes(1);
        expect(mockJwtVerify).toHaveBeenCalledWith(
            token,
            expect.any(Function),
            expect.objectContaining({
                algorithms: expect.any(Array),
                issuer: expect.any(String),
                audience: expect.any(String),
            }),
            expect.any(Function)
        );

        expect(result).toEqual(decoded);
    });

    test('rejects when jwt.verify returns an error', async () => {
        const token = 'invalid-token';
        const error = new Error('invalid token');

        mockJwtVerify.mockImplementation((t, getKey, options, callback) => {
            callback(error, null);
        });

        await expect(validateToken(token)).rejects.toThrow('invalid token');
        expect(mockJwtVerify).toHaveBeenCalledTimes(1);
    });

    test('rejects when decoded token contains a forbidden field', async () => {
        const token = 'dummy-token';

        // with your current implementation, FORBIDDEN_FIELDS_IN_TOKEN is iterated with `for...of`
        // so setting it to 'a' will iterate once with field = 'a'
        process.env.FORBIDDEN_FIELDS_IN_TOKEN = 'a';

        const decoded = {
            a: 'some sensitive value',
            userId: '123',
        };

        mockJwtVerify.mockImplementation((t, getKey, options, callback) => {
            callback(null, decoded);
        });

        await expect(validateToken(token)).rejects.toThrow(
            'Token contains forbidden field: a'
        );

        expect(mockJwtVerify).toHaveBeenCalledTimes(1);
    });
});
