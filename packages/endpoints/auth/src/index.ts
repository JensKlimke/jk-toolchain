import {ItemModule} from "./routes";
import process from "process";

// get env variables
const port = process.env.PORT || 3003;
const env = process.env.API_ENV || 'prod';

// start server
ItemModule.listen(port, () => {
  console.log(`[auth]: Server is running at http://localhost:${port} in ${env} mode.`);
});