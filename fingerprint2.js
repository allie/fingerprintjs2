/*
* Fingerprintjs2 1.8.0 - Modern & flexible browser fingerprint library v2
* https://github.com/Valve/fingerprintjs2
* Copyright (c) 2015 Valentin Vasilyev (valentin.vasilyev@outlook.com)
* Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) license.
*
* THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
* AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
* IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
* ARE DISCLAIMED. IN NO EVENT SHALL VALENTIN VASILYEV BE LIABLE FOR ANY
* DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
* (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
* LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
* ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
* (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
* THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

(function (name, context, definition) {
  'use strict'
  if (typeof window.define === 'function' && window.define.amd) { window.define(definition) } else if (typeof module !== 'undefined' && module.exports) { module.exports = definition() } else if (context.exports) { context.exports = definition() } else { context[name] = definition() }
})('Fingerprint2', this, function () {
  'use strict'
  /**
   * @constructor
   * @param {Object=} options
   */
  var Fingerprint2 = function (options) {
    if (!(this instanceof Fingerprint2)) {
      return new Fingerprint2(options)
    }

    var defaultOptions = {
      detectScreenOrientation: true,
      sortPluginsFor: [/palemoon/i],
      userDefinedFonts: [],
      excludeDoNotTrack: true,
      excludePixelRatio: true
    }
    this.options = this.extend(options, defaultOptions)
    this.nativeForEach = Array.prototype.forEach
    this.nativeMap = Array.prototype.map
  }
  Fingerprint2.prototype = {
    extend: function (source, target) {
      if (source == null) { return target }
      for (var k in source) {
        if (source[k] != null && target[k] !== source[k]) {
          target[k] = source[k]
        }
      }
      return target
    },
    get: function (done) {
      var that = this
      var keys = {
        data: [],
        addPreprocessedComponent: function (pair) {
          var componentValue = pair.value
          if (typeof that.options.preprocessor === 'function') {
            componentValue = that.options.preprocessor(pair.key, componentValue)
          }
          keys.data.push({key: pair.key, value: componentValue})
        }
      }
      keys = this.userAgentKey(keys)
      keys = this.languageKey(keys)
      keys = this.colorDepthKey(keys)
      keys = this.deviceMemoryKey(keys)
      keys = this.pixelRatioKey(keys)
      keys = this.hardwareConcurrencyKey(keys)
      keys = this.screenResolutionKey(keys)
      keys = this.availableScreenResolutionKey(keys)
      keys = this.timezoneOffsetKey(keys)
      keys = this.sessionStorageKey(keys)
      keys = this.localStorageKey(keys)
      keys = this.indexedDbKey(keys)
      keys = this.addBehaviorKey(keys)
      keys = this.openDatabaseKey(keys)
      keys = this.cpuClassKey(keys)
      keys = this.platformKey(keys)
      keys = this.doNotTrackKey(keys)
      keys = this.pluginsKey(keys)
      keys = this.canvasKey(keys)
      keys = this.hasLiedLanguagesKey(keys)
      keys = this.hasLiedResolutionKey(keys)
      keys = this.hasLiedOsKey(keys)
      keys = this.hasLiedBrowserKey(keys)
      keys = this.touchSupportKey(keys)
      keys = this.customEntropyFunction(keys)
      this.fontsKey(keys, function (newKeys) {
        var values = []
        that.each(newKeys.data, function (pair) {
          var value = pair.value
          if (value && typeof value.join === 'function') {
            value = value.join(';')
          }
          values.push(value)
        })
        var murmur = that.x64hash128(values.join('~~~'), 31)
        return done(murmur, newKeys.data)
      })
    },
    customEntropyFunction: function (keys) {
      if (typeof this.options.customFunction === 'function') {
        keys.addPreprocessedComponent({key: 'custom', value: this.options.customFunction()})
      }
      return keys
    },
    userAgentKey: function (keys) {
      if (!this.options.excludeUserAgent) {
        keys.addPreprocessedComponent({key: 'user_agent', value: this.getUserAgent()})
      }
      return keys
    },
    // for tests
    getUserAgent: function () {
      return navigator.userAgent
    },
    languageKey: function (keys) {
      if (!this.options.excludeLanguage) {
        // IE 9,10 on Windows 10 does not have the `navigator.language` property any longer
        keys.addPreprocessedComponent({ key: 'language', value: navigator.language || navigator.userLanguage || navigator.browserLanguage || navigator.systemLanguage || '' })
      }
      return keys
    },
    colorDepthKey: function (keys) {
      if (!this.options.excludeColorDepth) {
        keys.addPreprocessedComponent({key: 'color_depth', value: window.screen.colorDepth || -1})
      }
      return keys
    },
    deviceMemoryKey: function (keys) {
      if (!this.options.excludeDeviceMemory) {
        keys.addPreprocessedComponent({key: 'device_memory', value: this.getDeviceMemory()})
      }
      return keys
    },
    getDeviceMemory: function () {
      return navigator.deviceMemory || -1
    },
    pixelRatioKey: function (keys) {
      if (!this.options.excludePixelRatio) {
        keys.addPreprocessedComponent({key: 'pixel_ratio', value: this.getPixelRatio()})
      }
      return keys
    },
    getPixelRatio: function () {
      return window.devicePixelRatio || ''
    },
    screenResolutionKey: function (keys) {
      if (!this.options.excludeScreenResolution) {
        return this.getScreenResolution(keys)
      }
      return keys
    },
    getScreenResolution: function (keys) {
      var resolution
      if (this.options.detectScreenOrientation) {
        resolution = (window.screen.height > window.screen.width) ? [window.screen.height, window.screen.width] : [window.screen.width, window.screen.height]
      } else {
        resolution = [window.screen.width, window.screen.height]
      }
      keys.addPreprocessedComponent({key: 'resolution', value: resolution})
      return keys
    },
    availableScreenResolutionKey: function (keys) {
      if (!this.options.excludeAvailableScreenResolution) {
        return this.getAvailableScreenResolution(keys)
      }
      return keys
    },
    getAvailableScreenResolution: function (keys) {
      var available
      if (window.screen.availWidth && window.screen.availHeight) {
        if (this.options.detectScreenOrientation) {
          available = (window.screen.availHeight > window.screen.availWidth) ? [window.screen.availHeight, window.screen.availWidth] : [window.screen.availWidth, window.screen.availHeight]
        } else {
          available = [window.screen.availHeight, window.screen.availWidth]
        }
      }
      if (typeof available !== 'undefined') { // headless browsers
        keys.addPreprocessedComponent({key: 'available_resolution', value: available})
      }
      return keys
    },
    timezoneOffsetKey: function (keys) {
      if (!this.options.excludeTimezoneOffset) {
        keys.addPreprocessedComponent({key: 'timezone_offset', value: new Date().getTimezoneOffset()})
      }
      return keys
    },
    sessionStorageKey: function (keys) {
      if (!this.options.excludeSessionStorage && this.hasSessionStorage()) {
        keys.addPreprocessedComponent({key: 'session_storage', value: 1})
      }
      return keys
    },
    localStorageKey: function (keys) {
      if (!this.options.excludeSessionStorage && this.hasLocalStorage()) {
        keys.addPreprocessedComponent({key: 'local_storage', value: 1})
      }
      return keys
    },
    indexedDbKey: function (keys) {
      if (!this.options.excludeIndexedDB && this.hasIndexedDB()) {
        keys.addPreprocessedComponent({key: 'indexed_db', value: 1})
      }
      return keys
    },
    addBehaviorKey: function (keys) {
      // body might not be defined at this point or removed programmatically
      if (!this.options.excludeAddBehavior && document.body && document.body.addBehavior) {
        keys.addPreprocessedComponent({key: 'add_behavior', value: 1})
      }
      return keys
    },
    openDatabaseKey: function (keys) {
      if (!this.options.excludeOpenDatabase && window.openDatabase) {
        keys.addPreprocessedComponent({key: 'open_database', value: 1})
      }
      return keys
    },
    cpuClassKey: function (keys) {
      if (!this.options.excludeCpuClass) {
        keys.addPreprocessedComponent({key: 'cpu_class', value: this.getNavigatorCpuClass()})
      }
      return keys
    },
    platformKey: function (keys) {
      if (!this.options.excludePlatform) {
        keys.addPreprocessedComponent({key: 'navigator_platform', value: this.getNavigatorPlatform()})
      }
      return keys
    },
    doNotTrackKey: function (keys) {
      if (!this.options.excludeDoNotTrack) {
        keys.addPreprocessedComponent({key: 'do_not_track', value: this.getDoNotTrack()})
      }
      return keys
    },
    canvasKey: function (keys) {
      if (!this.options.excludeCanvas && this.isCanvasSupported()) {
        keys.addPreprocessedComponent({key: 'canvas', value: this.getCanvasFp()})
      }
      return keys
    },
    hasLiedLanguagesKey: function (keys) {
      if (!this.options.excludeHasLiedLanguages) {
        keys.addPreprocessedComponent({key: 'has_lied_languages', value: this.getHasLiedLanguages()})
      }
      return keys
    },
    hasLiedResolutionKey: function (keys) {
      if (!this.options.excludeHasLiedResolution) {
        keys.addPreprocessedComponent({key: 'has_lied_resolution', value: this.getHasLiedResolution()})
      }
      return keys
    },
    hasLiedOsKey: function (keys) {
      if (!this.options.excludeHasLiedOs) {
        keys.addPreprocessedComponent({key: 'has_lied_os', value: this.getHasLiedOs()})
      }
      return keys
    },
    hasLiedBrowserKey: function (keys) {
      if (!this.options.excludeHasLiedBrowser) {
        keys.addPreprocessedComponent({key: 'has_lied_browser', value: this.getHasLiedBrowser()})
      }
      return keys
    },
    fontsKey: function (keys, done) {
      return this.jsFontsKey(keys, done)
    },
    // kudos to http://www.lalit.org/lab/javascript-css-font-detect/
    jsFontsKey: function (keys, done) {
      var that = this
      // doing js fonts detection in a pseudo-async fashion
      return setTimeout(function () {
        // a font will be compared against all the three default fonts.
        // and if it doesn't match all 3 then that font is not available.
        var baseFonts = ['monospace', 'sans-serif', 'serif']

        var fontList = [
          'Andale Mono', 'Arial', 'Arial Black', 'Arial Hebrew', 'Arial MT', 'Arial Narrow', 'Arial Rounded MT Bold', 'Arial Unicode MS',
          'Bitstream Vera Sans Mono', 'Book Antiqua', 'Bookman Old Style',
          'Calibri', 'Cambria', 'Cambria Math', 'Century', 'Century Gothic', 'Century Schoolbook', 'Comic Sans', 'Comic Sans MS', 'Consolas', 'Courier', 'Courier New',
          'Geneva', 'Georgia',
          'Helvetica', 'Helvetica Neue',
          'Impact',
          'Lucida Bright', 'Lucida Calligraphy', 'Lucida Console', 'Lucida Fax', 'LUCIDA GRANDE', 'Lucida Handwriting', 'Lucida Sans', 'Lucida Sans Typewriter', 'Lucida Sans Unicode',
          'Microsoft Sans Serif', 'Monaco', 'Monotype Corsiva', 'MS Gothic', 'MS Outlook', 'MS PGothic', 'MS Reference Sans Serif', 'MS Sans Serif', 'MS Serif', 'MYRIAD', 'MYRIAD PRO',
          'Palatino', 'Palatino Linotype',
          'Segoe Print', 'Segoe Script', 'Segoe UI', 'Segoe UI Light', 'Segoe UI Semibold', 'Segoe UI Symbol',
          'Tahoma', 'Times', 'Times New Roman', 'Times New Roman PS', 'Trebuchet MS',
          'Verdana', 'Wingdings', 'Wingdings 2', 'Wingdings 3'
        ]

        fontList = fontList.concat(that.options.userDefinedFonts)

        // remove duplicate fonts
        fontList = fontList.filter(function (font, position) {
          return fontList.indexOf(font) === position
        })

        // we use m or w because these two characters take up the maximum width.
        // And we use a LLi so that the same matching fonts can get separated
        var testString = 'mmmmmmmmmmlli'

        // we test using 72px font size, we may use any size. I guess larger the better.
        var testSize = '72px'

        var h = document.getElementsByTagName('body')[0]

        // div to load spans for the base fonts
        var baseFontsDiv = document.createElement('div')

        // div to load spans for the fonts to detect
        var fontsDiv = document.createElement('div')

        var defaultWidth = {}
        var defaultHeight = {}

        // creates a span where the fonts will be loaded
        var createSpan = function () {
          var s = document.createElement('span')
            /*
             * We need this css as in some weird browser this
             * span elements shows up for a microSec which creates a
             * bad user experience
             */
          s.style.position = 'absolute'
          s.style.left = '-9999px'
          s.style.fontSize = testSize

          // css font reset to reset external styles
          s.style.fontStyle = 'normal'
          s.style.fontWeight = 'normal'
          s.style.letterSpacing = 'normal'
          s.style.lineBreak = 'auto'
          s.style.lineHeight = 'normal'
          s.style.textTransform = 'none'
          s.style.textAlign = 'left'
          s.style.textDecoration = 'none'
          s.style.textShadow = 'none'
          s.style.whiteSpace = 'normal'
          s.style.wordBreak = 'normal'
          s.style.wordSpacing = 'normal'

          s.innerHTML = testString
          return s
        }

        // creates a span and load the font to detect and a base font for fallback
        var createSpanWithFonts = function (fontToDetect, baseFont) {
          var s = createSpan()
          s.style.fontFamily = "'" + fontToDetect + "'," + baseFont
          return s
        }

        // creates spans for the base fonts and adds them to baseFontsDiv
        var initializeBaseFontsSpans = function () {
          var spans = []
          for (var index = 0, length = baseFonts.length; index < length; index++) {
            var s = createSpan()
            s.style.fontFamily = baseFonts[index]
            baseFontsDiv.appendChild(s)
            spans.push(s)
          }
          return spans
        }

        // creates spans for the fonts to detect and adds them to fontsDiv
        var initializeFontsSpans = function () {
          var spans = {}
          for (var i = 0, l = fontList.length; i < l; i++) {
            var fontSpans = []
            for (var j = 0, numDefaultFonts = baseFonts.length; j < numDefaultFonts; j++) {
              var s = createSpanWithFonts(fontList[i], baseFonts[j])
              fontsDiv.appendChild(s)
              fontSpans.push(s)
            }
            spans[fontList[i]] = fontSpans // Stores {fontName : [spans for that font]}
          }
          return spans
        }

        // checks if a font is available
        var isFontAvailable = function (fontSpans) {
          var detected = false
          for (var i = 0; i < baseFonts.length; i++) {
            detected = (fontSpans[i].offsetWidth !== defaultWidth[baseFonts[i]] || fontSpans[i].offsetHeight !== defaultHeight[baseFonts[i]])
            if (detected) {
              return detected
            }
          }
          return detected
        }

        // create spans for base fonts
        var baseFontsSpans = initializeBaseFontsSpans()

        // add the spans to the DOM
        h.appendChild(baseFontsDiv)

        // get the default width for the three base fonts
        for (var index = 0, length = baseFonts.length; index < length; index++) {
          defaultWidth[baseFonts[index]] = baseFontsSpans[index].offsetWidth // width for the default font
          defaultHeight[baseFonts[index]] = baseFontsSpans[index].offsetHeight // height for the default font
        }

        // create spans for fonts to detect
        var fontsSpans = initializeFontsSpans()

        // add all the spans to the DOM
        h.appendChild(fontsDiv)

        // check available fonts
        var available = []
        for (var i = 0, l = fontList.length; i < l; i++) {
          if (isFontAvailable(fontsSpans[fontList[i]])) {
            available.push(fontList[i])
          }
        }

        // remove spans from DOM
        h.removeChild(fontsDiv)
        h.removeChild(baseFontsDiv)

        keys.addPreprocessedComponent({key: 'js_fonts', value: available})
        done(keys)
      }, 1)
    },
    pluginsKey: function (keys) {
      if (!this.options.excludePlugins) {
        if (this.isIE()) {
          if (!this.options.excludeIEPlugins) {
            keys.addPreprocessedComponent({key: 'ie_plugins', value: this.getIEPlugins()})
          }
        } else {
          keys.addPreprocessedComponent({key: 'regular_plugins', value: this.getRegularPlugins()})
        }
      }
      return keys
    },
    getRegularPlugins: function () {
      var plugins = []
      if (navigator.plugins) {
        // plugins isn't defined in Node envs.
        for (var i = 0, l = navigator.plugins.length; i < l; i++) {
          if (navigator.plugins[i]) { plugins.push(navigator.plugins[i]) }
        }
      }
      // sorting plugins only for those user agents, that we know randomize the plugins
      // every time we try to enumerate them
      if (this.pluginsShouldBeSorted()) {
        plugins = plugins.sort(function (a, b) {
          if (a.name > b.name) { return 1 }
          if (a.name < b.name) { return -1 }
          return 0
        })
      }
      return this.map(plugins, function (p) {
        var mimeTypes = this.map(p, function (mt) {
          return [mt.type, mt.suffixes].join('~')
        }).join(',')
        return [p.name, p.description, mimeTypes].join('::')
      }, this)
    },
    getIEPlugins: function () {
      var result = []
      if ((Object.getOwnPropertyDescriptor && Object.getOwnPropertyDescriptor(window, 'ActiveXObject')) || ('ActiveXObject' in window)) {
        var names = [
          'AcroPDF.PDF', // Adobe PDF reader 7+
          'Adodb.Stream',
          'AgControl.AgControl', // Silverlight
          'DevalVRXCtrl.DevalVRXCtrl.1',
          'MacromediaFlashPaper.MacromediaFlashPaper',
          'Msxml2.DOMDocument',
          'Msxml2.XMLHTTP',
          'PDF.PdfCtrl', // Adobe PDF reader 6 and earlier, brrr
          'QuickTime.QuickTime', // QuickTime
          'QuickTimeCheckObject.QuickTimeCheck.1',
          'RealPlayer',
          'RealPlayer.RealPlayer(tm) ActiveX Control (32-bit)',
          'RealVideo.RealVideo(tm) ActiveX Control (32-bit)',
          'Scripting.Dictionary',
          'SWCtl.SWCtl', // ShockWave player
          'Shell.UIHelper',
          'ShockwaveFlash.ShockwaveFlash', // flash plugin
          'Skype.Detection',
          'TDCCtl.TDCCtl',
          'WMPlayer.OCX', // Windows media player
          'rmocx.RealPlayer G2 Control',
          'rmocx.RealPlayer G2 Control.1'
        ]
        // starting to detect plugins in IE
        result = this.map(names, function (name) {
          try {
            // eslint-disable-next-line no-new
            new window.ActiveXObject(name)
            return name
          } catch (e) {
            return null
          }
        })
      }
      if (navigator.plugins) {
        result = result.concat(this.getRegularPlugins())
      }
      return result
    },
    pluginsShouldBeSorted: function () {
      var should = false
      for (var i = 0, l = this.options.sortPluginsFor.length; i < l; i++) {
        var re = this.options.sortPluginsFor[i]
        if (navigator.userAgent.match(re)) {
          should = true
          break
        }
      }
      return should
    },
    touchSupportKey: function (keys) {
      if (!this.options.excludeTouchSupport) {
        keys.addPreprocessedComponent({key: 'touch_support', value: this.getTouchSupport()})
      }
      return keys
    },
    hardwareConcurrencyKey: function (keys) {
      if (!this.options.excludeHardwareConcurrency) {
        keys.addPreprocessedComponent({key: 'hardware_concurrency', value: this.getHardwareConcurrency()})
      }
      return keys
    },
    hasSessionStorage: function () {
      try {
        return !!window.sessionStorage
      } catch (e) {
        return true // SecurityError when referencing it means it exists
      }
    },
    // https://bugzilla.mozilla.org/show_bug.cgi?id=781447
    hasLocalStorage: function () {
      try {
        return !!window.localStorage
      } catch (e) {
        return true // SecurityError when referencing it means it exists
      }
    },
    hasIndexedDB: function () {
      try {
        return !!window.indexedDB
      } catch (e) {
        return true // SecurityError when referencing it means it exists
      }
    },
    getHardwareConcurrency: function () {
      if (navigator.hardwareConcurrency) {
        return navigator.hardwareConcurrency
      }
      return 'unknown'
    },
    getNavigatorCpuClass: function () {
      if (navigator.cpuClass) {
        return navigator.cpuClass
      } else {
        return 'unknown'
      }
    },
    getNavigatorPlatform: function () {
      if (navigator.platform) {
        return navigator.platform
      } else {
        return 'unknown'
      }
    },
    getDoNotTrack: function () {
      if (navigator.doNotTrack) {
        return navigator.doNotTrack
      } else if (navigator.msDoNotTrack) {
        return navigator.msDoNotTrack
      } else if (window.doNotTrack) {
        return window.doNotTrack
      } else {
        return 'unknown'
      }
    },
    // This is a crude and primitive touch screen detection.
    // It's not possible to currently reliably detect the  availability of a touch screen
    // with a JS, without actually subscribing to a touch event.
    // http://www.stucox.com/blog/you-cant-detect-a-touchscreen/
    // https://github.com/Modernizr/Modernizr/issues/548
    // method returns an array of 3 values:
    // maxTouchPoints, the success or failure of creating a TouchEvent,
    // and the availability of the 'ontouchstart' property
    getTouchSupport: function () {
      var maxTouchPoints = 0
      var touchEvent = false
      if (typeof navigator.maxTouchPoints !== 'undefined') {
        maxTouchPoints = navigator.maxTouchPoints
      } else if (typeof navigator.msMaxTouchPoints !== 'undefined') {
        maxTouchPoints = navigator.msMaxTouchPoints
      }
      try {
        document.createEvent('TouchEvent')
        touchEvent = true
      } catch (_) { /* squelch */ }
      var touchStart = 'ontouchstart' in window
      return [maxTouchPoints, touchEvent, touchStart]
    },
    // https://www.browserleaks.com/canvas#how-does-it-work
    getCanvasFp: function () {
      var result = []
      // Very simple now, need to make it more complex (geo shapes etc)
      var canvas = document.createElement('canvas')
      canvas.width = 2000
      canvas.height = 200
      canvas.style.display = 'inline'
      var ctx = canvas.getContext('2d')
      // detect browser support of canvas winding
      // http://blogs.adobe.com/webplatform/2013/01/30/winding-rules-in-canvas/
      // https://github.com/Modernizr/Modernizr/blob/master/feature-detects/canvas/winding.js
      ctx.rect(0, 0, 10, 10)
      ctx.rect(2, 2, 6, 6)
      result.push('canvas winding:' + ((ctx.isPointInPath(5, 5, 'evenodd') === false) ? 'yes' : 'no'))

      ctx.textBaseline = 'alphabetic'
      ctx.fillStyle = '#f60'
      ctx.fillRect(125, 1, 62, 20)
      ctx.fillStyle = '#069'
      // https://github.com/Valve/fingerprintjs2/issues/66
      if (this.options.dontUseFakeFontInCanvas) {
        ctx.font = '11pt Arial'
      } else {
        ctx.font = '11pt no-real-font-123'
      }
      ctx.fillText('Cwm fjordbank glyphs vext quiz, \ud83d\ude03', 2, 15)
      ctx.fillStyle = 'rgba(102, 204, 0, 0.2)'
      ctx.font = '18pt Arial'
      ctx.fillText('Cwm fjordbank glyphs vext quiz, \ud83d\ude03', 4, 45)

      // canvas blending
      // http://blogs.adobe.com/webplatform/2013/01/28/blending-features-in-canvas/
      // http://jsfiddle.net/NDYV8/16/
      ctx.globalCompositeOperation = 'multiply'
      ctx.fillStyle = 'rgb(255,0,255)'
      ctx.beginPath()
      ctx.arc(50, 50, 50, 0, Math.PI * 2, true)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = 'rgb(0,255,255)'
      ctx.beginPath()
      ctx.arc(100, 50, 50, 0, Math.PI * 2, true)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = 'rgb(255,255,0)'
      ctx.beginPath()
      ctx.arc(75, 100, 50, 0, Math.PI * 2, true)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = 'rgb(255,0,255)'
      // canvas winding
      // http://blogs.adobe.com/webplatform/2013/01/30/winding-rules-in-canvas/
      // http://jsfiddle.net/NDYV8/19/
      ctx.arc(75, 75, 75, 0, Math.PI * 2, true)
      ctx.arc(75, 75, 25, 0, Math.PI * 2, true)
      ctx.fill('evenodd')

      if (canvas.toDataURL) { result.push('canvas fp:' + canvas.toDataURL()) }
      return result.join('~')
    },
    getHasLiedLanguages: function () {
      // We check if navigator.language is equal to the first language of navigator.languages
      if (typeof navigator.languages !== 'undefined') {
        try {
          var firstLanguages = navigator.languages[0].substr(0, 2)
          if (firstLanguages !== navigator.language.substr(0, 2)) {
            return true
          }
        } catch (err) {
          return true
        }
      }
      return false
    },
    getHasLiedResolution: function () {
      if (window.screen.width < window.screen.availWidth) {
        return true
      }
      if (window.screen.height < window.screen.availHeight) {
        return true
      }
      return false
    },
    getHasLiedOs: function () {
      var userAgent = navigator.userAgent.toLowerCase()
      var oscpu = navigator.oscpu
      var platform = navigator.platform.toLowerCase()
      var os
      // We extract the OS from the user agent (respect the order of the if else if statement)
      if (userAgent.indexOf('windows phone') >= 0) {
        os = 'Windows Phone'
      } else if (userAgent.indexOf('win') >= 0) {
        os = 'Windows'
      } else if (userAgent.indexOf('android') >= 0) {
        os = 'Android'
      } else if (userAgent.indexOf('linux') >= 0) {
        os = 'Linux'
      } else if (userAgent.indexOf('iphone') >= 0 || userAgent.indexOf('ipad') >= 0) {
        os = 'iOS'
      } else if (userAgent.indexOf('mac') >= 0) {
        os = 'Mac'
      } else {
        os = 'Other'
      }
      // We detect if the person uses a mobile device
      var mobileDevice
      if (('ontouchstart' in window) ||
           (navigator.maxTouchPoints > 0) ||
           (navigator.msMaxTouchPoints > 0)) {
        mobileDevice = true
      } else {
        mobileDevice = false
      }

      if (mobileDevice && os !== 'Windows Phone' && os !== 'Android' && os !== 'iOS' && os !== 'Other') {
        return true
      }

      // We compare oscpu with the OS extracted from the UA
      if (typeof oscpu !== 'undefined') {
        oscpu = oscpu.toLowerCase()
        if (oscpu.indexOf('win') >= 0 && os !== 'Windows' && os !== 'Windows Phone') {
          return true
        } else if (oscpu.indexOf('linux') >= 0 && os !== 'Linux' && os !== 'Android') {
          return true
        } else if (oscpu.indexOf('mac') >= 0 && os !== 'Mac' && os !== 'iOS') {
          return true
        } else if ((oscpu.indexOf('win') === -1 && oscpu.indexOf('linux') === -1 && oscpu.indexOf('mac') === -1) !== (os === 'Other')) {
          return true
        }
      }

      // We compare platform with the OS extracted from the UA
      if (platform.indexOf('win') >= 0 && os !== 'Windows' && os !== 'Windows Phone') {
        return true
      } else if ((platform.indexOf('linux') >= 0 || platform.indexOf('android') >= 0 || platform.indexOf('pike') >= 0) && os !== 'Linux' && os !== 'Android') {
        return true
      } else if ((platform.indexOf('mac') >= 0 || platform.indexOf('ipad') >= 0 || platform.indexOf('ipod') >= 0 || platform.indexOf('iphone') >= 0) && os !== 'Mac' && os !== 'iOS') {
        return true
      } else if ((platform.indexOf('win') === -1 && platform.indexOf('linux') === -1 && platform.indexOf('mac') === -1) !== (os === 'Other')) {
        return true
      }

      if (typeof navigator.plugins === 'undefined' && os !== 'Windows' && os !== 'Windows Phone') {
        // We are are in the case where the person uses ie, therefore we can infer that it's windows
        return true
      }

      return false
    },
    getHasLiedBrowser: function () {
      var userAgent = navigator.userAgent.toLowerCase()
      var productSub = navigator.productSub

      // we extract the browser from the user agent (respect the order of the tests)
      var browser
      if (userAgent.indexOf('firefox') >= 0) {
        browser = 'Firefox'
      } else if (userAgent.indexOf('opera') >= 0 || userAgent.indexOf('opr') >= 0) {
        browser = 'Opera'
      } else if (userAgent.indexOf('chrome') >= 0) {
        browser = 'Chrome'
      } else if (userAgent.indexOf('safari') >= 0) {
        browser = 'Safari'
      } else if (userAgent.indexOf('trident') >= 0) {
        browser = 'Internet Explorer'
      } else {
        browser = 'Other'
      }

      if ((browser === 'Chrome' || browser === 'Safari' || browser === 'Opera') && productSub !== '20030107') {
        return true
      }

      // eslint-disable-next-line no-eval
      var tempRes = eval.toString().length
      if (tempRes === 37 && browser !== 'Safari' && browser !== 'Firefox' && browser !== 'Other') {
        return true
      } else if (tempRes === 39 && browser !== 'Internet Explorer' && browser !== 'Other') {
        return true
      } else if (tempRes === 33 && browser !== 'Chrome' && browser !== 'Opera' && browser !== 'Other') {
        return true
      }

      // We create an error to see how it is handled
      var errFirefox
      try {
        // eslint-disable-next-line no-throw-literal
        throw 'a'
      } catch (err) {
        try {
          err.toSource()
          errFirefox = true
        } catch (errOfErr) {
          errFirefox = false
        }
      }
      if (errFirefox && browser !== 'Firefox' && browser !== 'Other') {
        return true
      }
      return false
    },
    isCanvasSupported: function () {
      var elem = document.createElement('canvas')
      return !!(elem.getContext && elem.getContext('2d'))
    },
    isIE: function () {
      if (navigator.appName === 'Microsoft Internet Explorer') {
        return true
      } else if (navigator.appName === 'Netscape' && /Trident/.test(navigator.userAgent)) { // IE 11
        return true
      }
      return false
    },

    /**
     * @template T
     * @param {T=} context
     */
    each: function (obj, iterator, context) {
      if (obj === null) {
        return
      }
      if (this.nativeForEach && obj.forEach === this.nativeForEach) {
        obj.forEach(iterator, context)
      } else if (obj.length === +obj.length) {
        for (var i = 0, l = obj.length; i < l; i++) {
          if (iterator.call(context, obj[i], i, obj) === {}) { return }
        }
      } else {
        for (var key in obj) {
          if (obj.hasOwnProperty(key)) {
            if (iterator.call(context, obj[key], key, obj) === {}) { return }
          }
        }
      }
    },

    /**
     * @template T,V
     * @param {T=} context
     * @param {function(this:T, ?, (string|number), T=):V} iterator
     * @return {V}
     */
    map: function (obj, iterator, context) {
      var results = []
      // Not using strict equality so that this acts as a
      // shortcut to checking for `null` and `undefined`.
      if (obj == null) { return results }
      if (this.nativeMap && obj.map === this.nativeMap) { return obj.map(iterator, context) }
      this.each(obj, function (value, index, list) {
        results[results.length] = iterator.call(context, value, index, list)
      })
      return results
    },

    /// MurmurHash3 related functions

    //
    // Given two 64bit ints (as an array of two 32bit ints) returns the two
    // added together as a 64bit int (as an array of two 32bit ints).
    //
    x64Add: function (m, n) {
      m = [m[0] >>> 16, m[0] & 0xffff, m[1] >>> 16, m[1] & 0xffff]
      n = [n[0] >>> 16, n[0] & 0xffff, n[1] >>> 16, n[1] & 0xffff]
      var o = [0, 0, 0, 0]
      o[3] += m[3] + n[3]
      o[2] += o[3] >>> 16
      o[3] &= 0xffff
      o[2] += m[2] + n[2]
      o[1] += o[2] >>> 16
      o[2] &= 0xffff
      o[1] += m[1] + n[1]
      o[0] += o[1] >>> 16
      o[1] &= 0xffff
      o[0] += m[0] + n[0]
      o[0] &= 0xffff
      return [(o[0] << 16) | o[1], (o[2] << 16) | o[3]]
    },

    //
    // Given two 64bit ints (as an array of two 32bit ints) returns the two
    // multiplied together as a 64bit int (as an array of two 32bit ints).
    //
    x64Multiply: function (m, n) {
      m = [m[0] >>> 16, m[0] & 0xffff, m[1] >>> 16, m[1] & 0xffff]
      n = [n[0] >>> 16, n[0] & 0xffff, n[1] >>> 16, n[1] & 0xffff]
      var o = [0, 0, 0, 0]
      o[3] += m[3] * n[3]
      o[2] += o[3] >>> 16
      o[3] &= 0xffff
      o[2] += m[2] * n[3]
      o[1] += o[2] >>> 16
      o[2] &= 0xffff
      o[2] += m[3] * n[2]
      o[1] += o[2] >>> 16
      o[2] &= 0xffff
      o[1] += m[1] * n[3]
      o[0] += o[1] >>> 16
      o[1] &= 0xffff
      o[1] += m[2] * n[2]
      o[0] += o[1] >>> 16
      o[1] &= 0xffff
      o[1] += m[3] * n[1]
      o[0] += o[1] >>> 16
      o[1] &= 0xffff
      o[0] += (m[0] * n[3]) + (m[1] * n[2]) + (m[2] * n[1]) + (m[3] * n[0])
      o[0] &= 0xffff
      return [(o[0] << 16) | o[1], (o[2] << 16) | o[3]]
    },
    //
    // Given a 64bit int (as an array of two 32bit ints) and an int
    // representing a number of bit positions, returns the 64bit int (as an
    // array of two 32bit ints) rotated left by that number of positions.
    //
    x64Rotl: function (m, n) {
      n %= 64
      if (n === 32) {
        return [m[1], m[0]]
      } else if (n < 32) {
        return [(m[0] << n) | (m[1] >>> (32 - n)), (m[1] << n) | (m[0] >>> (32 - n))]
      } else {
        n -= 32
        return [(m[1] << n) | (m[0] >>> (32 - n)), (m[0] << n) | (m[1] >>> (32 - n))]
      }
    },
    //
    // Given a 64bit int (as an array of two 32bit ints) and an int
    // representing a number of bit positions, returns the 64bit int (as an
    // array of two 32bit ints) shifted left by that number of positions.
    //
    x64LeftShift: function (m, n) {
      n %= 64
      if (n === 0) {
        return m
      } else if (n < 32) {
        return [(m[0] << n) | (m[1] >>> (32 - n)), m[1] << n]
      } else {
        return [m[1] << (n - 32), 0]
      }
    },
    //
    // Given two 64bit ints (as an array of two 32bit ints) returns the two
    // xored together as a 64bit int (as an array of two 32bit ints).
    //
    x64Xor: function (m, n) {
      return [m[0] ^ n[0], m[1] ^ n[1]]
    },
    //
    // Given a block, returns murmurHash3's final x64 mix of that block.
    // (`[0, h[0] >>> 1]` is a 33 bit unsigned right shift. This is the
    // only place where we need to right shift 64bit ints.)
    //
    x64Fmix: function (h) {
      h = this.x64Xor(h, [0, h[0] >>> 1])
      h = this.x64Multiply(h, [0xff51afd7, 0xed558ccd])
      h = this.x64Xor(h, [0, h[0] >>> 1])
      h = this.x64Multiply(h, [0xc4ceb9fe, 0x1a85ec53])
      h = this.x64Xor(h, [0, h[0] >>> 1])
      return h
    },

    //
    // Given a string and an optional seed as an int, returns a 128 bit
    // hash using the x64 flavor of MurmurHash3, as an unsigned hex.
    //
    x64hash128: function (key, seed) {
      key = key || ''
      seed = seed || 0
      var remainder = key.length % 16
      var bytes = key.length - remainder
      var h1 = [0, seed]
      var h2 = [0, seed]
      var k1 = [0, 0]
      var k2 = [0, 0]
      var c1 = [0x87c37b91, 0x114253d5]
      var c2 = [0x4cf5ad43, 0x2745937f]
      for (var i = 0; i < bytes; i = i + 16) {
        k1 = [((key.charCodeAt(i + 4) & 0xff)) | ((key.charCodeAt(i + 5) & 0xff) << 8) | ((key.charCodeAt(i + 6) & 0xff) << 16) | ((key.charCodeAt(i + 7) & 0xff) << 24), ((key.charCodeAt(i) & 0xff)) | ((key.charCodeAt(i + 1) & 0xff) << 8) | ((key.charCodeAt(i + 2) & 0xff) << 16) | ((key.charCodeAt(i + 3) & 0xff) << 24)]
        k2 = [((key.charCodeAt(i + 12) & 0xff)) | ((key.charCodeAt(i + 13) & 0xff) << 8) | ((key.charCodeAt(i + 14) & 0xff) << 16) | ((key.charCodeAt(i + 15) & 0xff) << 24), ((key.charCodeAt(i + 8) & 0xff)) | ((key.charCodeAt(i + 9) & 0xff) << 8) | ((key.charCodeAt(i + 10) & 0xff) << 16) | ((key.charCodeAt(i + 11) & 0xff) << 24)]
        k1 = this.x64Multiply(k1, c1)
        k1 = this.x64Rotl(k1, 31)
        k1 = this.x64Multiply(k1, c2)
        h1 = this.x64Xor(h1, k1)
        h1 = this.x64Rotl(h1, 27)
        h1 = this.x64Add(h1, h2)
        h1 = this.x64Add(this.x64Multiply(h1, [0, 5]), [0, 0x52dce729])
        k2 = this.x64Multiply(k2, c2)
        k2 = this.x64Rotl(k2, 33)
        k2 = this.x64Multiply(k2, c1)
        h2 = this.x64Xor(h2, k2)
        h2 = this.x64Rotl(h2, 31)
        h2 = this.x64Add(h2, h1)
        h2 = this.x64Add(this.x64Multiply(h2, [0, 5]), [0, 0x38495ab5])
      }
      k1 = [0, 0]
      k2 = [0, 0]
      switch (remainder) {
        case 15:
          k2 = this.x64Xor(k2, this.x64LeftShift([0, key.charCodeAt(i + 14)], 48))
          // fallthrough
        case 14:
          k2 = this.x64Xor(k2, this.x64LeftShift([0, key.charCodeAt(i + 13)], 40))
          // fallthrough
        case 13:
          k2 = this.x64Xor(k2, this.x64LeftShift([0, key.charCodeAt(i + 12)], 32))
          // fallthrough
        case 12:
          k2 = this.x64Xor(k2, this.x64LeftShift([0, key.charCodeAt(i + 11)], 24))
          // fallthrough
        case 11:
          k2 = this.x64Xor(k2, this.x64LeftShift([0, key.charCodeAt(i + 10)], 16))
          // fallthrough
        case 10:
          k2 = this.x64Xor(k2, this.x64LeftShift([0, key.charCodeAt(i + 9)], 8))
          // fallthrough
        case 9:
          k2 = this.x64Xor(k2, [0, key.charCodeAt(i + 8)])
          k2 = this.x64Multiply(k2, c2)
          k2 = this.x64Rotl(k2, 33)
          k2 = this.x64Multiply(k2, c1)
          h2 = this.x64Xor(h2, k2)
          // fallthrough
        case 8:
          k1 = this.x64Xor(k1, this.x64LeftShift([0, key.charCodeAt(i + 7)], 56))
          // fallthrough
        case 7:
          k1 = this.x64Xor(k1, this.x64LeftShift([0, key.charCodeAt(i + 6)], 48))
          // fallthrough
        case 6:
          k1 = this.x64Xor(k1, this.x64LeftShift([0, key.charCodeAt(i + 5)], 40))
          // fallthrough
        case 5:
          k1 = this.x64Xor(k1, this.x64LeftShift([0, key.charCodeAt(i + 4)], 32))
          // fallthrough
        case 4:
          k1 = this.x64Xor(k1, this.x64LeftShift([0, key.charCodeAt(i + 3)], 24))
          // fallthrough
        case 3:
          k1 = this.x64Xor(k1, this.x64LeftShift([0, key.charCodeAt(i + 2)], 16))
          // fallthrough
        case 2:
          k1 = this.x64Xor(k1, this.x64LeftShift([0, key.charCodeAt(i + 1)], 8))
          // fallthrough
        case 1:
          k1 = this.x64Xor(k1, [0, key.charCodeAt(i)])
          k1 = this.x64Multiply(k1, c1)
          k1 = this.x64Rotl(k1, 31)
          k1 = this.x64Multiply(k1, c2)
          h1 = this.x64Xor(h1, k1)
          // fallthrough
      }
      h1 = this.x64Xor(h1, [0, key.length])
      h2 = this.x64Xor(h2, [0, key.length])
      h1 = this.x64Add(h1, h2)
      h2 = this.x64Add(h2, h1)
      h1 = this.x64Fmix(h1)
      h2 = this.x64Fmix(h2)
      h1 = this.x64Add(h1, h2)
      h2 = this.x64Add(h2, h1)
      return ('00000000' + (h1[0] >>> 0).toString(16)).slice(-8) + ('00000000' + (h1[1] >>> 0).toString(16)).slice(-8) + ('00000000' + (h2[0] >>> 0).toString(16)).slice(-8) + ('00000000' + (h2[1] >>> 0).toString(16)).slice(-8)
    }
  }
  Fingerprint2.VERSION = '1.8.0'
  return Fingerprint2
})
