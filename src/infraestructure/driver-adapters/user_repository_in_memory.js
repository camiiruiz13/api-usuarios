class UserRepositoryInMemory {

    constructor() {
        this.users = new Map();
    }

    async save(userModel) {
    this.users.set(userModel.idUser, userModel);
    return userModel;
  }

  async findAll() {
    return Array.from(this.users.values());
  }

  async findByEmail(email) {
    const values = Array.from(this.users.values());
    return values.find(user => user.email === email) || null;
  }

  clear() {
    this.users.clear();
  }
}
module.exports = UserRepositoryInMemory;