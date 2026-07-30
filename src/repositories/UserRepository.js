import BaseRepository from './BaseRepository.js';
import User from '../models/User.js';

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  async findByEmail(email) {
    if (!email) return null;
    return await this.findOne({ email });
  }

  async updateRefreshToken(userId, refreshTokenHash) {
    return await this.updateById(userId, { refreshTokenHash });
  }
}

const userRepository = new UserRepository();
export default userRepository;
