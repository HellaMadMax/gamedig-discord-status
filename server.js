const EventEmitter = require("events").EventEmitter
const DiscordJS = require("discord.js")
const GameDig = require("gamedig")
class GameServer extends EventEmitter {
	constructor(options) {
		super()
		this.options = {
			type: "protocol-valve",
			maxAttempts: 4,
			socketTimeout: 6000,
			givenPortOnly: true,
			id: "",
			interval: 30 * 1000, // 30 seconds
			client: null,
			login: "",
			discordDebug: false,
			logDebug: false,
			logActivity: true,
			updateActivity: false,
			updateMessage: false,
			updateInterval: 30 * 60000, // 30 minutes
			channelID: "",
			messageID: "",
			messageLinkIP: true,
			reportDown: false,
			reportChannelID: "",
			reportPrefixDown: "",
			reportPrefixUp: ""
		}
		if (typeof(options) === "object") {
			Object.assign(this.options, options)
		}
		if (!this.options.host) {
			console.error(new Date().toLocaleString() + " - fatal error (options.host must be specified)")
			return
		}
		this.GameDig = new GameDig()
		let game = this.GameDig.queryRunner.gameResolver.gamesByKey.get(this.options.type)
		if (this.options.type.slice(0,9) !== "protocol-" && !game) {
			console.error(new Date().toLocaleString() + " - fatal error (options.type is invalid, check gamedig docs for supported games)")
			return
		}
		if (!game) {
			game = {keys: [], pretty: "", options: {protocol: this.options.type.slice(9)}, extra: {}}
		}
		this.game = game
		if (!this.options.port) {
			console.error(new Date().toLocaleString() + " - fatal error (options.port must be specified)")
			return
		}
		this.info = {name: "(Unknown)", map: "", password: false, maxplayers: 0, players: [], bots: [], connect: "", ping: 0, raw: {}, time: 0}
		this.lastActivity = {msg: "", time: 0}
		this.lastMessage = {msg: "", time: 0}
		this.lastOnline = true
		this.mapNames = new Map()
	}
	addMap(map, name) {
		this.mapNames.set(map, name)
		return this
	}
	getMap(map) {
		let event = {map: map}
		this.emit("getMap", event)
		if (event.map == map && this.mapNames.get(map)) {
			event.map = this.mapNames.get(map)
		}
		return event.map
	}
	getGame() {
		let event = {game: this.info.raw.game, type: "query"}
		if (!event.game && this.game.pretty) {
			event.game = this.game.pretty.replace(/ \(\d\d\d\d\)/g, "") // remove year on the end
			event.type = "name"
		}
		this.emit("getGame", event)
		return event.game
	}
	getActivity() {
		let players = this.info.players.length
		if (this.info.bots.length > 0) {
			players = players + " (" + this.info.bots.length + ")"
		}
		let activity = {name: players + "/" + this.info.maxplayers, type: 3}
		let map = this.getMap(this.info.map)
		if (map) {
			activity.name += " on " + map
		}
		if (this.info.error) {
			activity.name = "Server Offline"
		}
		this.emit("getActivity", activity)
		return activity
	}
	getMessage(content) {
		let embed = new DiscordJS.MessageEmbed().setTitle(this.options.id)
		embed.addField("Name", this.info.name)
		if (this.game.options.protocol == "valve" && this.info.connect && this.options.messageLinkIP) {
			embed.addField("IP Address", "steam://connect/" + this.info.connect, true)
		} else {
			embed.addField("IP Address", this.info.connect || this.options.host + ":" + this.options.port, true)
		}
		if (this.info.error) {
			let offline = "Offline"
			if (this.info.time > 0) {
				offline += " <t:" + Math.floor(this.info.time / 1000) + ":R>"
			}
			embed.addField("Status", offline, true).setColor("#ff0000")
		} else {
			embed.addField("Status", "Online", true).setColor("#00ff00")
		}
		embed.addField("Game", this.getGame() || "(Unknown)")
		embed.addField("Map", this.getMap(this.info.map) || "(Unknown)", true)
		if (this.info.maxplayers > 0) {
			let players = this.info.players.length
			if (this.info.bots.length > 0) {
				players += " (" + this.info.bots.length + ")"
			}
			embed.addField("Players", players + "/" + this.info.maxplayers, true)
		}
		let message = {content: null, embeds: [embed]}
		if (content) {
			message.content = content
		}
		this.emit("getMessage", message)
		return message
	}
	async updateActivity(activity) {
		if (this.options.client === null) {
			console.error(new Date().toLocaleString() + " - '" + this.options.id + "' - cannot update discord activity (not logged in)")
			return
		}
		this.emit("updateActivity", activity)
		let presence
		try {
			presence = await this.options.client.user.setActivity(activity)
		} catch (error) {
			console.error(new Date().toLocaleString() + " - '" + this.options.id + "' - failed to update discord activity (" + error + ")")
			return
		}
		if (this.options.logDebug) {
			console.log(new Date().toLocaleString() + " - '" + this.options.id + "' - [DEBUG] '" + this.options.client.user.tag + "' updated discord activity to '" + JSON.stringify(activity) + "'")
		}
		this.emit("updatedActivity", activity, presence)
		return presence
	}
	async updateMessage(newMessage, channelID, messageID) {
		if (this.options.client === null) {
			console.error(new Date().toLocaleString() + " - '" + this.options.id + "' - cannot edit discord message (not logged in)")
			return
		}
		channelID = channelID || this.options.channelID
		if (channelID == "") {
			console.error(new Date().toLocaleString() + " - '" + this.options.id + "' - cannot edit discord message (missing channelID)")
			return
		}
		messageID = messageID || this.options.messageID
		if (messageID == "") {
			console.error(new Date().toLocaleString() + " - '" + this.options.id + "' - cannot edit discord message (missing messageID)")
			return
		}
		this.emit("updateMessage", newMessage)
		let channel
		try {
			channel	= await this.options.client.channels.fetch(channelID)
		} catch (error) {
			console.error(new Date().toLocaleString() + " - '" + this.options.id + "' - failed to get discord channel " + channelID + " (" + error + ")")
			return
		}
		let message
		try {
			message = await channel.messages.fetch(messageID)
		} catch (error) {
			console.error(new Date().toLocaleString() + " - '" + this.options.id + "' - failed to get discord message " + messageID + " in channel '" + channel.name + "' (" + channel.id + ") in guild " + channel.guild.id + " (" + error + ")")
			return
		}
		let edit
		try {
			edit = await message.edit(newMessage)
		} catch (error) {
			console.error(new Date().toLocaleString() + " - '" + this.options.id + "' - failed to edit discord message " + message.id + " in channel '" + channel.name + "' (" + channel.id + ") in guild " + channel.guild.id + " (" + error + ")")
			return
		}
		if (this.options.logDebug) {
			console.log(new Date().toLocaleString() + " - '" + this.options.id + "' - [DEBUG] '" + this.options.client.user.tag + "' updated discord message " + edit.id + " in channel '" + channel.name + "' (" + channel.id + ") in guild " + channel.guild.id + " to '" + JSON.stringify(newMessage) + "'")
		}
		this.emit("updatedMessage", newMessage, edit)
		return edit
	}
	async sendMessage(message, channelID) {
		if (this.options.client === null) {
			console.error(new Date().toLocaleString() + " - '" + this.options.id + "' - cannot send discord message (not logged in)")
			return
		}
		channelID = channelID || this.options.reportChannelID || this.options.channelID
		if (channelID == "") {
			console.error(new Date().toLocaleString() + " - '" + this.options.id + "' - cannot send discord message (missing channelID)")
			return
		}
		this.emit("sendMessage", message)
		let channel
		try {
			channel	= await this.options.client.channels.fetch(channelID)
		} catch (error) {
			console.error(new Date().toLocaleString() + " - '" + this.options.id + "' - failed to get discord channel " + channelID + " (" + error + ")")
			return
		}
		let sent
		try {
			sent = await channel.send(message)
		} catch (error) {
			console.error(new Date().toLocaleString() + " - '" + this.options.id + "' - failed to send discord message in channel '" + channel.name + "' (" + channel.id + ") in guild " + channel.guild.id + " (" + error + ")")
			return
		}
		console.log(new Date().toLocaleString() + " - '" + this.options.id + "' - sent discord message " + sent.id + " from '" + this.options.client.user.tag + "' in channel " + channel.id + " in guild " + channel.guild.id)
		this.emit("sentMessage", message, sent)
		return sent
	}
	async reportDown() { return await this.sendMessage(this.getMessage(this.options.reportPrefixDown)) }
	async reportUp() { return await this.sendMessage(this.getMessage(this.options.reportPrefixUp)) }
	async login(token) {
		this.options.client = new DiscordJS.Client({intents: 0})
		try {
			await this.options.client.login(token || this.options.login)
			console.log(new Date().toLocaleString() + " - '" + this.options.id + "' - '" + this.options.client.user.tag + "' logged into discord")
			this.emit("discordLogin", this.options.client)
		} catch(error) {
			console.error(new Date().toLocaleString() + " - '" + this.options.id + "' - failed to log into discord (" + error + ")")
			if (error.code == "TOKEN_INVALID") {
				console.error(new Date().toLocaleString() + " - '" + this.options.id + "' - disabling discord login due to invalid token")
				this.options.login = ""
			}
			this.options.client = null
			this.emit("discordLoginError", error)
		}
		if (this.options.discordDebug) {
			this.options.client.on("debug", (msg) => console.log(new Date().toLocaleString() + " - '" + this.options.id + "' - [DISCORD DEBUG] " + msg))
		}
	}
	async query() {
		if (!this.options.id) {
			this.options.id = this.options.host + ":" + this.options.port
		}
		if (this.options.client === null && this.options.login !== "") {
			await this.login()
		}
		try {
			this.info = await this.GameDig.queryRunner.run(this.options)
			this.info.time = Date.now()
			this.emit("query", this.info)
		} catch (error) {
			this.info.error = error
			console.error(new Date().toLocaleString() + " - '" + this.options.id + "' - failed to query server (" + this.info.error + ")")
			this.emit("queryError", error)
		}
		this.timeout = setTimeout(() => this.query(), this.options.interval)

		let activity = this.getActivity()
		if (JSON.stringify(this.lastActivity.msg) !== JSON.stringify(activity)) {
			if (this.options.logActivity) {
				console.log(new Date().toLocaleString() + " - '" + this.options.id + "' - " + activity.name + " (" + this.getGame() + ")")
			}
			this.emit("activityChange", this.lastActivity.msg, activity)
			if (this.options.updateActivity) {
				await this.updateActivity(activity)
			}
			this.lastActivity.msg = activity
			this.lastActivity.time = Date.now()
		} else if (this.options.updateActivity && this.options.updateInterval > 0 && (Date.now() - this.lastActivity.time) > this.options.updateInterval) {
			if (this.options.logDebug) {
				console.log(new Date().toLocaleString() + " - '" + this.options.id + "' - [DEBUG] updateInterval reached (" + (this.options.updateInterval / 6000) + " minutes)")
			}
			await this.updateActivity(activity)
			this.lastActivity.time = Date.now()
		}

		let msg = this.getMessage()
		if (JSON.stringify(this.lastMessage.msg) !== JSON.stringify(msg)) {
			this.emit("messageChange", this.lastMessage.msg, msg)
			if (this.options.updateMessage) {
				await this.updateMessage(msg)
			}
			this.lastMessage.msg = msg
			this.lastMessage.time = Date.now()
		}

		if (this.info.error && this.lastOnline) {
			this.emit("reportDown")
			if (this.options.reportDown) {
				await this.reportDown()
			}
			this.lastOnline = false
		} else if (!this.info.error && !this.lastOnline) {
			this.emit("reportUp")
			if (this.options.reportDown) {
				await this.reportUp()
			}
			this.lastOnline = true
		}
	}
}
module.exports = GameServer