const _ = require("lodash");

function getDateTitle() {
    const dateObj = new Date();
    const dateFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
    return dateObj.toLocaleDateString("en-US", dateFormatOptions);
}

function formatTitle(title) {
    if (hasWhiteSpace(title)) {
        return _.startCase(_.toLower(title));
    }
    else {
        return title;
    }
}

function hasWhiteSpace(s) {
    return s.indexOf(' ') >= 0;
}

module.exports = {
    getDateTitle, formatTitle, hasWhiteSpace
}