const DiscordJS = require("discord.js")
const GameDig = require("gamedig")
function GameServer (options) {
	this.id = options.host + ":" + options.port
	this.interval = 30000
	if (options.interval) {
		this.interval = options.interval
		delete options.interval
	}
	this.getMap = (map) => {
		return map
	}
	this.options = options
	this.discord = {client: null, login: "", updateActivity: false, editMsg: false, channelID: "", msgID: "", reportDown: false, reportChannelID: "", reportPrefixDown: "", reportPrefixUp: ""}
	this.info = {name: "", map: "", password: false, maxplayers: 0, players: [], bots: [], connect: "", ping: 0, time: 0}
	this.error = ""
	this.activity = ""
	this.online = true
	this.getActivity = () => {
		if (this.error !== "") {
			return "Server Offline"
		}
		let activity = this.info.players.length + "/" + this.info.maxplayers
		let map = this.getMap(this.info.map)
		if (map !== "") {
			activity += " on " + map
		}
		return activity
	}
	this.getMessage = (message) => {
		let embed = new DiscordJS.MessageEmbed().setTitle(this.info.name)
		if (this.error !== "") {
			embed.addField("Status", "Offline (" + this.error + ")")
		} else {
			embed.addField("Status", "Online")
			embed.addField("IP Address", this.info.connect)
			let map = this.getMap(this.info.map)
			if (map !== "") {
				embed.addField("Map", map)
			}
			embed.addField("Players", this.info.players.length + "/" + this.info.maxplayers, true)
			if (this.info.bots.length > 0) {
				embed.addField("Bots", this.info.bots.length.toString(), true)
			}
		}
		msg = {content: null, embeds: [embed]}
		if (message != "") {
			msg.content = message
		}
		return msg
	}
	this.sendMessage = async (message) => {
		if (this.discord.client !== null && this.discord.reportDown) {
			let channel
			try {
				channel	= await this.discord.client.channels.fetch(this.discord.reportChannelID || this.discord.channelID)
			} catch (error) {
				console.error(new Date().toLocaleString() + " - '" + this.id + "' - failed to get discord channel (" + error + ")")
				return
			}
			
			let msg
			try {
				msg = await channel.send(this.getMessage(message))
			} catch (error) {
				console.error(new Date().toLocaleString() + " - '" + this.id + "' - failed to send discord message (" + error + ")")
				return
			}
		}
	}
	this.query = async (discordopt) => {
		if (typeof(discordopt) == "string") {
			this.discord.login = discordopt
		} else if (typeof(discordopt) == "object" && discordopt.constructor.name == "Client") {
			this.discord.client = discordopt
		} else if (typeof(discordopt) == "object") {
			Object.assign(this.discord, discordopt)
		}
		if (this.discord.client === null && this.discord.login !== "") {
			this.discord.client = new DiscordJS.Client({intents: 0})
			try {
				await this.discord.client.login(this.discord.login)
				console.log(new Date().toLocaleString() + " - '" + this.id + "' - logged into discord (" + this.discord.client.user.tag + ")")
			} catch(error) {
				console.error(new Date().toLocaleString() + " - '" + this.id + "' - failed to log into discord (" + error + ")")
				if (error.code == "TOKEN_INVALID") {
					console.error(new Date().toLocaleString() + " - '" + this.id + "' - disabling discord login due to fatal error")
					this.discord.login = ""
				}
				this.discord.client = null
			}
		}
		try {
			let data = await GameDig.query(this.options)
			data.time = Date.now()
			this.info = data
			this.error = ""
			this.id = this.info.connect + " (" + this.info.name + ")"
		} catch (error) {
			this.error = error
		}
		this.timeout = setTimeout(() => this.query(), this.interval)
		let activity = this.getActivity()
		if (this.error !== "") {
			console.error(new Date().toLocaleString() + " - '" + this.id + "' - " + this.error)
			if (this.online) {
				await this.sendMessage(this.discord.reportPrefixDown)
			}
			this.online = false
		} else {
			console.log(new Date().toLocaleString() + " - '" + this.id + "' - " + activity)
			if (!this.online) {
				await this.sendMessage(this.discord.reportPrefixUp)
			}
			this.online = true
		}
		if (this.activity === activity) {
			return
		}
		this.activity = activity
		if (this.discord.client !== null && this.discord.updateActivity) {
			try {
				await this.discord.client.user.setActivity({name: activity, type: 3})
			} catch (error) {
				console.error(new Date().toLocaleString() + " - '" + this.id + "' - failed to update discord status (" + error + ")")
			}
		}
		if (this.discord.client !== null && this.discord.editMsg && this.discord.channelID !== "" && this.discord.msgID !== "") {
			let channel
			try {
				channel	= await this.discord.client.channels.fetch(this.discord.channelID)
			} catch (error) {
				console.error(new Date().toLocaleString() + " - '" + this.id + "' - failed to get discord channel (" + error + ")")
				return
			}
			
			let message
			try {
				message = await channel.messages.fetch(this.discord.msgID)
			} catch (error) {
				console.error(new Date().toLocaleString() + " - '" + this.id + "' - failed to get discord message (" + error + ")")
				return
			}
			
			let edit
			try {
				edit = await message.edit(this.getMessage())
			} catch (error) {
				console.error(new Date().toLocaleString() + " - '" + this.id + "' - failed to edit discord message (" + error + ")")
				return
			}
		}
	}
	return this
}
module.exports = { GameServer: GameServer }