// https://www.redblobgames.com/grids/hexagons/ -- amazing blog post

const numberOfTilesCalculator = (lengthFromCenter) => {
    // only one tile the center :)
    if (lengthFromCenter === 0) {
        return 1;
    }

    const length = (lengthFromCenter * 2) + 1;

    // bottom width is the number of tiles that make up the "bottom" of the map
    // 3 - 1 = 2
    // 5 - 2 = 3
    // 7 - 3 = 4
    const bottomLength = length - lengthFromCenter;

    let sum = length;
    let currentRowLength = length - 1;
    do {
        // all non center rows have a sister above/below it :)
        sum += currentRowLength * 2;
        currentRowLength -= 1;
    } while (currentRowLength >= bottomLength);

    return sum;
}

module.exports = numberOfTilesCalculator;