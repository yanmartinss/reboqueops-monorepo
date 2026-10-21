import express, { NextFunction, Request, Response } from "express";
import { routes } from "./routes/main.js";
import { AppError } from "./errors/AppError.js";

const PORT = process.env.PORT || 4000;

const server = express();
server.use(express.json());
server.use("/api", routes);
server.use((err: Error, req: Request, res: Response, next: NextFunction) => {
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

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
