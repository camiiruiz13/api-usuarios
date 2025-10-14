const CreateUserHandler = require('@infra/entry-points/handler/create_user_handler');
const GetUsersHandler = require('@infra/entry-points/handler/get_users_handler');
const GetUserByEmailHandler = require('@infra/entry-points/handler/get_user_by_email_handler');

class ServiceRouteRest {
  constructor() {
    this.createUserHandler = new CreateUserHandler();
    this.getUsersHandler = new GetUsersHandler();
    this.getUserByEmailHandler = new GetUserByEmailHandler();
  }

  async getUsers(event) {
    return await this.getUsersHandler.handler(event);
  }

  async createUser(event) {
    return await this.createUserHandler.handler(event);
  }

  async getUserByEmail(event) {
    return await this.getUserByEmailHandler.handler(event);
  }
}

module.exports = ServiceRouteRest;
