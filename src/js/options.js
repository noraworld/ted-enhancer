function restore() {
  chrome.storage.sync.get({
    deeplApiKey: '',
    deeplApiUrl: 'https://api-free.deepl.com/v2/translate',
    toggleSubtitlesShortcut: 'c',
    toggleTranslationsShortcut: 't',
    togglePauseShortcut: 'a',
    repeatShortcut: 'r',
    togglePlayAndPauseShortcut: 'a',
    subtitleLanguage: '',
    translationLanguage: 'JA',
    subtitleDisabled: false,
    translationDisabled: false,
    pauseSentenceBySentenceEnabled: false,
  }, (storage) => {
    document.querySelector('#deepl-api-key input').value = storage.deeplApiKey
    document.querySelector('#deepl-api-url input').value = storage.deeplApiUrl
    document.querySelector('#toggle-subtitles-shortcut input').value = storage.toggleSubtitlesShortcut
    document.querySelector('#toggle-translations-shortcut input').value = storage.toggleTranslationsShortcut
    document.querySelector('#toggle-pause-shortcut input').value = storage.togglePauseShortcut
    document.querySelector('#repeat-shortcut input').value = storage.repeatShortcut
    document.querySelector('#toggle-play-and-pause-shortcut input').value = storage.togglePlayAndPauseShortcut
    document.querySelector('#subtitle-language-input').value = storage.subtitleLanguage
    document.querySelector('#translation-language-input').value = storage.translationLanguage
    document.querySelector('#subtitle-disabled input').checked = storage.subtitleDisabled
    document.querySelector('#translation-disabled input').checked = storage.translationDisabled
    document.querySelector('#pause-sentence-by-sentence-enabled input').checked = storage.pauseSentenceBySentenceEnabled
  })
}

function save() {
  let deeplApiKey                    = document.querySelector('#deepl-api-key input').value
  let deeplApiUrl                    = document.querySelector('#deepl-api-url input').value
  let toggleSubtitlesShortcut        = document.querySelector('#toggle-subtitles-shortcut input').value
  let toggleTranslationsShortcut     = document.querySelector('#toggle-translations-shortcut input').value
  let togglePauseShortcut            = document.querySelector('#toggle-pause-shortcut input').value
  let repeatShortcut                 = document.querySelector('#repeat-shortcut input').value
  let togglePlayAndPauseShortcut     = document.querySelector('#toggle-play-and-pause-shortcut input').value
  let subtitleLanguage               = document.querySelector('#subtitle-language-input').value
  let translationLanguage            = document.querySelector('#translation-language-input').value
  let subtitleDisabled               = document.querySelector('#subtitle-disabled input').checked
  let translationDisabled            = document.querySelector('#translation-disabled input').checked
  let pauseSentenceBySentenceEnabled = document.querySelector('#pause-sentence-by-sentence-enabled input').checked

  chrome.storage.sync.set({
    deeplApiKey:                    deeplApiKey,
    deeplApiUrl:                    deeplApiUrl,
    toggleSubtitlesShortcut:        toggleSubtitlesShortcut,
    toggleTranslationsShortcut:     toggleTranslationsShortcut,
    togglePauseShortcut:            togglePauseShortcut,
    repeatShortcut:                 repeatShortcut,
    togglePlayAndPauseShortcut:     togglePlayAndPauseShortcut,
    subtitleLanguage:               subtitleLanguage,
    translationLanguage:            translationLanguage,
    subtitleDisabled:               subtitleDisabled,
    translationDisabled:            translationDisabled,
    pauseSentenceBySentenceEnabled: pauseSentenceBySentenceEnabled,
  }, () => {
    document.querySelector('#save').setAttribute('disabled', '')
  })
}

function eventListener() {
  document.querySelector('#save').addEventListener('click', save)

  document.querySelectorAll('.options').forEach(element => {
    element.addEventListener('input', () => {
      document.querySelector('#save').removeAttribute('disabled')
    })

    element.addEventListener('submit', save)
    element.addEventListener('change', save)
  })
}

// Localize by replacing __MSG_***__ meta tags
// https://stackoverflow.com/questions/25467009/internationalization-of-html-pages-for-my-google-chrome-extension#answer-25612056
function localize() {
  let objects = document.querySelectorAll('html')

  for (let i = 0; i < objects.length; i++) {
    let obj = objects[i]
    let valStrH = obj.innerHTML.toString()
    let valNewH = valStrH.replace(/__MSG_(\w+)__/g, (_match, v1) => {
      return v1 ? chrome.i18n.getMessage(v1) : ''
    })

    if (valNewH != valStrH) {
      obj.innerHTML = valNewH
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
