var x;
chrome.runtime.sendMessage({tool: "theme"}, function(response) {
	x = response;
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