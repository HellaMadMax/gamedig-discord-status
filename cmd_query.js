let address = process.argv[2]
if (typeof(address) == "undefined" || address == "") {
	console.error("missing ip address")
	return
}
let type = process.argv[3]
if (typeof(type) == "undefined" || type == "") {
	type = "protocol-valve"
}
let server = address.split(":")
const gamedig = require("gamedig")
gamedig.query({type: type, host: server[0], port: server[1]}).then(function(data) {
	console.log(address, "\n", data)
}).catch(function(error) {
	console.error(address, "\n", error)
})