var x;
chrome.runtime.sendMessage({tool: "theme"}, function(response) {
	x = response;
	console.log(x)
	document.body.style.backgroundColor = 'rgb('+x.colors.ntp_background+')';
	document.body.style.backgroundImage = 'url('+x.bg+')';
});