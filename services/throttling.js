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

module.exports = {

    lastRequestedAt: lastRequestedAt,

    isThrottled: (req, actionName, allowedOnceEverySeconds) => {

        const now = currentEpochTimeSeconds();
        const lastAt = lastRequestedAt(req, actionName);

        return (now - lastAt) < allowedOnceEverySeconds;
    }
};