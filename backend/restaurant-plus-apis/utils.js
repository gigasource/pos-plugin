function respondWithError(res, status, msg) {
  res.status(status);

  if (msg) res.json({error: msg});
  else res.send();
}

module.exports = {
  respondWithError,
}
