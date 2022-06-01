let address = process.argv[2]
if (typeof(address) == "undefined" || address == "") {
	console.error("missing ip address")
	process.exit(1)
}
let type = process.argv[3]
if (typeof(type) == "undefined" || type == "") {
	type = "protocol-valve"
}
let rules = process.argv[4]
if (typeof(rules) == "string" && rules.toLowerCase() === "rules") {
	rules = true
} else {
	rules = false
}
let server = address.split(":")
const gamedig = require("gamedig");
(async () => {
	let data = await gamedig.query({type: type, host: server[0], port: server[1], requestRules: rules})
	console.log(address, "\n", data)
})()