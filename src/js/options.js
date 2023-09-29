function restore() {
  chrome.storage.sync.get({
    deeplApiKey: '',
    deeplApiUrl: 'https://api-free.deepl.com/v2/translate',
  }, (storage) => {
    document.querySelector('#deepl-api-key input').value = storage.deeplApiKey
    document.querySelector('#deepl-api-url input').value = storage.deeplApiUrl
  })
}

function save() {
  let deeplApiKey = document.querySelector('#deepl-api-key input').value
  let deeplApiUrl = document.querySelector('#deepl-api-url input').value

  chrome.storage.sync.set({
    deeplApiKey: deeplApiKey,
    deeplApiUrl: deeplApiUrl,
  }, () => {
  })
}

function eventListener() {
  document.querySelector('#deepl-api-key').addEventListener('submit', function(event) {
    event.preventDefault()
    save()
  })

  document.querySelector('#deepl-api-url').addEventListener('submit', function(event) {
    event.preventDefault()
    save()
  })
}

// Localize by replacing __MSG_***__ meta tags
// https://stackoverflow.com/questions/25467009/internationalization-of-html-pages-for-my-google-chrome-extension#answer-25612056
function localize() {
  let objects = document.querySelectorAll('html');

  for (let i = 0; i < objects.length; i++) {
    let obj = objects[i];
    let valStrH = obj.innerHTML.toString();
    let valNewH = valStrH.replace(/__MSG_(\w+)__/g, (_match, v1) => {
      return v1 ? chrome.i18n.getMessage(v1) : '';
    });

    if (valNewH != valStrH) {
      obj.innerHTML = valNewH;
    }
  }
}

(function() {
  window.addEventListener('DOMContentLoaded', () => {
    localize() // must be loaded at first because if not so, setting event listener will not work
    eventListener()
    restore()
  })
}())
