const UserDTO = require('../dto/user_dto');
const UserDTOMapper = require('../mapper/user_dto_mapper');
const UserRepositoryInMemory = require('../../driver-adapters/user_repository_in_memory');
const CreateUserUseCase = require('../../../domain/usecase/create_user_use_case');
const { SuccessResponse, ErrorResponse } = require('../response/generic_response');
const EmailAlreadyExistsException = require('../../../domain/exception/email_already_exists_exception');

class CreateUserHandler {
  constructor() {
    this.userRepository = new UserRepositoryInMemory();
    this.createUserUseCase = new CreateUserUseCase(this.userRepository);
  }

  async handler(request) {
    try {
      const body = JSON.parse(request.body);
      const userDTO = new UserDTO(body);
      const user = UserDTOMapper.toDomain(userDTO);

      const savedUser = await this.createUserUseCase.execute(user);
      const responseDto = UserDTOMapper.toDTO(savedUser);

      return {
        statusCode: 201,
        body: JSON.stringify(
          new SuccessResponse('Usuario creado exitosamente', {idUser : responseDto.idUser})
        ),
      };
    } catch (error) {
      if (error instanceof EmailAlreadyExistsException) {
        return {
          statusCode: 409,
          body: JSON.stringify(new ErrorResponse('El usuario ya existe', error.message)),
        };
      }
      return {
        statusCode: 400,
        body: JSON.stringify(new ErrorResponse('Error al crear el usuario', error.message)),
      };
    }
  }
}

module.exports = CreateUserHandler;
