// tests/mocks/mockUtils.js

/**
 * Creates a mock request object for testing controllers
 */
// The controllers now expect a `db` property on the request object in order to
// obtain tenant specific models.  Most of the unit tests were written before
// multi tenancy was introduced so they don't provide this property.  To keep
// them working we include a dummy `db` object by default and also allow it to
// be overridden when needed.
const mockRequest = (
  body = {},
  user = { id: '5f7e3c6a8ea7c8362a5c8b1b' },
  params = {},
  query = {},
  db = {}
) => {
  return {
    body,
    user,
    params,
    query,
    db
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
