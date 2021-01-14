const {ObjectID} = require("bson");
function convertNameToTestFunction(name) {
  return typeof name === 'function' ? name : _name => name === _name;
}

function stringify() {
  return JSON.parse(
    JSON.stringify(
      arguments[0],
      function (k, v) {
        if (k === 'uuid') return 'uuid-v1'
        if (
          this[k] instanceof ObjectID ||
          (typeof this[k] === "object" && ObjectID.isValid(this[k]))
        ) {
          return "ObjectID";
        }
        if (typeof this[k] === "string" && this[k].length === 24 && ObjectID.isValid(this[k])) {
          return "ObjectID";
        }
        if (k === 'chain') {
          let result = stringify(JSON.parse(this[k]));
          result = JSON.stringify(result);
          return result;
        }
        return v;
      },
      4
    )
  );
}

const util = require('util');
const inspect = (obj) => util.inspect(obj, {depth: 1});

module.exports = {
  convertNameToTestFunction,
  stringify,
  inspect
}
