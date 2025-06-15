// tests/mocks/mockUtils.js

/**
 * Creates a mock request object for testing controllers
 */
const mockRequest = (body = {}, user = { id: '5f7e3c6a8ea7c8362a5c8b1b' }, params = {}, query = {}) => {
  return {
    body,
    user,
    params,
    query
  };
};

/**
 * Creates a mock response object for testing controllers
 */
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

/**
 * Sets up mock methods for a Mongoose model
 * This approach better simulates how Mongoose chaining works
 */
const setupMockModel = (model, mockData) => {
  // Mock find method with chainable returns
  model.find = jest.fn().mockImplementation(() => {
    return {
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(Array.isArray(mockData) ? mockData : [mockData])
    };
  });

  // Mock findOne method
  model.findOne = jest.fn().mockImplementation(() => {
    return {
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(mockData)
    };
  });

  // Mock findById method
  model.findById = jest.fn().mockImplementation(() => {
    return {
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(mockData)
    };
  });

  // Mock countDocuments method
  model.countDocuments = jest.fn().mockResolvedValue(Array.isArray(mockData) ? mockData.length : 1);
  
  // Mock save method for new model instances
  model.prototype.save = jest.fn().mockResolvedValue(mockData);

  return model;
};

// Create a generic query chain mock used by other helpers
const createQueryMock = (returnValue) => ({
  populate: jest.fn().mockReturnThis(),
  sort: jest.fn().mockResolvedValue(returnValue),
  select: jest.fn().mockResolvedValue(returnValue),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  then: (resolve, reject) =>
    Promise.resolve(returnValue).then(resolve, reject),
  exec: jest.fn().mockResolvedValue(returnValue)
});

// Mock Model.find to resolve with provided data using chained query methods
const mockFind = (model, data) => {
  model.find = jest.fn().mockReturnValue(createQueryMock(data));
};

// Mock Model.findById returning a chainable query
const mockFindById = (model, data) => {
  model.findById = jest.fn().mockReturnValue(createQueryMock(data));
};

// Mock countDocuments returning provided count
const mockCountDocuments = (model, count) => {
  model.countDocuments = jest.fn().mockResolvedValue(count);
};

// Mock constructor so that calling new Model().save resolves to data
const mockSave = (model, data) => {
  const instance = { save: jest.fn().mockResolvedValue(data) };
  model.mockImplementation(() => instance);
  return instance;
};

module.exports = {
  mockRequest,
  mockResponse,
  setupMockModel,
  mockFind,
  mockFindById,
  mockCountDocuments,
  mockSave
};
