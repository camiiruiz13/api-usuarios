const EmailAlreadyExistsException = require('@domain/exception/email_already_exists_exception');

class CreateUserUseCase {
  constructor(userRepository, sqsPublisher) {
    if (!userRepository) throw new Error('UserRepository es requerido');
    this.userRepository = userRepository;
    this.sqsPublisher = sqsPublisher;
  }

  async execute(userModel) {
    if (!userModel || !userModel.email) throw new Error('userModel o el campo email son requeridos');

    const existingUser = await this.userRepository.findByEmail(userModel.email);
    if (existingUser) throw new EmailAlreadyExistsException(userModel.email);

    const savedUser = await this.userRepository.save(userModel);

    if (this.sqsPublisher) {
      const event = {
        type: 'UserCreated',
        data: savedUser,
        timestamp: new Date().toISOString(),
      };
      await this.sqsPublisher.publish(event);
    }

    return savedUser;
  }
}

module.exports = CreateUserUseCase;
