// if you checked "fancy-settings" in extensionizr.com, uncomment this lines

// var settings = new Store("settings", {
//     "sample_setting": "This is how you use Store.js to remember values"
// });


//example of using a message handler from the inject scripts
chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
	console.log(request)
    switch(request.tool){
    	case 'data':
    		sendResponse({data: a.data, ...p.data});
    		break;
    	case 'flow':
    		sendResponse(p.data)
    		break;
    	case 'update':
    		a.data = request.data;
    		chrome.storage.sync.set(a);
    		break;
    	case 'theme':
    		sendResponse(a.theme);
    		break;
    	case 'play':
    		p.play();
			p.data.taskNum = request.taskNum;
    		break;
    	case 'pause':
    		p.pause();
    		break;
    	case 'stop':
    		p.stop();
    		break;
    	default:
    		console.log('default')
    }
    return !0;
});


var d = {
}

// application
var a = {
	theme: {},
	data: {
		tasks: [
			// {completed: false,
			// dateCompleted: 1537724386568,
			// dateCreated: 1537724386568,
			// text: "ewq"}
		],
		flow: {
		    work: 25 * 60,
		    pause: 5 * 60,
		    delay: 4 * 60
		},
	    sounds: !0,
	    newtab: !0
	}
}



// theme
var t =  {
	platformInfo: {},
	isChromeNotChromium: function() {
	    try {
	        // Chrome ships with a PDF Viewer by default, Chromium does not.
	        return null !== navigator.plugins.namedItem('Chrome PDF Viewer');
	    } catch (e) {
	        // Just in case.
	        return false;
	    }
	},
	getLink: function(extensionID){
			var product_id = t.isChromeNotChromium() ? 'chromecrx' : 'chromiumcrx';
			var product_channel = 'unknown';
			var product_version = '9999.0.9999.0';

			var cr_version = /Chrome\/((\d+)\.0\.(\d+)\.\d+)/.exec(navigator.userAgent);
			if (cr_version && +cr_version[2] >= 31 && +cr_version[3] >= 1609) product_version = cr_version[1];

			url = 'https://clients2.google.com/service/update2/crx?response=redirect';
			url += '&os=' + t.platformInfo.os;
			url += '&arch=' + t.platformInfo.arch;
			url += '&nacl_arch=' + t.platformInfo.nacl_arch;
			url += '&prod=' + product_id;
			url += '&prodchannel=' + product_channel;
			url += '&prodversion=' + product_version;
			url += '&x=id%3D' + extensionID;
			url += '%26uc';

			return url;
	},
	processIt: function(e){
		var zip = new JSZip();
		zip.loadAsync(e)
		.then(function(zip) {
			console.log("OK")
			console.log(zip)
		}, function() {
			console.log("Not a valid zip file")
		}); 
	},
	load: function(e){
		console.log(e)
	    openCRXasZip_url(t.getLink(e.id), (e)=>{
		    JSZip.loadAsync(e).then(function (zip) {
	         	zip.file('manifest.json').async("text").then((json)=>{
	         		a.theme = JSON.parse(json).theme;
	         		console.log(a.theme)
	         		var x;
	         		try{
	         			x = a.theme.images.theme_ntp_background;
	         		}catch(z){
	         			a.theme.bg = undefined;
	         		}
	         		if(x){
	         			var urlCreator = window.URL || window.webkitURL;
	         			zip.file(a.theme.images.theme_ntp_background).async("arraybuffer").then((blobIt)=>{
	         				a.theme.bg = urlCreator.createObjectURL(new Blob([blobIt], {type : 'image/png'}));
	         				console.log(a.theme)
	         			})
	         		}else{
	         			a.theme.bg = undefined;
	         		}
	         	})
		    });
	    })
	    return !0;
	},
	init: function(e){
		chrome.management.getAll(function(data){
			e ? t.load(e) : data.some(function(el){
				if(el.type == 'theme') return t.load(el);
			})
		})
	},
	theme: function(){
		chrome.runtime.getPlatformInfo(function(e) {
			t.platformInfo = e;
			t.init()
		});
		chrome.management.onEnabled.addListener(function(e){
			console.log('reinit')
			if(e.type == 'theme') t.init(e);
			console.log(e)
		})
	}
}
var p = {
	data: {
	    taskNum: 0,
	    timing: 0,
	    state: 0
	},
    timer: !1,
	play: function(e) {
        // p.timer = setTimeout(function() {
        //     // p.souna.data.flow.play();
        //     // p.notify(2)
        // }, a.data.flow.work);
        p.data.state = 'play'
        p.data.timing = a.data.flow.work;
        p.setBadge()
    },
    pause: function() {
        p.data.state = 'pause'
        p.data.timing = a.data.flow.pause;
        p.setBadge()
    },
    stop: function(){
    	p.data.state = 0;
        p.setBadge()
    },
	setIcon: function(e = !1){
        var icon = p.data.state?p.data.state:'stop';
        icon = e?e:icon
        chrome.browserAction.setIcon({ path: 'images/' + icon + '.png' })
    },
    setBadge: function(e = !1) {
        p.setIcon(e)
        if (p.badgeTime)
            clearInterval(p.badgeTime)
        p.badgeTime = setInterval(function() {
            if (!p.data.timing || p.data.timing < 0 || !p.data.state) {
            	p.switch()
            } else {
                p.data.timing--;
                var time2Show = Math.floor(p.data.timing / 60)
                var seccontds = (p.data.timing - time2Show*60)
                seccontds = seccontds<10?'0'+seccontds:seccontds
                time2Show = time2Show + ':' + seccontds
                time2Show = p.data.timing<0?'':time2Show
                chrome.browserAction.setBadgeText({ text: time2Show })
            }
        }, 1000);
    },
    switch: function(){
        chrome.browserAction.setBadgeText({ text: '' })
    	if(p.data.state){
    		if(p.data.state=='play'){
    			if(a.data.sounds) p.sound.play()
				if(a.data.newtab) 
					chrome.tabs.query({url: ["chrome-extension://"+chrome.runtime.id+"/src/override/*", "chrome://newtab/"], windowType: "normal"}, function(e){
						if(!e.length) chrome.tabs.create({url: 'src/override/override.html', active: !0})
					})
				if(!a.data.newtab) 
					chrome.tabs.create({url: 'src/override/override.html', active: !0})
    			p.pause()
    			update('reload')
    		}else{
    			p.data.state = 0;
    		}
    	} 
    }
}

p.stop()
t.theme()
chrome.browserAction.setBadgeBackgroundColor({color: '#404040'})
p.sound = new Howl({
  src: ['sounds/def1.mp3'],
  volume: 1
});


chrome.storage.sync.get(["data"], function(items) {
    !items.data?update('updated'):a.data = items.data;
    // update('updated');
	p.data.state = 0;

});
function update(e){
	chrome.runtime.sendMessage({tool: e, data: a.data})
	chrome.storage.sync.set(a);
}