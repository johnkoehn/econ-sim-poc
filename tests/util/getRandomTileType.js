const getRandomInt = (max) => {
    return Math.floor(Math.random() * max);
}

const tileTypes = {
    '0': { food: {} },
    '1': { iron: {} },
    '2': { coal: {} },
    '3': { wood: {} },
    '4': { rareMetals: {} },
    '5': { herbs: {} },
}

const getRandomTileType = () => tileTypes[getRandomInt(Object.keys(tileTypes).length)]

module.exports = getRandomTileType;
