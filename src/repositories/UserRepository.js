import BaseRepository from './BaseRepository.js';
import User from '../models/User.js';

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  async findByEmail(email) {
    if (!email) return null;
    return await User.scope('withPassword').findOne({ where: { email } });
  }

  async findByIdWithAuth(id) {
    if (!id) return null;
    return await User.scope('withPassword').findByPk(id);
  }

  async updateLastLogin(userId) {
    return await this.updateById(userId, { lastLogin: new Date() });
  }
}

const userRepository = new UserRepository();
export default userRepository;
