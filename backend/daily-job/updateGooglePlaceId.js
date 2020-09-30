const axios = require('axios')
const dayjs = require('dayjs')

let lastRun = dayjs()
let storeGoogleMapPlaceIdMap = {}

// https://developers.google.com/places/place-id#save-id

const _queue = []
function pushStoreUpdateFnToQueue(store) {
  if (!store)
    return;

  const { _id, name, settingName, googleMapPlaceId } = store
  if (!googleMapPlaceId)
    return;

  _queue.push(async () => {
    try {
      // console.log(`Update google map id for "${name || settingName}"`)
      const response = await getPlaceDetail(googleMapPlaceId)
      if (!response)
        return;
      // https://developers.google.com/places/web-service/details#PlaceDetailsStatusCodes
      switch (response.status) {
        case 'OK':
          if (response.result && response.result.place_id) {
            storeGoogleMapPlaceIdMap[_id] = response.result.place_id
          }
          break;
        case 'UNKNOWN_ERROR':
          // server error
          break;
        case 'ZERO_RESULTS':
          // old place id is valid but newer value is no longer refers to a valid result.
          // this may occur if the establishment is no longer in business
          // storeGoogleMapPlaceIdMap[_id] = ''
          break;
        case 'OVER_QUERY_LIMIT':
          // You have exceeded the QPS limits.
          break;
        case 'REQUEST_DENIED':
          // console.debug('sentry:updateGooglePlaceId: request denied, verify "key" provided!')
          break;
        case 'INVALID_REQUEST':
          // console.debug('sentry:updateGooglePlaceId: invalid request!')
          break;
        case 'NOT_FOUND':
          console.debug('sentry:updateGooglePlaceId: invalid place id');
          storeGoogleMapPlaceIdMap[_id] = ''
          break;
      }
    } catch (e) {
      console.log('Update google map place id exception', e)
    }
  })
}

async function runQueue(throtle) {
  if (_queue.length > 0) {
    const queueItem = _queue.shift()
    await queueItem()
    setTimeout(async () => await runQueue(), throtle)
  }
}

module.exports = async function updateGooglePlaceId() {
  const today = dayjs()
  if (lastRun.format('YYYY-MM-DD') !== today.format('YYYY-MM-DD')) {
    storeGoogleMapPlaceIdMap = {}
  }
  const stores = await cms.getModel('Store').find({})
  stores.forEach(pushStoreUpdateFnToQueue)
  _queue.push(saveNewGoogleMapPlaceId)
  runQueue(100)
}

async function saveNewGoogleMapPlaceId() {
  console.log('saving new google map place id', storeGoogleMapPlaceIdMap)
  try {
    const bulkWriteData = Object.keys(storeGoogleMapPlaceIdMap).map(storeId => ({
      updateOne: {
        filter: { _id: storeId },
        update: { googleMapPlaceId: storeGoogleMapPlaceIdMap[storeId] },
        upsert: false,
      }
    }))
    await cms.getModel('Store').bulkWrite(bulkWriteData)
  } catch (e) {
    console.log('save new google map place id failed', e)
  }
  lastRun = dayjs()
}

async function getPlaceDetail(googlePlaceId) {
  const {mapsApiKey} = global.APP_CONFIG;
  if (!mapsApiKey)
    return null;
  try {
    const placeDetailUrl = 'https://maps.googleapis.com/maps/api/place/details/json';
    const { data } = await axios.get(placeDetailUrl, {
      params: {
        key: mapsApiKey,
        place_id: googlePlaceId,
        fields: 'place_id'
      }
    })
    return data;
  } catch (e) {
    return null;
  }
}
