const GetUserByEmailUseCase = require('@domain/usecase/get_user_by_email_use_case');
const UserRepositoryDynamoDB = require('@driver/user_repository_dynamodb');
const UserDTOMapper = require('@infra/entry-points/mapper/user_dto_mapper');
const { SuccessResponse, ErrorResponse } = require('@infra/entry-points/response/generic_response');
const UserNotFoundException = require('@domain/exception/user_not_found_exception');

class GetUserByEmailHandler {
  constructor() {
    this.userRepository = new UserRepositoryDynamoDB();
    this.getUserByEmailUseCase = new GetUserByEmailUseCase(this.userRepository);
  }

  async handler(event) {
    try {
      const email = event.pathParameters?.email;
      console.log(`GetUserByEmailHandler -> email recibido: ${email}`);

      if (!email) {
        return {
          statusCode: 400,
          body: JSON.stringify(
            new ErrorResponse('Email requerido', 'El parámetro email es obligatorio')
          ),
        };
      }

      const user = await this.getUserByEmailUseCase.execute(email);
      const userDTO = UserDTOMapper.toDTO(user);

      return {
        statusCode: 200,
        body: JSON.stringify(
          new SuccessResponse('Usuario obtenido correctamente', userDTO)
        ),
      };
    } catch (error) {
      console.error('Error en GetUserByEmailHandler:', error);

      if (error instanceof UserNotFoundException) {
        return {
          statusCode: 404,
          body: JSON.stringify(
            new ErrorResponse('Usuario no encontrado', error.message)
          ),
        };
      }

      return {
        statusCode: 500,
        body: JSON.stringify(
          new ErrorResponse('Error interno del servidor', error.message)
        ),
      };
    }
  }
}

module.exports = GetUserByEmailHandler;
