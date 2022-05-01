let token = process.argv[2]
if (typeof(token) == "undefined" || token == "") {
	console.error("missing token")
	return
}
let channelid = process.argv[3]
if (typeof(channelid) == "undefined" || channelid == "") {
	console.error("missing channelid")
	return
}
const DiscordJS = require("discord.js")
let client = new DiscordJS.Client({intents: 0})
client.login(token).then(() => {
	console.log(new Date().toLocaleString() + " - logged into discord (" + client.user.tag + ")")
	client.channels.fetch(channelid).then((channel) => {
		console.log(new Date().toLocaleString() + " - found discord channel (" + channel.name + ")")
		channel.send("placeholder").then((message) => {
			console.log(new Date().toLocaleString() + " - created discord message (" + message.id + ")")
			client.destroy()
		}).catch((error) => {
			console.error(new Date().toLocaleString() + " - failed to send discord message (" + error + ")")
		})
	}).catch((error) => {
		console.error(new Date().toLocaleString() + " - failed to get discord channel (" + error + ")")
	})
}).catch((error) => {
	console.error(new Date().toLocaleString() + " - failed to log into discord (" + error + ")")
	if (error.code == "TOKEN_INVALID") {
		console.error(new Date().toLocaleString() + " - stopping due to fatal error")
		return
	}
})