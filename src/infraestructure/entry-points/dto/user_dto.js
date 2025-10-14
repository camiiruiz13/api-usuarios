const { randomUUID } = require('crypto');

class UserDTO {
    constructor({ idUser, name, email }) {
        this.idUser = idUser || randomUUID();
    
    if (!name || typeof name !== 'string' || name.trim() === '') {
        throw new Error('Invalid name');
    }
    
    if (!email || typeof email !== 'string' || !this.validateEmail(email)) {
        throw new Error('Invalid email');
    }
        this.name = name;
        this.email = email;
    }
    
    toJSON() {
        return {
            idUser: this.idUser,
            name: this.name,
            email: this.email
        };
    }

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    }
}

module.exports = UserDTO;