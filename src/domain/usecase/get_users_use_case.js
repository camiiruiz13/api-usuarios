const NoUsersFoundException = require('@domain//exception/no_users_found_exception');

class GetAllUsersUseCase {
  constructor(userRepository) {
    if (!userRepository) {
      throw new Error('UserRepository es requerido');
    }
    this.userRepository = userRepository;
  }

  async execute() {
    const users = await this.userRepository.findAll();
    if (!users || users.length === 0) {
      throw new NoUsersFoundException('No hay usuarios registrados');
    }
    return users;
  }
}

module.exports = GetAllUsersUseCase;
