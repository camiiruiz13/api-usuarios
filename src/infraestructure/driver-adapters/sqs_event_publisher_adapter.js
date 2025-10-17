const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');

class SQSEventPublisherAdapter {
    constructor() {
        this.client = new SQSClient({ region: process.env.AWS_REGION });
        this.queueUrl = process.env.QUEUE_URL;
    }

    async publish(event) {
        const command = new SendMessageCommand({
            QueueUrl: this.queueUrl,
            MessageBody: JSON.stringify(event),
        });
        await this.client.send(command);
    }
}

module.exports = SQSEventPublisherAdapter;
