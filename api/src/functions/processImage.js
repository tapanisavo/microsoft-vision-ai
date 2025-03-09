const { app } = require('@azure/functions');

app.http('processImage', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (_, __) => {
        return {jsonBody: { text: "Hello, world!"}};
    }
});
