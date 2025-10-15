const { DynamoDBClient, PutItemCommand, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');
const UserModel = require('@domain/model/user_model');

class UserRepositoryDynamoDB {
  constructor() {
    this.client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
    this.tableName = process.env.USERS_TABLE;
  }


  async save(userModel) {
    const item = {
      id: userModel.id,
      name: userModel.name,
      email: userModel.email
    };

    await this.client.send(
        new PutItemCommand({
          TableName: this.tableName,
          Item: marshall(item)
        })
    );

    return userModel;
  }


  async findAll() {
    const data = await this.client.send(
        new ScanCommand({
          TableName: this.tableName
        })
    );

    if (!data.Items || data.Items.length === 0) {
      return [];
    }

    return data.Items.map(item => {
      const plain = unmarshall(item);
      return new UserModel(plain.id, plain.name, plain.email);
    });
  }


  async findByEmail(email) {
    const data = await this.client.send(
        new ScanCommand({
          TableName: this.tableName,
          FilterExpression: 'email = :email',
          ExpressionAttributeValues: {
            ':email': { S: email }
          }
        })
    );

    if (!data.Items || data.Items.length === 0) {
      return null;
    }

    const plain = unmarshall(data.Items[0]);
    return new UserModel(plain.id, plain.name, plain.email);
  }
}

module.exports = UserRepositoryDynamoDB;
