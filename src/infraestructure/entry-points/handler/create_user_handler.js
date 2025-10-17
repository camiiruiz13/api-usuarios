const { v4: uuidv4 } = require('uuid');
const UserDTO = require('@infra/entry-points/dto/user_dto');
const UserDTOMapper = require('@infra/entry-points/mapper/user_dto_mapper');
const UserRepositoryDynamoDB = require('@driver/user_repository_dynamodb');
const CreateUserUseCase = require('@domain/usecase/create_user_use_case');
const SQSEventPublisherAdapter = require('@driver/sqs_event_publisher_adapter');
const { SuccessResponse, ErrorResponse } = require('@infra/entry-points/response/generic_response');
const EmailAlreadyExistsException = require('@domain/exception/email_already_exists_exception');

class CreateUserHandler {
  constructor() {
    this.userRepository = new UserRepositoryDynamoDB();
    this.sqsPublisher = new SQSEventPublisherAdapter();
    this.createUserUseCase = new CreateUserUseCase(this.userRepository, this.sqsPublisher);
  }

  async handler(request) {
    try {
      const body = JSON.parse(request.body || '{}');

      if (!body.name || !body.email) {
        return {
          statusCode: 400,
          body: JSON.stringify(new ErrorResponse('Campos requeridos: name, email')),
        };
      }

      const userDTO = new UserDTO({
        idUser: uuidv4(),
        name: body.name.trim(),
        email: body.email.trim().toLowerCase(),
      });

      const userDomain = UserDTOMapper.toDomain(userDTO);
      const savedUser = await this.createUserUseCase.execute(userDomain);
      const responseDTO = UserDTOMapper.toDTO(savedUser);

      return {
        statusCode: 201,
        body: JSON.stringify(
            new SuccessResponse('Usuario creado exitosamente', {
              idUser: responseDTO.idUser,
              email: responseDTO.email,
            })
        ),
      };
    } catch (error) {
      if (error instanceof EmailAlreadyExistsException) {
        return {
          statusCode: 409,
          body: JSON.stringify(new ErrorResponse('El usuario ya existe', error.message)),
        };
      }

      console.error('[CreateUserHandler] Error inesperado:', error);
      return {
        statusCode: 500,
        body: JSON.stringify(new ErrorResponse('Error al crear el usuario', error.message)),
      };
    }
  }
}

module.exports = CreateUserHandler;
