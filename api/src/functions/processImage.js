require('dotenv').config()
const { app } = require('@azure/functions');

app.http('processImage', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, __) => {
        return {jsonBody: { text: process.env.MICROSOFT_VISION_AI_ENDPOINT + ' :: ' + process.env.MICROSOFT_VISION_AI_SECRET }};
    }
});
