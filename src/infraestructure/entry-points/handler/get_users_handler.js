const UserDTOMapper = require('@infra/entry-points/mapper/user_dto_mapper');
const UserRepositoryDynamoDB = require('@driver/user_repository_dynamodb');
const GetAllUsersUseCase = require('@domain/usecase/get_users_use_case');
const { SuccessResponse, ErrorResponse } = require('@infra/entry-points/response/generic_response');
const NoUsersFoundException = require('@domain/exception/no_users_found_exception');


class GetUsersHandler {
  constructor() {
    this.userRepository = new UserRepositoryDynamoDB ();
    this.getAllUsersUseCase = new GetAllUsersUseCase(this.userRepository);
  }

  async handler() {
    try {
      const users = await this.getAllUsersUseCase.execute();
      const usersDTO = users.map(user => UserDTOMapper.toDTO(user));

      return {
        statusCode: 200,
        body: JSON.stringify(
          new SuccessResponse('Usuarios obtenidos correctamente', usersDTO)
        ),
      };
    } catch (error) {
      if (error instanceof NoUsersFoundException) {
        return {
          statusCode: 404,
          body: JSON.stringify(
            new ErrorResponse('No se encontraron usuarios', error.message)
          ),
        };
      }

      return {
        statusCode: 500,
        body: JSON.stringify(
          new ErrorResponse('Error al obtener los usuarios', error.message)
        ),
      };
    }
  }
}

module.exports = GetUsersHandler;