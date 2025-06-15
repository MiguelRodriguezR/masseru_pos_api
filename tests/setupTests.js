const { mockRequest, mockResponse } = require('./mocks/mockUtils');

global.mockRequest = mockRequest;
global.mockResponse = mockResponse;

beforeEach(() => {
  jest.clearAllMocks();
  global.req = mockRequest();
  global.res = mockResponse();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});
