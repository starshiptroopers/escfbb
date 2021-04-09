/*
// Copyright 2021 The Starship Troopers Authors. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.
//
// This script implements the trick of escaping from Facebook, Facebook Messenger, Instagram, Webkit in-app browsers on IOS and Android to the default browser mobile browser.
// This may be necessary because Facebook in-app browser usually doesn't have permissions to work with microphone, camera or gps sensor.
// Websites and PWA that need these resources will not work if user get to this site from Facebook post or Message
//

// Usage: see index.html as the example
// Notes.
// The solution for android is quite simple, but the same for iOS is much more complicated.
// We need to use an external service to do the redirect on IOS.
// Downloading the file from an intermediate ftp-server is used to jump out from in-app browser, this is a trick because there is no public API in IOS and WebKit to call safari
// and at the time of writing I didn't know another solution.
// At the time of writing Google removed the ftp protocol support from Chrome browsers, if Safary follows it, this solution will stop working on iOS
// let me know if you know of another way to call safary from a mobile browser on iOS
 */

//regexp arrays to detect in-app browsers
let BrowsersRegexp = {
    facebook: [ /(FB4A|FBAN)/i ],
    facebookMessenger: [/(FB_IAB\/Orca|FB_IAB\/Messenger|FBAN\/Messenger)/i]
}

//regexp arrays to detect mobile OS
let OSRegexp = {
    ios: [ /(iPhone|iPad)/i ],
    android: [/(Android)/i]
}

let debugMode = 0;
let os = null;
let browser = null;

//you can run your own ftpdts service (https://github.com/starshiptroopers/ftpdts) or use the the public and free ftpdts service on starshiptroopers.dev
export let ftpdtsFtpEndpointURI = "ftp://starshiptroopers.dev/";              //ftpdts service ftp endpoint (public and free)
export let ftpdtsWebEndpointURI = "https://starshiptroopers.dev/escfbb/data"; //ftpdts service webapi endpoint (public and free)
export let redirectWaitingTimeout = 5000;

//register new regexp to in-app browser detector
export function addInappBrowserRegexpString( type, regexp ) {
    return _addRegexpString(BrowsersRegexp, type, regexp)
}

//register new regexp to mobile os detector
export function addOSRegexpString( os, regexp ) {
    return _addRegexpString(OSRegexp, os, regexp)
}

export function isInappBrowser() {
    return (detectBrowser() != null);
}

/**
 * check and returns true if we are in the in-app browser we need to escape from
 * @returns {boolean|boolean}
 */
export function canEscape() {
    return detectBrowser() != null && detectOS != null
}

/**
 * Do escape from in-app browser.
 * @param url - the url that will be opened in the default browser
 * @param failed_cb - callback when redirect failed
 */
export function escape(url, failed_cb) {
    if (!canRedirect())
        return;
    let os = detectOS();
    let b = detectBrowser();

    let failed = function (err) {
        _loge(`something get wrong, ${err}`);
        if (typeof failed_cb === "function")
            failed_cb(err);
    }

    let waitTimer = function () {
        setTimeout(function(){
            failed("redirect failed");
        }, redirectWaitingTimeout);
    }

    if (os)
        _log(`trying to escape from ${b} in-app browser to ${os} default browser with url: ${url}`);

    if ( os === 'android') {
        url = url.replace(location.protocol, "intent:") + "#Intent;scheme=https;action=android.intent.action.VIEW;end;";
        window.location.href = url;
        waitTimer()
    } else if (os === 'ios')  {
        _apiRequest(
            ftpdtsWebEndpointURI,
            "POST",
            {Url: url, Caption: "This is a temporary redirect page. If you see that, inform the site administrator about this"},
            function (obj) {
                if (! obj || !obj.uid) {
                    failed(`wrong answer from ftpdts: ${obj}`)
                    return;
                }
                url = `${ftpdtsFtpEndpointURI}${obj.uid}.html`;
                window.location.href = url;
                waitTimer();
            },
            function (obj) {
                failed(`wrong answer from ftpdts: ${obj}`)
        })
    } else {
        failed(`there is no handler to process redirect for ${os} OS`);
    }
}

export function detectOS() {
    return os || (os = _detectUA(OSRegexp))
}

export function detectBrowser() {
    return browser || (browser =_detectUA(BrowsersRegexp))
}

//turn on the debug logging to the console
export function debug(v) {
    debugMode = v;
}

/*
   Internal functions
 */

function _addRegexpString(storage, name, regexp) {
    if (! storage || ! name || ! regexp) {
        _loge("addRegexpString: wrong input parameters");
        return false
    }

    if (!storage[name])
        storage[name] = [];

    storage[name].push(regexp)

    return true;
}

// test userAgent string with array of regexp
function _detectUA(regexps) {
    try {
        for (let entry of Object.entries(regexps)) {
            let browser = entry[0];
            for (let rgxp of entry[1]) {
                if (rgxp.test(window.navigator.userAgent)) {
                    return browser;
                }
            }
        }
    } catch (e) {
        _loge(e);
    }
    return null;
}

function _loge(n, e) {
    if (debugMode)
        console.log(`escfbb: internal error while ${n}`, e)
}

function _log(m) {
    if (debugMode)
        console.log(`escfbb: ${m}`)
}

/**
 * do the remote API request
 * @param uri
 * @param method - (POST|GET)
 * @param data   - (data to sent)
 * @param succ   - callback
 * @param err    - callback
 * @param token  - auth token (optional)
 * @returns {null}
 * @private
 */
function _apiRequest(uri, method, data, succ, err, token) {
    let hr = new XMLHttpRequest();
    if (!hr) {
        _loge("Cannot create an XML HTTP instance");
        return null;
    }
    hr.open(method, uri, true);
    hr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

    if (token)
        hr.setRequestHeader("Authorization", "Bearer " + token);

    let dataToSend = JSON.stringify(data);
    hr.onreadystatechange = function() {
        if (hr.readyState === XMLHttpRequest.DONE) {
            let obj = null;
            try {
                obj = JSON.parse(hr.responseText);
            } catch (e) {
                _loge("We got an incorrect JSON response");
                if (err)
                    err();
                _loge(hr.responseText)
                return;
            }
            if (obj && obj.code === 0) {
                if (succ)
                    succ(obj);
            } else if (err) {
                err(obj);
            }
        }
    };
    hr.send(dataToSend);
}