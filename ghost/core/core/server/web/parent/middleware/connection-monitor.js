const logging = require('@tryghost/logging');
const debug = require('@tryghost/debug')('connections');

let activeConnections = 0;
let peakConnections = 0;
let monitorInterval;

function connectionMonitor(req, res, next) {
    activeConnections += 1;
    if (activeConnections > peakConnections) {
        peakConnections = activeConnections;
    }
    debug(`Connection opened. Active: ${activeConnections}`);

    function cleanup() {
        activeConnections -= 1;
        debug(`Connection closed. Active: ${activeConnections}`);
        res.removeListener('finish', cleanup);
        res.removeListener('close', cleanup);
    }

    res.on('finish', cleanup);
    res.on('close', cleanup);
    next();
}

function startMonitoring() {
    if (monitorInterval) {
        return;
    }

    monitorInterval = setInterval(() => {
        logging.info(`Connections - Current: ${activeConnections}, Peak: ${peakConnections}`);
    }, 100);
}

function stopMonitoring() {
    if (monitorInterval) {
        clearInterval(monitorInterval);
        monitorInterval = null;
    }
}

module.exports = {
    connectionMonitor,
    startMonitoring,
    stopMonitoring
}; 