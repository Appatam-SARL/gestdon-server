import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Contrib API',
      version: '1.0.0',
      description:
        'API pour le service de gestion des dons communautaire Contrib',
      contact: {
        name: 'Équipe Contrib',
        email: 'contact@appatam.com',
      },
    },
    servers: [
      {
        url: '/v1/api',
        description: 'Serveur de développement',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/models/*.ts', './src/docs/*.yaml'],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
