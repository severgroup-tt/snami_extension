const APP_NAME_SNAMI = 'Snami';
const BASE_URL_SNAMI_PROD = 'https://api.snami.work/';
const BASE_URL_SNAMI_STAGE = 'https://api-stage.snami.work/';
const BASE_URL_SNAMI_RC = 'https://api-rc.snami.work/';
const APP_NAME_POTOK = 'Potok';
const BASE_URL_POTOK = 'https://app.potok.io/';
const FRONT_URL_SNAMI = {
  [BASE_URL_SNAMI_PROD]: 'https://lk.snami.work/',
  [BASE_URL_SNAMI_STAGE]: 'https://lk-new-stage.snami.work/',
  [BASE_URL_SNAMI_RC]: 'https://lk-new-rc.snami.work/',
};

const storageSync = chrome.storage.sync;
const storageLocal = chrome.storage.local;
// storageSync.clear();
// storageLocal.clear();
