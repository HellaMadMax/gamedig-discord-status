let address = process.argv[2]
if (typeof(address) == "undefined" || address == "") {
	console.error("missing ip address")
	return
}
const steam = require("steam-server-query")
const gamedig = require("gamedig")
steam.queryMasterServer("hl2master.steampowered.com:27011", steam.REGIONS.ALL, {gameaddr: address}).then(function(servers) {
	for (let i in servers) {
		let server = servers[i].split(":")
		gamedig.query({type: "protocol-valve", host: server[0], port: server[1]}).then(function(data) {
			console.log(server, "\n", data)
		}).catch(function(error) {
			console.error(server, "\n", error)
		})
	}
})