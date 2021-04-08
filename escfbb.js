/*
// Copyright 2020 The Starship Troopers Authors. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.
//
// This script implements the trick of escaping from Facebook, Facebook Messenger, Instagram, Webkit in-app browsers on IOS and Android to the default browser mobile browser.
// This may be necessary because Facebook in-app browser usually doesn't have permissions to work with microphone, camera or gps sensor.
// Websites that need these resources will not work if user get to this site from Facebook post or Message
//

// Usage: see index.html as the example
// Notes.
// If the solution for android is quite simple, the same for iOS is much more complicated.
// We need to use an external service to do the redirect. FTP is used to jump out to safari, because at the time of writing I didn't know another solution. There is no API in WebKit to call safari.
 */

let UA = {
    isFacebook: /(FB4A|FBAN)/i.test(window.navigator.userAgent),
    isFacebookMessenger: /(FB_IAB\/Orca|FB_IAB\/Messenger|FBAN\/Messenger)/i.test(window.navigator.userAgent),
    isIOS: /(iPhone|iPad)/i.test(window.navigator.userAgent),
    isAndroid: /(Android)/i.test(window.navigator.userAgent)
};

let BrowsersRegexp = {
    facebook: [ /(FB4A|FBAN)/i ],
    facebookMessenger: [/(FB_IAB\/Orca|FB_IAB\/Messenger|FBAN\/Messenger)/i],
}

let OSRegexp = {
    ios: [ /(iPhone|iPad)/i ],
    android: [/(Android)/i],
}

let debugMode = 0;
let os = null
let browser = null
let ftpdtsFtpEndpointURI = "ftp://geo.mylocator.app/"
let ftpdtsWebEndpointURI = "https://geo.mylocator.app/ftpdts/data"
let redirectWaitingTimeout = 5000;

export function addInappBrowserRegexpString( type, regexp ) {
    return _addRegexpString(BrowsersRegexp, type, regexp)
}

export function addOSRegexpString( os, regexp ) {
    return _addRegexpString(OSRegexp, os, regexp)
}

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

export function isInappBrowser() {
    return (detectBrowser() != null);
}

export function canRedirect() {
    return detectBrowser() != null && detectOS != null
}

/**
 *
 * @param url - url to redirect to
 * @param failed_cb - callback when redirect failed
 */
export function doRedirect(url, failed_cb) {
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

export function debug(v) {
    debugMode = v;
}

export function detectBrowser() {
    return browser || (browser =_detectUA(BrowsersRegexp))
}

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
 *
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