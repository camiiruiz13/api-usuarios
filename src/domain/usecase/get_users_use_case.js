const NoUsersFoundException = require('@domain/exception/no_users_found_exception');

class GetAllUsersUseCase {
  constructor(userRepository, logger = console) {
    if (!userRepository) {
      throw new Error('UserRepository es requerido');
    }
    this.userRepository = userRepository;
    this.logger = logger;
  }

  async execute() {
    this.logger.info('[GetAllUsersUseCase] Ejecutando búsqueda de usuarios...');

    const users = await this.userRepository.findAll();

    this.logger.info(`[GetAllUsersUseCase] Se encontraron ${users.length} usuarios.`);

    if (users.length === 0) {
      this.logger.warn('[GetAllUsersUseCase] No hay usuarios registrados.');
      throw new NoUsersFoundException('No hay usuarios registrados');
    }

    this.logger.info('[GetAllUsersUseCase] Finalizó correctamente.');
    return users;
  }
}

module.exports = GetAllUsersUseCase;
