import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.js";
import { requireOwner } from "../middleware/require-owner.js";
import * as invitationController from "../controllers/invitation.controller.js";

export const routes = Router();

routes.get("/ping", (req, res) => {
  res.status(200).json({ pong: true });
});

routes.post("/register", authController.register);
routes.post("/login", authController.login);
routes.get("/me", authMiddleware, authController.getMe);
routes.post(
  "/invitations",
  authMiddleware,
  requireOwner,
  invitationController.invite,
);
