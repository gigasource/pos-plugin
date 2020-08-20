function extractSortQueries(sorts) {
  if (typeof sorts === 'string') sorts = [sorts];
  else if (!Array.isArray(sorts)) throw new Error('sorts param must be an Array or a String');

  sorts = sorts.reduce((acc, sortString) => {
    const sortArray = sortString.split('.'); // example: name.asc, age.desc, default is .asc if not specified
    if (sortArray.length === 1) sortArray.push('asc');
    acc[sortArray[0]] = sortArray[1] === 'desc' ? -1 : 1
    return acc;
  }, {});

  return sorts;
}

function getHost(request) {
  let host = request.headers.host
  if (!host) {
    host = 'https://pos.gigasource.io'
  } else if (!host.startsWith('http')) { // raw ip - localhost
    host = `http://${host}`
  }
  return host
}

module.exports = {
  extractSortQueries,
  getHost
}

