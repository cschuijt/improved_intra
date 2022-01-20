/* ************************************************************************** */
/*                                                                            */
/*                                                        ::::::::            */
/*   auth.js                                            :+:    :+:            */
/*                                                     +:+                    */
/*   By: fbes <fbes@student.codam.nl>                 +#+                     */
/*                                                   +#+                      */
/*   Created: 2021/11/28 20:22:10 by fbes          #+#    #+#                 */
/*   Updated: 2022/01/20 21:00:28 by fbes          ########   odam.nl         */
/*                                                                            */
/* ************************************************************************** */

var syncPort = chrome.runtime.connect({ name: "sync_port" });
syncPort.onDisconnect.addListener(function() {
	console.log("%c[Improved Intra]%c Disconnected from service worker", "color: #00babc;", "");
});
syncPort.onMessage.addListener(function(msg) {
	switch (msg["action"]) {
		case "pong":
			console.log("pong");
			break;
		case "resynced":
			console.log("Options resynced.");
			window.location.href = optionsURL;
			break;
		case "error":
			console.error(msg["message"]);
			break;
	}
});
setInterval(function() {
	syncPort.disconnect();
	syncPort = chrome.runtime.connect({ name: "sync_port" });
}, 250000);

var authResElem = document.getElementById("result");
if (authResElem) {
	try {
		var authRes = JSON.parse(authResElem.innerText);
		if (!("error" in authRes["auth"])) {
			var optionsURL = chrome.runtime.getURL('options/options.html');
			var action = document.getElementById("action");
			if (action) {
				action.innerText = "Please wait while we redirect you to the Improved Intra 42 options page...";
			}

			var redirLink = document.getElementById("redir_link");
			if (redirLink) {
				redirLink.setAttribute("href", optionsURL);
			}

			// display clickable link in case redirection does not happen
			// after 2 seconds
			setTimeout(function() {
				var clicker = document.getElementById("clicker");
				if (clicker) {
					clicker.style.display = "block";
				}
			}, 2000);

			chrome.storage.local.set(authRes, function() {
				chrome.storage.local.set({"username": authRes["user"]["login"]}, function() {
					console.log("%c[Improved Intra]%c Authentication details saved in local storage!", "color: #00babc;", "");
					syncPort.postMessage({ action: "resync" });
				});
			});
		}
		else {
			console.error("Error " + authRes["auth"]["error"] + ":", authRes["auth"]["error_description"]);
		}
	}
	catch (err) {
		console.error(err);
		alert("Unable to retrieve authentication details. Could not authorize in extension's scope. See the Javascript console for details.");
	}
}
