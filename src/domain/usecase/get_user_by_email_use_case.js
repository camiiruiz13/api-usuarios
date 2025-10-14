const UserNotFoundException = require('@domain/exception/user_not_found_exception');

class GetUserByEmailUseCase {
  constructor(userRepository) {
    if (!userRepository) {
      throw new Error('UserRepository es requerido');
    }
    this.userRepository = userRepository;
  }

  async execute(email) {
    if (!email || typeof email !== 'string') {
      throw new Error('El email es requerido');
    }

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new UserNotFoundException(email);
    }

    return user;
  }
}

module.exports = GetUserByEmailUseCase;
