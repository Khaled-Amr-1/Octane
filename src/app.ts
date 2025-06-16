import express from "express";
import "dotenv/config";
import userRoutes from "./modules/user/user.routes.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swagger.js";

const app = express();
app.use(express.json());
app.use("/api", userRoutes);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));


export default app;
