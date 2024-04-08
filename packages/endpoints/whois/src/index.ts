import dotenv from "dotenv";
import {WhoIsApp} from "./module";

// get env variables
dotenv.config();
const port = process.env.PORT_WHOIS || 3004;

WhoIsApp.listen(port, () => {
  console.log(`[whois]: Server is running at http://localhost:${port}`);
});