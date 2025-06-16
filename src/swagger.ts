import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Octane API",
      version: "1.0.0",
      description: "API documentation for Octane backend",
    },
    servers: [{ url: "https://octane-nine.vercel.app" }],
  },
  apis: ["./dist/src/modules/**/*.js"],
};

const swaggerSpec = swaggerJSDoc(options);
export default swaggerSpec;
