const { DateTime } = require('luxon');

const calculateResourcesPerCycle = (level) => {
    const levelPower = Math.floor(level / 10);

    return (12 * level) * (2 ** levelPower);
};

const calculateMaxCapacity = (level, cyclesPerPeriod) => {
    const resourcePerCycle = calculateResourcesPerCycle(level);

    return resourcePerCycle * cyclesPerPeriod;
};

const calculateCapacity = (tile, gameAccount) => {
    const level = tile.level;
    const lastCycleTime = tile.lastCycleTime.toNumber();
    const cyclesPerPeriod = gameAccount.cyclesPerPeriod;
    const cycleTime = gameAccount.cycleTime;

    const maxCapacity = calculateMaxCapacity(level, cyclesPerPeriod);

    // get time passed since last cycle time
    // get cycle passed
    // calc new capacity
    // if less then max that new cap
    const now = DateTime.now();
    const lastCycleDateTime = DateTime.fromSeconds(lastCycleTime);
    const diff = Math.floor(now.diff(lastCycleDateTime, 'seconds').seconds);
    const cyclesPassed = Math.floor(diff / cycleTime);

    const resourcePerCycle = calculateResourcesPerCycle(level);

    const possibleCapacity = tile.capacity + (resourcePerCycle * cyclesPassed);

    return possibleCapacity < maxCapacity ? possibleCapacity : maxCapacity;
};

module.exports = {
    calculateResourcesPerCycle,
    calculateMaxCapacity,
    calculateCapacity
};
