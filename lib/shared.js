const Logger = require("./logger");
const { track } = require("../config");

// Logger
const logger = new Logger();
const messageLogger = new Logger("message");
let trackLogger = null;
if (track) trackLogger = new Logger("track", false, true);

module.exports = { logger, messageLogger, trackLogger };