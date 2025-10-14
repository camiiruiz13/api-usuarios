const UserDTOMapper = require('../mapper/user_dto_mapper');
const UserRepositoryInMemory = require('../../driver-adapters/user_repository_in_memory');
const GetUserByEmailUseCase = require('../../../domain/usecase/get_user_by_email_use_case');
const { SuccessResponse, ErrorResponse } = require('../response/generic_response');
const UserNotFoundException = require('../../../domain/exception/user_not_found_exception');

class GetUserByEmailHandler {
  constructor(userRepository) {
    this.userRepository = userRepository;
    this.getUserByEmailUseCase = new GetUserByEmailUseCase(this.userRepository);
  }

  async handler(request) {
    try {
      const email = request?.queryStringParameters?.email;
      const user = await this.getUserByEmailUseCase.execute(email);
      const userDTO = UserDTOMapper.toDTO(user);
      return {
        statusCode: 200,
        body: JSON.stringify(new SuccessResponse('Usuario obtenido correctamente', userDTO)),
      };
    } catch (error) {
      if (error instanceof UserNotFoundException) {
        return {
          statusCode: 404,
          body: JSON.stringify(new ErrorResponse('Usuario no encontrado', error.message)),
        };
      }

      return {
        statusCode: 500,
        body: JSON.stringify(new ErrorResponse('Error interno del servidor', error.message)),
      };
    }
  }
}

module.exports = GetUserByEmailHandler;
