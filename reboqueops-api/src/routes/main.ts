import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";

export const routes = Router();

routes.get("/ping", (req, res) => {
  res.status(200).json({ pong: true });
});

routes.post("/register", authController.register);
