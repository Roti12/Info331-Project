const winston = require("winston");

const logger = new (winston.Logger)({
    level: 'info',
    // format: winston.formats.json(),
    transports: [
        //
        // - Write to all logs with level `info` and below to `combined.log`
        // - Write all logs error (and below) to `error.log`.
        //
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        // new winston.transports.File({ filename: 'combined.log' })
    ]
});

module.exports = logger;