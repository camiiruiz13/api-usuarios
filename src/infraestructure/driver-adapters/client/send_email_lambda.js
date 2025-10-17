const SNSEmailPublisherAdapter = require('./sns_email_publisher_adapter');

exports.handler = async (event) => {
    const snsPublisher = new SNSEmailPublisherAdapter();

    for (const record of event.Records) {
        const body = JSON.parse(record.body);
        const user = body.data;
        await snsPublisher.sendEmail(user);
    }

    return { statusCode: 200, body: 'Correos enviados correctamente' };
};
