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

module.exports = {
  mockRequest,
  mockResponse,
  setupMockModel
};
