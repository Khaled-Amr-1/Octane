import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Octane API',
      version: '1.0.0',
      description: 'API documentation for Octane backend',
    },
    servers: [
      {
        url: 'http://localhost:3000',
      },
    ],
  },
  apis: ['./src/modules/**/*.ts'],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;