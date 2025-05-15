const User = require('../../models/User');
const bcrypt = require('bcryptjs');

module.exports = {
  mockRegister: ({ exists, count, hash, savedUser }) => {
    const mockFindOne = jest.spyOn(User, 'findOne')
      .mockImplementation(() => exists ? savedUser : null);
      
    const mockCount = jest.spyOn(User, 'countDocuments')
      .mockResolvedValue(count);

    const mockHash = jest.spyOn(bcrypt, 'hash').mockResolvedValue(hash || 'hashedPassword');

    const instanceConSave = {
      ...savedUser,
      save: jest.fn().mockResolvedValue(savedUser)
    };

    User.mockImplementation(() => instanceConSave);

    return { mockFindOne, mockCount, mockHash };
  }
};
