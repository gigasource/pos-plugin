const geolib = require('geolib');

async function getCoordsByPostalCode(code, address) {
  // TODO: support countries
  let url = `https://maps.googleapis.com/maps/api/geocode/json?components=postal_code:${code}|country:DE&key=${global.APP_CONFIG.mapsApiKey}`;
  if (address) url += `&address=${encodeURI(address)}`;
  const response = await axios.get(url);
  const {results} = response.data;
  if (!results || !results.length) return;

  const {geometry: {location: {lat: latitude, lng: longitude}}} = results[0];
  return {latitude, longitude};
}

function createGeoLocationEventListeners(socket) {
  socket.on('getDistanceByPostalCode', async (code, fromCoords, callback) => {
    const toCoords = await getCoordsByPostalCode(code);
    if (!toCoords || !fromCoords) return callback();

    const distance = geolib.getPreciseDistance(fromCoords, toCoords) / 1000;   //distance in km
    callback(distance);
  });

  socket.on('getCoordsByGoogleApi', async (zipCode, address, callback) => {
    const result = await getCoordsByPostalCode(zipCode, address);
    if (!result) return callback();
    const {latitude, longitude} = result;
    callback({long: longitude, lat: latitude});
  });
}

module.exports = createGeoLocationEventListeners;
