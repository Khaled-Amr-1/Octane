import swaggerJSDoc from "swagger-jsdoc";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  apis: [path.resolve(__dirname, "./modules/user/user.routes.ts")],
};

const swaggerSpec = swaggerJSDoc(options);
console.log(JSON.stringify(swaggerSpec, null, 2));
export default swaggerSpec;