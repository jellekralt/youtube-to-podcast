module.exports = {
    parse: function parseRange(rangeString) {
        let parts = rangeString.split('=')[1].split('-');
        let start = parseInt(parts[0], 10);
        let end = parseInt(parts[1], 10) || -1;

        return { start: start, end: end };
    }
};