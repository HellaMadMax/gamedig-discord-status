let token = process.argv[2]
if (typeof(token) == "undefined" || token == "") {
	console.error("missing token")
	process.exit(1)
}
let channelid = process.argv[3]
if (typeof(channelid) == "undefined" || channelid == "") {
	console.error("missing channelid")
	process.exit(1)
}
const DiscordJS = require("discord.js");
(async () => {
	let client = new DiscordJS.Client({intents: 0})
	await client.login(token)
	console.log(new Date().toLocaleString() + " - '" + client.user.tag + "' logged into discord")
	let channel = await client.channels.fetch(channelid)
	let guild = await channel.guild.fetch()
	console.log(new Date().toLocaleString() + " - found discord channel '" + channel.name + "' (" + channel.id + ") in guild '" + guild.name + "' (" + guild.id + ")")
	let message = await channel.send("placeholder")
	console.log(new Date().toLocaleString() + " - created discord message " + message.id)
	client.destroy()
})()