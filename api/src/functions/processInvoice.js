require('dotenv').config()

const { app } = require('@azure/functions');
const DocumentIntelligence = require("@azure-rest/ai-document-intelligence").default;
const { getLongRunningPoller, isUnexpected } = require("@azure-rest/ai-document-intelligence");

const endpoint = process.env.MICROSOFT_VISION_AI_ENDPOINT;
const key = process.env.MICROSOFT_VISION_AI_SECRET;

app.http('processInvoice', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log('Creating client');
        const client = DocumentIntelligence(endpoint, {key: key});

        context.log('Sending the file');
        const initialResponse = await client
            .path("/documentModels/{modelId}:analyze", "prebuilt-invoice")
            .post({
                contentType: "application/json",
                body: {
                    base64Source: request.params.dataUrl
                }
            });

        context.log('File sent');
        if (isUnexpected(initialResponse)) {
            return {body: JSON.stringify({result: initialResponse.body.error})};
        }

        context.log('Polling the results...');
        const poller = await getLongRunningPoller(client, initialResponse);

        // Some hack to check if the poller has the polling function, 
        // since sometimes getLongRunningPoller returns the actual results instead of a poller
        if (Object.prototype.hasOwnProperty.call(poller, 'pollUntilDone')) {
            context.log('Returning polled result');
            return {body: JSON.stringify({result:(await poller.pollUntilDone()).body}) };
        }
        else if (Object.prototype.hasOwnProperty.call(poller, 'body')) {
            context.log('Returning direct result');
            return {body: JSON.stringify({result:poller.body}) };
        }
        
        return {body: JSON.stringify({result: 'File processing failed!'})};
    }
});