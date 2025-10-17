const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

class SNSEmailPublisherAdapter {
    constructor() {
        this.snsClient = new SNSClient({ region: process.env.AWS_REGION || 'us-east-1' });
        this.topicArn = process.env.SNS_TOPIC_ARN;
    }

    async sendEmail(user) {
        const message = `Se ha creado un nuevo usuario:\n\nNombre: ${user.name}\nEmail: ${user.email}`;
        const command = new PublishCommand({
            TopicArn: this.topicArn,
            Message: message,
            Subject: 'Nuevo usuario creado en API Usuarios',
        });
        await this.snsClient.send(command);
        console.log(`[SNS] Email publicado correctamente en ${this.topicArn}`);
    }
}

module.exports = SNSEmailPublisherAdapter;
