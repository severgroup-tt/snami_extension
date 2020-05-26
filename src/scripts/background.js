'use strict';

const showMessage = ({ tabId, message, loading = false }) => {
  chrome.tabs.executeScript(tabId, {
    code: `
    if (document.getElementById('content')) {
      document.getElementById('content').innerHTML=\`
      ${
        loading
          ? `
          <div style="text-align: center;">
            <svg id="goo-loader" width="100" height="90" fill="#000" aria-label="audio-loading">
              <filter id="fancy-goo">
                <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
                <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 19 -9" result="goo" />
                <feComposite in="SourceGraphic" in2="goo" operator="atop" />
              </filter>
              <g filter="url(#fancy-goo)" transform="rotate(219.28 50 50)">
                <animateTransform id="mainAnim" attributeName="transform" attributeType="XML" type="rotate" from="0 50 50"
                  to="359 50 50" dur="1.2s" repeatCount="indefinite" />
                <circle cx="50%" cy="41.672" r="11">
                  <animate id="cAnim1" attributeType="XML" attributeName="cy" dur="0.6s" begin="0;cAnim1.end+0.2s"
                    calcMode="spline" values="40;20;40" keyTimes="0;0.3;1"
                    keySplines="0.175, 0.885, 0.320, 1.5; 0.175, 0.885, 0.320, 1.5" />
                </circle>
                <circle cx="50%" cy="60" r="11">
                  <animate id="cAnim2" attributeType="XML" attributeName="cy" dur="0.6s" begin="0.4s;cAnim2.end+0.2s"
                    calcMode="spline" values="60;80;60" keyTimes="0;0.3;1"
                    keySplines="0.175, 0.885, 0.320, 1.5;0.175, 0.885, 0.320, 1.5" />
                </circle>
              </g>
            </svg>
          </div>`
          : ''
      }
    <p>${message}</p>\`
    }
    `,
  });
};

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete') {
    Object.values(FRONT_URL_SNAMI).forEach((item, frontIndex) => {
      if (tab.url.indexOf(`${item}extension.html?ext=${chrome.runtime.id}&login=`) === 0) {
        const login = tab.url.match(/login=([^&]+)/)?.[1];
        const key = tab.url.match(/key=([^&]+)/)?.[1];
        storageLocal.get(
          ['authLogin', 'snamiTwoFactorAuth'],
          ({ authLogin = '', snamiTwoFactorAuth = false }) => {
            if (authLogin && snamiTwoFactorAuth && login === authLogin && key) {
              storageSync.get(
                ['snamiHeaders', 'snamiServerType'],
                ({ snamiHeaders = null, snamiServerType = 0 }) => {
                  if (!snamiHeaders && snamiServerType === frontIndex) {
                    apiSnami.setBaseUrl(
                      snamiServerType
                        ? snamiServerType === 1
                          ? BASE_URL_SNAMI_STAGE
                          : BASE_URL_SNAMI_RC
                        : BASE_URL_SNAMI_PROD,
                    );
                    showMessage({ tabId, message: 'Авторизация...', loading: true });
                    requestSnamiLoginTwoFactor({ login, key }).then(({ data, problem }) => {
                      if (data) {
                        storageSync.set({ snamiHeaders: data }, () => {
                          showMessage({
                            tabId,
                            message: 'Авторизация пройдена, можно использовать расширение.',
                          });
                        });
                      } else {
                        showMessage({
                          tabId,
                          message: problem,
                        });
                      }
                    });
                  } else {
                    showMessage({
                      tabId,
                      message: 'Авторизация уже пройдена, можно использовать расширение.',
                    });
                  }
                },
              );
            }
          },
        );
      }
    });
  }
});
