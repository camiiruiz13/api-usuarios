const EmailAlreadyExistsException = require('../exception/email_already_exists_exception');

class CreateUserUseCase {
  constructor(userRepository) {
    if (!userRepository) {
      throw new Error('UserRepository es requerido');
    }
    this.userRepository = userRepository;
  }

  async execute(userModel) {

    const existingUser = await this.userRepository.findByEmail(userModel.email);
    if (existingUser) {
      throw new EmailAlreadyExistsException(userModel.email);
    }

   const savedUser = await this.userRepository.save(userModel);
    return savedUser;
  }
} 

module.exports = CreateUserUseCase;