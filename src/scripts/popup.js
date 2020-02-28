'use strict';

const log = chrome.extension.getBackgroundPage().console.log;
window.onload = function() {
  chrome.tabs.getSelected(null, function(tab) {
    const { url } = tab;
    // localStorage.setItem('test', 1);
    log('test', localStorage.getItem('test'));
    log('tabUrl', url);
  });
};


// changeColor.onclick = function(element) {
//   let color = element.target.value;
//   chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
//     chrome.tabs.executeScript(tabs[0].id, {
//       code: `document.body.style.backgroundColor = "${  color  }";`,
//     });
//   });
// };
