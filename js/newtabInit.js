chrome.runtime.sendMessage({tool: 'data'}, function(res){
	if(!res.data.newtab && !window.location.href.includes('#!/settings') && document.body.clientWidth > 700) chrome.tabs.update({url: 'chrome-search://local-ntp/local-ntp.html'});
});

var x;
if(document.body.clientWidth > 700)
	chrome.runtime.sendMessage({tool: "theme"}, function(res) {
		x = res;
		console.log(x)
		document.body.style.backgroundColor = 'rgb('+x.colors.ntp_background+')';
		document.body.style.backgroundImage = 'url('+x.bg+')';
		style2(`
			h2,h5{
				color: rgb(${x.colors.ntp_text})
			}
		`)
	});

function style2(str) {
    var node = document.createElement('style');
    node.innerHTML = str;
    document.body.appendChild(node);
}