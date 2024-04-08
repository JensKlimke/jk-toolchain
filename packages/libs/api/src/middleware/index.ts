import {auth} from "./auth";
import {environment} from "./environment";
import {errorHandler} from "./errorHandler";
import {validate} from "./validate";

const Middleware = {
  auth,
  environment,
  errorHandler,
  validate
}

export default Middleware;