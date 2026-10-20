import { Router } from "express";

export const routes = Router();

routes.get("/ping", (req, res) => {
  res.status(200).json({ pong: true });
});
