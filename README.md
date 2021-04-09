# escfbb
Iimplements the trick of escaping from Facebook, Facebook Messenger, Instagram, Webkit in-app browsers on IOS and Android to the default browser.

This may be necessary because Facebook in-app browser usually doesn't have permissions to work with microphone, camera or gps sensor.
Websites that need these resources will not work if user get to this site from Facebook post or Facebook Messenger.


#### Usage

see index.html as the example

#### Demo

https://starshiptroopers.dev/escfbb/

#### Notes
The solution for android is quite simple, but the same for iOS is much more complicated. We need to use an external service to do the redirect on IOS.
We need to use an external service to do the redirect on IOS. 
Downloading the file from an intermediate ftp-server is used to jump out from in-app browser, this is a trick because there is no public API in IOS and WebKit to call safari and at the time of writing I didn't know another solution.
At the time of writing Google removed the ftp protocol support from Chrome browsers, if Safary follows it, this solution will stop working on iOS.
Let me know if you know of another way to call safary from a mobile browser on iOS.

This script use our own ftpdts service written in GO as intermediate ftp server. 
You can run your own ftpdts server. See details https://github.com/starshiptroopers/ftpdts
