const { app } = require('@azure/functions');

app.http('processImage', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (_, __) => {
        return { body: `Hello, from the API!` };
    }
});
