import log from "loglevel";

export const LOG_SYSTEM_KEY = process.env.LOG_SYSTEM_KEY || 'SDK';

export const logger = log.getLogger(LOG_SYSTEM_KEY);
