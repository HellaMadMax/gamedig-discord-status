# Gamedig Discord Status
Script which uses [gamedig](https://github.com/gamedig/node-gamedig) and [discord.js](https://github.com/discordjs/discord.js) to show the player count and map of a game server as the discord message or bot activity status

## Installation & Usage
```shell
npm install gamedig-discord-status
```
```javascript
const GameServer = require('gamedig-discord-status').GameServer
let dods = new GameServer({
	type: "dods",
	host: "207.148.87.25",
	port: 27016,
	maxAttempts: 4,
	socketTimeout: 6000
}).query({
	login: "token",
	updateStatus: false,
	editMsg: true,
	channelID: "1234567890987654321",
	msgID: "0987654321234567890",
	reportFail: true,
	reportPrefixDown: "<@2345678909876543> Server has stopped responding",
	reportPrefixUp: "Server is now responding"
})
```

## Options

### GameServer options

Most of the options are [gamedig query options](https://github.com/gamedig/node-gamedig#query-options) with the addition of:
* **interval**: number - Milliseconds to wait between queries

### Discord options

Used for GameServer.query()

* **client**: object - Directly pass a discord.js client object to be used instead of it being automatically created
* **login**: string - Discord Login token
* **updateActivity**: boolean - Update discord bot activity with player count
* **editMsg**: boolean - Update discord message with player count (requires both ChannelID and MsgID)
* **channelID**: string - Discord channel ID
* **msgID**: string - Discord message ID (MUST BE FROM CURRENT BOT TO EDIT)
* **reportDown**: boolean - Report when a server stops responding to queries, and when it starts doing so again
* **reportChannelID**: string - Override the report channel to be different from editMsg channel
* **reportPrefixDown**: string - Prefix this message when reporting server not responding, useful for mentions
* **reportPrefixUp**: string - Prefix this message when reporting server started responding, useful for mentions

### Useful function overrides
* **getMap** (map) - used to format map, by default just returns first parameter
* **getActivity** () - used to format activity when updateActivity is enabled
* **getMessage** (message) - used to get embed format for sending or editing server message
Examples:
```javascript
const GameServer = require('gamedig-discord-status').GameServer
let hll1 = new GameServer({
	type: "hll",
	host: "176.57.135.34",
	port: 28015,
	maxAttempts: 4,
	socketTimeout: 6000
})
hll1.getMap = function(map) {
	return "test_" + map
}
hll1.getMessage = function() {
	if (this.error !== "") {
		return this.info.name + ": Offline"
	} else {
		return this.info.name + ": " + this.info.players.length + "/" + this.info.maxplayers + " players on " + this.getMap(this.info.map)
	}
}
hll1.query({
	login: "token",
	updateStatus: false,
	editMsg: true,
	channelID: "1234567890987654321",
	msgID: "0987654321234567890",
	reportFail: true,
	reportPrefixDown: "<@2345678909876543> Server has stopped responding",
	reportPrefixUp: "Server is now responding"
})
```

## Notes

### Query port
The query port can be different from the connect port you use to join the game.  
If you don't know what the query port and the game uses the valve protocol you can use the master server script to find out.
```
cd node_modules\gamedig-discord-status
npm run master 176.57.135.34

> gamedig-discord-status@0.1.0 master
> node cmd_master.js "176.57.135.34"

[ '176.57.135.34', '28015' ]
 Results {
  name: 'HLL Official - Australia #01',
  map: 'PHL',
  password: false,
  raw: {
    protocol: 17,
    folder: 'hlldir',
    game: 'Hell Let Loose',
    appId: 686810,
    numplayers: 0,
    numbots: 0,
    listentype: 'd',
    environment: 'w',
    secure: 1,
    version: '0.1.1.0',
    steamid: '90158480733430790',
    tags: [
      'GS:ojF+bcTzWycBAAAG',
      'CONMETHOD:P2P',
      'P2PADDR:90158480733430790',
      'P2PPORT:28000',
      'SESSIONFLAGS:171',
      'VISIB_i:0'
    ]
  },
  maxplayers: 100,
  players: Players(0) [],
  bots: Players(0) [],
  connect: '176.57.135.34:28000',
  ping: 46
}
[ '176.57.135.34', '28215' ]
 Results {
  name: 'HLL Official - Australia #02',
  map: 'Stalin',
  password: false,
  raw: {
    protocol: 17,
    folder: 'hlldir',
    game: 'Hell Let Loose',
    appId: 686810,
    numplayers: 0,
    numbots: 0,
    listentype: 'd',
    environment: 'w',
    secure: 1,
    version: '0.1.1.0',
    steamid: '90158480733513734',
    tags: [
      'GS:ozFGbsTzWycBAACG',
      'CONMETHOD:P2P',
      'P2PADDR:90158480733513734',
      'P2PPORT:28200',
      'SESSIONFLAGS:171',
      'VISIB_i:0'
    ]
  },
  maxplayers: 100,
  players: Players(0) [],
  bots: Players(0) [],
  connect: '176.57.135.34:28200',
  ping: 48
}
```
In this example the query and connect ports are:  
query 176.57.135.34:28015 => connect 176.57.135.34:28000
query 176.57.135.34:28215 => connect 176.57.135.34:28200

### Discord message edit
When updating status via editMsg the msgID MUST be one created by the bot, otherwise it will throw an error when attempting to edit it
You can easily make a placeholder message by running the createmsg script and using the returned message ID
```
npm run createmsg (login token) (channel ID)

> gamedig-discord-status@0.1.0 createmsg
> node cmd_createmsg.js "(login token)" "(channel ID)"

26/04/2022, 10:50:19 pm - logged into discord (Bot Name#1234)
26/04/2022, 10:50:19 pm - found discord channel (channel name)
26/04/2022, 10:50:20 pm - created discord message (1234567890987654321)
```

## License
This repository and the code inside it is licensed under the MIT License. Read [LICENSE](https://github.com/HellaMadMax/gamedig-discord-status/blob/main/LICENSE) for more information.
