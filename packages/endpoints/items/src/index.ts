import dotenv from "dotenv";
import {ItemModule} from "./module";
import {API_ENV} from "@sdk/api-lib/lib/config/env";

// get env variables
dotenv.config();
const port = process.env.PORT_ITEMS || 3001;

// start server
ItemModule.listen(port, () => {
  console.log(`[items]: Server is running at http://localhost:${port} in ${API_ENV} mode.`);
});