import express from "express";
import { routes } from "./routes/main";

const PORT = process.env.PORT || 4000;

const server = express();
server.use(express.json());
server.use("/api", routes);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
