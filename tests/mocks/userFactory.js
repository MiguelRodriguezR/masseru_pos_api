const { baseUser } = require('./userMock');

module.exports = {
  makeSavedUser: ({ isFirst }) => ({
    ...baseUser,
    _id: '507f191e810c19729de860ea',
    role: isFirst ? 'admin' : 'user',
    approved: isFirst,
    password: 'hashedPassword'
  })
};
