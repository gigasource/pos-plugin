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

function requestPathVarHasProps(req, res, props) {
  for (const prop of props) {
    if (!req.params || !req.params[prop]) {
      res.status(400).send('Missing properties in request');
      return false
    }
  }

  return true;
}

function requestQueryHasProps(req, res, props) {
  for (const prop of props) {
    if (!req.query || !req.query[prop]) {
      res.status(400).send('Missing properties in request');
      return false
    }
  }

  return true;
}

function requestBodyHasProps(req, res, props) {
  for (const prop of props) {
    if (!req.body || !req.body[prop]) {
      res.status(400).send('Missing properties in request');
      return false
    }
  }

  return true;
}

function respondWithError(res, status, msg) {
  res.status(status);
  console.error(msg);

  if (msg && typeof msg === 'string') res.send(msg);
  else if (msg && typeof msg === 'object') res.json(msg);
  else res.send();
}

module.exports = {
  extractSortQueries,
  getHost,
  requestQueryHasProps,
  requestBodyHasProps,
  requestPathVarHasProps,
  respondWithError,
}

