const UserDTO = require('@infra/entry-points/dto/user_dto');
const UserModel = require('@domain/model/user_model');

class UserDTOMapper {

    static toDomain(userDto) {
    if (!(userDto instanceof UserDTO)) {
      throw new Error('El objeto proporcionado no es una instancia de UserDTO');
    }
    return new UserModel(userDto.idUser, userDto.name, userDto.email);
  }

    static toDTO(userModel) {
    if (!(userModel instanceof UserModel)) {
      throw new Error('El objeto proporcionado no es una instancia de UserModel');
    }
    return new UserDTO({
      idUser: userModel.id,
      name: userModel.name,
      email: userModel.email,
    });
  }
}

module.exports = UserDTOMapper;