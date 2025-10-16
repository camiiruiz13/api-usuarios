const UserDTO = require('@infra/entry-points/dto/user_dto');
const UserModel = require('@domain/model/user_model');

class UserDTOMapper {
  static toDomain(userDto) {
   
    if (!userDto || (!userDto.idUser && !userDto.id) || !userDto.name || !userDto.email) {
      throw new Error('Datos incompletos para crear UserModel');
    }

    return new UserModel(
      userDto.idUser || userDto.id,
      userDto.name,
      userDto.email
    );
  }

  static toDTO(userModel) {
    if (!userModel || !userModel.id || !userModel.name || !userModel.email) {
      throw new Error('Datos incompletos para crear UserDTO');
    }

    return new UserDTO({
      idUser: userModel.id,
      name: userModel.name,
      email: userModel.email
    });
  }
}

module.exports = UserDTOMapper;