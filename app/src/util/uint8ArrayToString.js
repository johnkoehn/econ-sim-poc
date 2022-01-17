const textDecoder = new TextDecoder();

const uint8ArrayToString = (array) => {
    return textDecoder.decode(Uint8Array.from(array));
};

export default uint8ArrayToString;
