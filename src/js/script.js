(function () {
  'use strict'

  var currentTime = 0
  var subtitleBlur = BLUR_DEGREE
  var translationBlur = BLUR_DEGREE
  var pauseSentenceBySentenceEnabled = 1
  var latestSubtitle = null

  // shortcuts
  let deeplApiKey
  let deeplApiUrl
  let toggleSubtitlesShortcut
  let toggleTranslationsShortcut
  let togglePauseShortcut
  let repeatShortcut
  let togglePlayAndPauseShortcut
  let subtitleDisabled

  function getOptions() {
    chrome.storage.sync.get({
      deeplApiKey: '',
      deeplApiUrl: 'https://api-free.deepl.com/v2/translate',
      toggleSubtitlesShortcut: 'c',
      toggleTranslationsShortcut: 't',
      togglePauseShortcut: 'a',
      repeatShortcut: 'r',
      togglePlayAndPauseShortcut: 'p',
      subtitleDisabled: false,
    }, (storage) => {
      deeplApiKey                = storage.deeplApiKey
      deeplApiUrl                = storage.deeplApiUrl
      toggleSubtitlesShortcut    = storage.toggleSubtitlesShortcut
      toggleTranslationsShortcut = storage.toggleTranslationsShortcut
      togglePauseShortcut        = storage.togglePauseShortcut
      repeatShortcut             = storage.repeatShortcut
      togglePlayAndPauseShortcut = storage.togglePlayAndPauseShortcut
      subtitleDisabled           = storage.subtitleDisabled
      subtitleBlur               = subtitleDisabled ? BLUR_DEGREE : 0
    })
  }

  var prepare = {
    key: function () {
      window.addEventListener('keydown', (event) => {
        if (keyUnavailable(event)) return

        switch (event.key) {
          case toggleSubtitlesShortcut:
            event.preventDefault()
            subtitleBlur = subtitleBlur ? 0 : BLUR_DEGREE
            document.querySelector(`.${SUBTITLE_CLASS}`).style.filter = `blur(${subtitleBlur}rem)`
            break
          case toggleTranslationsShortcut:
            event.preventDefault()
            translationBlur = translationBlur ? 0 : BLUR_DEGREE
            document.querySelector(`.${TRANSLATION_CLASS}`).style.filter = `blur(${translationBlur}rem)`
            if (!translationBlur) translate(currentSubtitle())
            break
          case togglePauseShortcut:
            event.preventDefault()
            pauseSentenceBySentenceEnabled = pauseSentenceBySentenceEnabled ? 0 : 1
            if (!pauseSentenceBySentenceEnabled && document.querySelector('video').paused) {
              document.querySelector('video').play()
            }
            break
          case repeatShortcut:
            event.preventDefault()
            repeat()
            break
          case togglePlayAndPauseShortcut:
            event.preventDefault()
            togglePlayAndPause()
            break
        }
      }, true)
    }
  }

  function keyUnavailable(event) {
    // when the active focus element is a textarea
    if (document.activeElement.nodeName === 'INPUT' && document.activeElement.getAttribute('type') !== 'range') return true
    if (document.activeElement.nodeName === 'TEXTAREA') return true
    if (document.activeElement.getAttribute('type') === 'text') return true
    if (document.activeElement.isContentEditable === true) return true

    // when the key is pressed along with modifier keys
    if (event.metaKey || event.ctrlKey || event.altKey) return true
  }

  function repeat() {
    document.querySelector('video').currentTime = currentTime

    // avoid conflict with Video Commander
    setTimeout(function() {
      if (document.querySelector('video').paused) document.querySelector('video').play()
    }, 100)
  }

  function togglePlayAndPause() {
    document.querySelector('video').paused ? document.querySelector('video').play() : document.querySelector('video').pause()
  }

  function onplay() {
    if (document.querySelector('video') && document.querySelector('video').readyState === 4) {
      document.querySelector('video').onplay = function () {
        currentTime = document.querySelector('video').currentTime
        console.log(`currentTime is ${currentTime}`)
      }
    }
    else {
      setTimeout(onplay, 1000)
    }
  }

  // https://qiita.com/yaju/items/bf4613393cd4ee402d17#javascript
  function translate(text) {
    if (latestSubtitle === text) {
      console.info('DEBUG: skipped translation because the text is the same as the last one.')
      return
    }

    if (translationBlur) {
      showTranscript(text, '')
      return
    }

    var content = 'auth_key=' + deeplApiKey + '&text=' + text + '&source_lang=EN&target_lang=JA'

    let url = `${deeplApiUrl}?${content}`

    fetch(url)
      .then(function (response) {
        if (response.ok) {
          return response.json()
        } else {
          console.error('Could not reach the API: ' + response.statusText)
          showTranscript(text, response.statusText)
        }
      }).then(function(data) {
        latestSubtitle = text
        showTranscript(text, data["translations"][0]["text"])
        console.log(data["translations"][0]["text"])
      }).catch(function(error) {
        console.error(error.message)
        showTranscript(text, error.message)
      })
  }

  function showTranscript(subtitle = 'Count not retrieve the subtitle', translation = 'Count not retrieve the translation') {
    removeTranslationText()
    document.querySelector('.css-1bg08yq').insertAdjacentHTML(
      'afterend',
      `
        <div class="${SUBTITLE_AND_TRANSLATION_CONTAINER_CLASS}">
          <div class="${SUBTITLE_AND_TRANSLATION_CLASS}">
            <span class="${SUBTITLE_CLASS}"    style="filter: blur(${subtitleBlur}rem);   ">${subtitle}</span>
            <span class="${TRANSLATION_CLASS}" style="filter: blur(${translationBlur}rem);">${translation}</span>
          </div>
        </div>
      `
    )
  }

  function currentSubtitle() {
    return document.querySelector('.css-82uonn').innerHTML.replaceAll('<br>', ' ')
  }

  function removeTranslationText() {
    const obsoleteTranslatedTexts = document.querySelectorAll(`.${SUBTITLE_AND_TRANSLATION_CONTAINER_CLASS},.${SUBTITLE_AND_TRANSLATION_CLASS},.${SUBTITLE_CLASS},.${TRANSLATION_CLASS}`)
    for (const obsoleteTranslatedText of obsoleteTranslatedTexts) {
      obsoleteTranslatedText.remove()
    }
  }

  function pause() {
    if (pauseSentenceBySentenceEnabled) {
      // document.querySelector('video').currentTime -= 0.2
      document.querySelector('video').pause()
    }
  }

  // https://bobbyhadz.com/blog/detect-when-element-is-added-or-removed-from-dom-using-javascript
  const startObserving = (domNode, classToLookFor) => {
    const observer = new MutationObserver(mutations => {
      mutations.forEach(function (mutation) {
        const elementRemoved = Array.from(
          mutation.removedNodes,
        ).some(element => {
          if (element.classList) {
            return element.classList.contains(classToLookFor);
          } else {
            return false;
          }
        });

        if (elementRemoved) {
          pause()
          // console.log('The element was removed to the DOM');
        }

        const elementAdded = Array.from(mutation.addedNodes).some(
          element => {
            if (element.classList) {
              return element.classList.contains(classToLookFor);
            } else {
              return false;
            }
          },
        );

        if (elementAdded) {
          // console.log('The element was added to the DOM');
          document.querySelector('.' + classToLookFor).style.opacity = 0
          const elem = document.querySelector('.' + classToLookFor);
          observer2.observe(elem, config);
          translate(currentSubtitle())
        }
      });
    });

    observer.observe(domNode, {
      childList: true,
      attributes: true,
      characterData: true,
      subtree: true,
    });

    return observer;
  };

  // https://pisuke-code.com/mutation-observer-usage/
  var observer2 = new MutationObserver(function() {
    pause()
    translate(currentSubtitle())
  });

  const config = {
    childList: true,
    attributes: true,
    characterData: true,
    subtree: true,
  };

  getOptions()
  startObserving(document.body, 'css-1bg08yq');
  prepare.key()
  onplay()
}());
