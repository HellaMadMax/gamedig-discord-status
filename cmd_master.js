let address = process.argv[2]
if (typeof(address) == "undefined" || address == "") {
	console.error("missing ip address/domain")
	process.exit(1)
}
const dns = require("dns").promises
const steam = require("steam-server-query")
const gamedig = require("gamedig");
(async () => {
	if (!/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(address)) { // not in ip address format, assume domain
		let response = await dns.lookup(address)
		if (!response || !response.address) {
			console.log("failed to resolve domain '" + address + "'")
			process.exit(1)
		}
		console.log("resolved domain '" + address + "' to " + response.address)
		address = response.address
	}
	let servers = await steam.queryMasterServer("hl2master.steampowered.com:27011", steam.REGIONS.ALL, {gameaddr: address})
	console.log(servers)
	for (let i in servers) {
		let server = servers[i].split(":")
		let data = await gamedig.query({type: "protocol-valve", host: server[0], port: server[1]})
		console.log(server, "\n", data)
	}
})()