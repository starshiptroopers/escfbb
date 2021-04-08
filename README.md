# escfbb
Iimplements the trick of escaping from Facebook, Facebook Messenger, Instagram, Webkit in-app browsers on IOS and Android to the default browser mobile browser.

This may be necessary because Facebook in-app browser usually doesn't have permissions to work with microphone, camera or gps sensor.
Websites that need these resources will not work if user get to this site from Facebook post or Facebook Messenger.


#### Usage

see index.html as the example

#### Notes
If the solution for android is quite simple, the same for iOS is much more complicated.
We need to use an external service to do the redirect on IOS. Intermediate FTP server is used to jump out from WebKit to safari, because at the time of writing I didn't know another solution. There is no API in WebKit to call the default browser.

This script use our own ftpdts written in GO as intermediate ftp server. You can run your own ftpdts server. See https://github.com/starshiptroopers/ftpdts
