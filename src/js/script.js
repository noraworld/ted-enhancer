(function () {
  'use strict'

  var currentTime = 0
  var subtitleEnabled = 1
  var translationEnabled = 1
  var pauseSentenceBySentenceEnabled = 1
  var latestSubtitle = null
  let deeplApiKey
  let deeplApiUrl
  let toggleSubtitlesShortcut
  let toggleTranslationsShortcut
  let togglePauseShortcut
  let repeatShortcut

  function getOptions() {
    chrome.storage.sync.get({
      deeplApiKey: '',
      deeplApiUrl: 'https://api-free.deepl.com/v2/translate',
      toggleSubtitlesShortcut: 'c',
      toggleTranslationsShortcut: 't',
      togglePauseShortcut: 'p',
      repeatShortcut: 'r',
    }, (storage) => {
      deeplApiKey                = storage.deeplApiKey
      deeplApiUrl                = storage.deeplApiUrl
      toggleSubtitlesShortcut    = storage.toggleSubtitlesShortcut
      toggleTranslationsShortcut = storage.toggleTranslationsShortcut
      togglePauseShortcut        = storage.togglePauseShortcut
      repeatShortcut             = storage.repeatShortcut
    })
  }

  var prepare = {
    key: function () {
      window.addEventListener('keydown', (event) => {
        switch (event.key) {
          case toggleSubtitlesShortcut:
            subtitleEnabled = subtitleEnabled ? 0 : 1
            document.querySelector('.css-1bg08yq').style.opacity = subtitleEnabled
            break
          case toggleTranslationsShortcut:
            translationEnabled = translationEnabled ? 0 : 1
            translationEnabled ? translate(currentSubtitle()) : removeTranslationText()
            break
          case togglePauseShortcut:
            pauseSentenceBySentenceEnabled = pauseSentenceBySentenceEnabled ? 0 : 1
            if (!pauseSentenceBySentenceEnabled && document.querySelector('video').paused) {
              document.querySelector('video').play()
            }
            break
          case repeatShortcut:
            document.querySelector('video').currentTime = currentTime
            if (document.querySelector('video').paused) {
              document.querySelector('video').play()
            }
            break
        }

        event.stopPropagation()
      }, true)
    }
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

    removeTranslationText()

    if (!translationEnabled) return

    var content = 'auth_key=' + deeplApiKey + '&text=' + text + '&source_lang=EN&target_lang=JA'

    let url = `${deeplApiUrl}?${content}`

    fetch(url)
      .then(function (response) {
        if (response.ok) {
          return response.json()
        } else {
          console.error('Could not reach the API: ' + response.statusText)
        }
      }).then(function(data) {
        latestSubtitle = text
        console.log(data["translations"][0]["text"])
        document.querySelector('.css-1bg08yq').insertAdjacentHTML(
          'afterend',
          `<span class="${TRANSLATION_CLASS} pointer-events-none absolute bottom-12 w-full lg:bottom-18 transition-transform translate-y-12 delay-4000">${data["translations"][0]["text"]}</span>`
        )
      }).catch(function(error) {
        console.error(error.message)
        document.querySelector('.css-1bg08yq').insertAdjacentHTML(
          'afterend',
          `<span class="${TRANSLATION_CLASS} pointer-events-none absolute bottom-12 w-full lg:bottom-18 transition-transform translate-y-12 delay-4000">${error.message}</span>`
        )
      })
  }

  function currentSubtitle() {
    return document.querySelector('.css-82uonn').innerHTML.replaceAll('<br>', ' ')
  }

  function removeTranslationText() {
    const obsoleteTranslatedTexts = document.querySelectorAll(`.${TRANSLATION_CLASS}`)
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
          document.querySelector('.' + classToLookFor).style.opacity = subtitleEnabled
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
