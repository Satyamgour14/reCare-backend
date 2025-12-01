const { StatusCodes } = require('http-status-codes');

// mock commonHelpers (default export)
const mockGetErrorResponse = jest.fn();
const mockDecrypt = jest.fn();
jest.mock('~/helpers/commonHelpers', () => ({
    __esModule: true,
    default: {
        getErrorResponse: mockGetErrorResponse,
        decrypt: mockDecrypt,
    },
}));

// mock tableConstants
jest.mock('~/constants/tableConstants', () => ({
    __esModule: true,
    default: {
        USERS: 'USERS',
    },
}));

// mock BaseModel class
const mockFetchObjWithSingleRecord = jest.fn();
jest.mock('~/models/BaseModel', () => {
    return jest.fn().mockImplementation(() => ({
        fetchObjWithSingleRecord: mockFetchObjWithSingleRecord,
    }));
});

// mock validateToken from src/libraries/tokenValidator
const mockValidateToken = jest.fn();
jest.mock('../../../libraries/tokenValidator', () => ({
    validateToken: mockValidateToken,
}));

// import middleware under test
const authenticate = require('../../../middlewares/authenticate');

const createMockRes = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
});

describe('Middleware - authenticate', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('returns 401 when access-token header is missing', async () => {
        const req = { headers: {} };
        const res = createMockRes();
        const next = jest.fn();

        await authenticate(req, res, next);

        expect(mockGetErrorResponse).toHaveBeenCalledWith(
            res,
            StatusCodes.UNAUTHORIZED,
            'MISSING_OR_MALFORMED_AUTH_TOKEN'
        );
        expect(next).not.toHaveBeenCalled();
    });

    test('returns 401 when access-token does not start with Bearer', async () => {
        const req = { headers: { 'access-token': 'InvalidToken' } };
        const res = createMockRes();
        const next = jest.fn();

        await authenticate(req, res, next);

        expect(mockGetErrorResponse).toHaveBeenCalledWith(
            res,
            StatusCodes.UNAUTHORIZED,
            'MISSING_OR_MALFORMED_AUTH_TOKEN'
        );
        expect(next).not.toHaveBeenCalled();
    });

    test('returns 401 when decoded token missing deviceId or userId', async () => {
        const req = { headers: { 'access-token': 'Bearer abc123' } };
        const res = createMockRes();
        const next = jest.fn();

        mockValidateToken.mockResolvedValue({ deviceId: null, userId: 'encUserId' });

        await authenticate(req, res, next);

        expect(mockValidateToken).toHaveBeenCalledWith('abc123');
        expect(mockGetErrorResponse).toHaveBeenCalledWith(
            res,
            StatusCodes.UNAUTHORIZED,
            'INVALID_TOKEN'
        );
        expect(next).not.toHaveBeenCalled();
    });

    test('returns 401 when user is deleted', async () => {
        const req = { headers: { 'access-token': 'Bearer abc123' } };
        const res = createMockRes();
        const next = jest.fn();

        mockValidateToken.mockResolvedValue({ deviceId: 'd1', userId: 'encUserId' });
        mockDecrypt.mockResolvedValue('user-1');
        mockFetchObjWithSingleRecord.mockResolvedValue({
            deviceId: 'd1',
            status: true,
            isDeleted: true,
        });

        await authenticate(req, res, next);

        expect(mockGetErrorResponse).toHaveBeenCalledWith(
            res,
            StatusCodes.UNAUTHORIZED,
            'INVALID_TOKEN'
        );
        expect(next).not.toHaveBeenCalled();
    });

    test('returns 401 when user is inactive', async () => {
        const req = { headers: { 'access-token': 'Bearer abc123' } };
        const res = createMockRes();
        const next = jest.fn();

        mockValidateToken.mockResolvedValue({ deviceId: 'd1', userId: 'encUserId' });
        mockDecrypt.mockResolvedValue('user-1');
        mockFetchObjWithSingleRecord.mockResolvedValue({
            deviceId: 'd1',
            status: false,
            isDeleted: false,
        });

        await authenticate(req, res, next);

        expect(mockGetErrorResponse).toHaveBeenCalledWith(
            res,
            StatusCodes.UNAUTHORIZED,
            'ACCOUNT_INACTIVE'
        );
        expect(next).not.toHaveBeenCalled();
    });

    test('returns 401 when deviceId from token and DB do not match', async () => {
        const req = { headers: { 'access-token': 'Bearer abc123' } };
        const res = createMockRes();
        const next = jest.fn();

        mockValidateToken.mockResolvedValue({ deviceId: 'device-token', userId: 'encUserId' });
        mockDecrypt.mockResolvedValue('user-1');
        mockFetchObjWithSingleRecord.mockResolvedValue({
            deviceId: 'device-db',
            status: true,
            isDeleted: false,
        });

        await authenticate(req, res, next);

        expect(mockGetErrorResponse).toHaveBeenCalledWith(
            res,
            StatusCodes.UNAUTHORIZED,
            'INVALID_TOKEN'
        );
        expect(next).not.toHaveBeenCalled();
    });

    test('calls next() and sets req.user on success', async () => {
        const req = { headers: { 'access-token': 'Bearer abc123' } };
        const res = createMockRes();
        const next = jest.fn();

        const decoded = { deviceId: 'device-1', userId: 'encUserId' };

        mockValidateToken.mockResolvedValue({ ...decoded });
        mockDecrypt.mockResolvedValue('user-1');
        mockFetchObjWithSingleRecord.mockResolvedValue({
            deviceId: 'device-1',
            status: true,
            isDeleted: false,
        });

        await authenticate(req, res, next);

        expect(mockValidateToken).toHaveBeenCalledWith('abc123');
        expect(mockDecrypt).toHaveBeenCalledWith('encUserId');
        expect(mockFetchObjWithSingleRecord).toHaveBeenCalledWith(
            { userId: 'user-1' },
            ['deviceId', 'status', 'isDeleted'],
            'USERS'
        );
        expect(req.user).toEqual({
            deviceId: 'device-1',
            userId: 'user-1',
        });
        expect(mockGetErrorResponse).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalled();
    });

    test('returns 401 INVALID_TOKEN on unexpected error', async () => {
        const req = { headers: { 'access-token': 'Bearer abc123' } };
        const res = createMockRes();
        const next = jest.fn();

        mockValidateToken.mockRejectedValue(new Error('boom'));

        await authenticate(req, res, next);

        expect(mockGetErrorResponse).toHaveBeenCalledWith(
            res,
            StatusCodes.UNAUTHORIZED,
            'INVALID_TOKEN'
        );
        expect(next).not.toHaveBeenCalled();
    });
});
