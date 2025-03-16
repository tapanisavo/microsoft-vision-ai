require('dotenv').config()

const { app } = require('@azure/functions');
const DocumentIntelligence = require("@azure-rest/ai-document-intelligence").default;
const { getLongRunningPoller, isUnexpected } = require("@azure-rest/ai-document-intelligence");

const endpoint = process.env.MICROSOFT_VISION_AI_ENDPOINT;
const key = process.env.MICROSOFT_VISION_AI_SECRET;

app.http('processImage', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: ({ imageUrl }, __) => ({jsonBody: {result: processImage(imageUrl)}})
});

async function processImage(imageUrl) {
    const client = DocumentIntelligence(endpoint, {key: key});
    const initialResponse = await client
        .path("/documentModels/{modelId}:analyze", "prebuilt-receipt")
        .post({
        contentType: "application/json",
        body: {
            base64Source: imageUrl
        }
    });

    if (isUnexpected(initialResponse)) {
        return initialResponse.body.error;
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const poller = await getLongRunningPoller(client, initialResponse);
    // Some hack to check if the poller has the polling function, 
    // since sometimes getLongRunningPoller returns the actual results instead of a poller
    if (Object.prototype.hasOwnProperty.call(poller, 'pollUntilDone')) {
        return (await poller.pollUntilDone()).body;
    }
    else if (Object.prototype.hasOwnProperty.call(poller, 'body')) {
        return poller.body;
    }
    
    return 'Image processing failed!';
}