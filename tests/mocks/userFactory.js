const { baseUser } = require('./userMock');

function makeSavedUser({ isFirst }) {
  return {
    ...baseUser,
    _id: '507f191e810c19729de860ea',
    role: isFirst ? 'admin' : 'user',
    approved: isFirst,
    password: 'hashedPassword'
  };
}

module.exports = { makeSavedUser };
