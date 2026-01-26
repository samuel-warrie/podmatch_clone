// cordova init

if (document.location.protocol == 'app:') { // cordova detection by checking protocol
    dmx.Startup(new Promise(resolve => document.addEventListener('deviceready', resolve)));
}