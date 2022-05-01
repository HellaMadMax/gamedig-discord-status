const DiscordJS = require("discord.js")
const GameDig = require("gamedig")
function GameServer (options) {
	this.options = {id: options.host + ":" + options.port, interval: 30000, client: null, login: "", updateActivity: false, updateMessage: false, channelID: "", messageID: "", reportDown: false, reportChannelID: "", reportPrefixDown: "", reportPrefixUp: ""}
	if (typeof(options) == "string") {
		this.options.login = options
	} else if (typeof(options) == "object" && options.constructor.name == "Client") {
		this.options.client = options
	} else if (typeof(options) == "object") {
		Object.assign(this.options, options)
	}
	this.GameDig = new GameDig()
	this.activity = ""
	this.error = ""
	this.info = {name: "(Unknown)", map: "(Unknown)", password: false, maxplayers: 0, players: [], bots: [], connect: "", ping: 0, raw: {}, time: 0}
	this.online = true
	this.mapNames = new Map()
	this.addMap = (map, name) => {
		this.mapNames.set(map, name)
		return this
	}
	this.getMap = (map) => this.mapNames.get(map) || map
	this.getActivity = () => {
		if (this.error) {
			return "Server Offline"
		}
		let players = this.info.players.length
		if (this.info.bots.length > 0) {
			players = players + " (" + this.info.bots.length + ")"
		}
		let activity = players + "/" + this.info.maxplayers
		let map = this.getMap(this.info.map)
		if (map) {
			activity += " on " + map
		}
		return activity
	}
	this.updateActivity = async (activity) => {
		if (this.options.client === null) {
			console.error(new Date().toLocaleString() + " - '" + this.options.id + "' - cannot update discord activity (not logged in)")
			return
		}
		try {
			await this.options.client.user.setActivity({name: activity, type: 3})
		} catch (error) {
			console.error(new Date().toLocaleString() + " - '" + this.options.id + "' - failed to update discord activity (" + error + ")")
		}
	}
	this.getMessage = (message) => {
		let game = this.GameDig.queryRunner.gameResolver.gamesByKey.get(this.options.type)
		let embed = new DiscordJS.MessageEmbed().setTitle(this.options.id)
		if (this.error) {
			embed.setDescription("**Status:** Offline (" + this.error + ")").setColor("#ff0000")
		} else {
			embed.setDescription("**Status:** Online").setColor("#00ff00")
		}
		embed.addField("Name", this.info.name)
		if ((this.options.type == "protocol-valve" || game.options.protocol == "valve") && this.info.connect) {
			embed.addField("IP Address", "steam://connect/" + this.info.connect)
		} else {
			embed.addField("IP Address", this.info.connect || options.host + ":" + options.port)
		}
		let gameName = this.info.raw.game
		if (!gameName && game.pretty) {
			gameName = game.pretty.replace(/ \(\d\d\d\d\)/g, "") // remove year on the end
		}
		embed.addField("Game", gameName || "(Unknown)")
		let map = this.getMap(this.info.map)
		if (map) {
			embed.addField("Map", map, true)
		}
		if (this.info.maxplayers > 0) {
			let players = this.info.players.length
			if (this.info.bots.length > 0) {
				players = players + " (" + this.info.bots.length + ")"
			}
			embed.addField("Players", players + "/" + this.info.maxplayers, true)
		}
		msg = {content: null, embeds: [embed]}
		if (message) {
			msg.content = message
		}
		return msg
	}
	this.sendMessage = async (message) => {
		if (this.options.client === null) {
			console.error(new Date().toLocaleString() + " - '" + this.options.id + "' - cannot send discord message (not logged in)")
			return
		}
		if ((this.options.reportChannelID || this.options.channelID) == "") {
			console.error(new Date().toLocaleString() + " - '" + this.options.id + "' - cannot send discord message (missing channelID)")
			return
		}
		let channel
		try {
			channel	= await this.options.client.channels.fetch((this.options.reportChannelID || this.options.channelID))
		} catch (error) {
			console.error(new Date().toLocaleString() + " - '" + this.options.id + "' - failed to get discord channel (" + error + ")")
			return
		}
		let msg
		try {
			msg = await channel.send(this.getMessage(message))
		} catch (error) {
			console.error(new Date().toLocaleString() + " - '" + this.options.id + "' - failed to send discord message (" + error + ")")
			return
		}
	}
	this.updateMessage = async () => {
		if (this.options.client === null) {
			console.error(new Date().toLocaleString() + " - '" + this.options.id + "' - cannot edit discord message (not logged in)")
			return
		}
		if (this.options.channelID == "") {
			console.error(new Date().toLocaleString() + " - '" + this.options.id + "' - cannot edit discord message (missing channelID)")
			return
		}
		if (this.options.messageID == "") {
			console.error(new Date().toLocaleString() + " - '" + this.options.id + "' - cannot edit discord message (missing messageID)")
			return
		}
		let channel
		try {
			channel	= await this.options.client.channels.fetch(this.options.channelID)
		} catch (error) {
			console.error(new Date().toLocaleString() + " - '" + this.options.id + "' - failed to get discord channel (" + error + ")")
			return
		}
		let message
		try {
			message = await channel.messages.fetch(this.options.messageID)
		} catch (error) {
			console.error(new Date().toLocaleString() + " - '" + this.options.id + "' - failed to get discord message (" + error + ")")
			return
		}
		let edit
		try {
			edit = await message.edit(this.getMessage())
		} catch (error) {
			console.error(new Date().toLocaleString() + " - '" + this.options.id + "' - failed to edit discord message (" + error + ")")
			return
		}
	}
	this.query = async () => {
		if (this.options.client === null && this.options.login !== "") {
			this.options.client = new DiscordJS.Client({intents: 0})
			try {
				await this.options.client.login(this.options.login)
				console.log(new Date().toLocaleString() + " - '" + this.options.id + "' - logged into discord (" + this.options.client.user.tag + ")")
			} catch(error) {
				console.error(new Date().toLocaleString() + " - '" + this.options.id + "' - failed to log into discord (" + error + ")")
				if (error.code == "TOKEN_INVALID") {
					console.error(new Date().toLocaleString() + " - '" + this.options.id + "' - disabling discord login due to invalid token")
					this.options.login = ""
				}
				this.options.client = null
			}
		}
		try {
			let data = await this.GameDig.queryRunner.run(this.options)
			data.time = Date.now()
			this.info = data
			this.error = ""
		} catch (error) {
			this.error = error
		}
		this.timeout = setTimeout(() => this.query(), this.options.interval)
		let activity = this.getActivity()
		if (this.error !== "") {
			console.error(new Date().toLocaleString() + " - '" + this.options.id + "' - " + this.error)
			if (this.online) {
				this.online = false
				if (this.options.reportDown) {
					await this.sendMessage(this.options.reportPrefixDown)
				}
			}
		} else {
			console.log(new Date().toLocaleString() + " - '" + this.options.id + "' - " + activity)
			if (!this.online) {
				this.online = true
				if (this.options.reportDown) {
					await this.sendMessage(this.options.reportPrefixUp)
				}
			}
		}
		if (this.activity !== activity) { // only update when player count/map has changed
			this.activity = activity
			if (this.options.updateActivity) {
				await this.updateActivity(activity)
			}
			if (this.options.updateMessage) {
				await this.updateMessage()
			}
		}
	}
	return this
}
module.exports = { GameServer: GameServer }