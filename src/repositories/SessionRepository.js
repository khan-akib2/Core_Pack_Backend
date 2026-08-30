import BaseRepository from './BaseRepository.js';
import Session from '../models/Session.js';

class SessionRepository extends BaseRepository {
  constructor() {
    super(Session);
  }

  async findByHashedToken(hashedToken) {
    return await this.findOne({ hashedRefreshToken: hashedToken });
  }

  async revokeFamily(familyId) {
    return await this.model.update(
      { isRevoked: true },
      { where: { familyId } }
    );
  }

  async revokeSession(id) {
    return await this.updateById(id, { isRevoked: true });
  }

  async revokeAllForUser(userId) {
    return await this.model.update(
      { isRevoked: true },
      { where: { userId } }
    );
  }
}

const sessionRepository = new SessionRepository();
export default sessionRepository;
