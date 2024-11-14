require('dotenv').config();

const Hapi  = require('@hapi/hapi');
const routes = require('../server/routes');
const loadModel = require('../services/loadModel');
const InputError = require('../exceptions/InputError');

(async () => {
    const server = Hapi.server({
        port: 3000,
        host: '0.0.0.0',
        routes: {
            cors: {
                origin: ['*'],
            },
        },
    });

    const model = await loadModel();
    server.app.model = model;

    server.route(routes);

    // Menangani Extension dalam Hapi
    server.ext('onPreResponse', function(request, h) {
        const response = request.response;

        // Menangani kesalahan input (client-side error)
        if (response instanceof InputError) { // InputError diambil dari './exceptions/InputError'
            const newResponse = h.response({
                status: 'fail',
                message: `Terjadi kesalahan dalam melakukan prediksi`,
            });
            newResponse.code(response.statusCode);
            return newResponse;
        };

        // Menangani kesalahan server (server-side error)
        if (response.isBoom) {
            const newResponse = h.response({
                status: 'fail',
                message: response.message,
            });
            newResponse.code(response.output.statusCode);
            return newResponse;
        };

        return h.continue;
    });

    await server.start();
    console.log(`Server start at ${server.info.uri}`);
})();