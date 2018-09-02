const constants = require('./constants');

function currentEpochTimeSeconds() {

    return Math.floor((new Date).getTime() / 1000);
}

const latestActions = {};

function lastRequestedAt(req, actionName) {

    const id = req.sourceAddress + '_' + actionName;
    const result = latestActions[id] || 0;

    latestActions[id] = currentEpochTimeSeconds();

    return result;
}

function isThrottled(req, actionName, allowedOnceEverySeconds) {

    const now = currentEpochTimeSeconds();
    const lastAt = lastRequestedAt(req, actionName);

    return (now - lastAt) < allowedOnceEverySeconds;
}

module.exports = {

    intercept: (actionName, allowedOnceEverySeconds) => {

        return (req, res, next) => {

            if (isThrottled(req, actionName, allowedOnceEverySeconds)) {

                res.sendJson({

                    status: constants.statusCodes.throttled
                });
                return;
            }

            next();
        }
    }
};