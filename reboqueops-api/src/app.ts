import express, { NextFunction, Request, Response } from "express";
import { routes } from "./routes/main.js";
import { AppError } from "./errors/AppError.js";

export const app = express();

app.use(express.json());
app.use("/api", routes);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    return res
      .status(err.statusCode)
      .json({ status: "error", message: err.message });
  }

  console.error(err);
  return res
    .status(500)
    .json({ status: "error", message: "Internal server error" });
});
