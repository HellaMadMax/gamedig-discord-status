# Gamedig Discord Status
Library which uses [gamedig](https://github.com/gamedig/node-gamedig) and [discord.js](https://github.com/discordjs/discord.js) to show the player count and map of a game server as a discord message or bot activity status.  
Can also report if the game server has gone down and send a discord message to report it.

### Images
![image](https://user-images.githubusercontent.com/3245005/166130950-600aba69-9ba8-44a5-a7bd-3eac3307e3e1.png)
![image](https://user-images.githubusercontent.com/3245005/166131252-4d127c39-c04f-45ad-8fdb-90d03f433012.png)
![image](https://user-images.githubusercontent.com/3245005/166130960-45d309b5-1baf-4a51-807d-e5d845a82cc8.png)

## Installation & Usage
```shell
npm install gamedig-discord-status
```
```javascript
const GameServer = require('gamedig-discord-status')
let hll1 = new GameServer({
	id: "Official Hell Let Loose Aus #1",
	type: "hll",
	host: "176.57.135.34",
	port: 28015,
	login: "token",
	updateActivity: true,
	updateMessage: true,
	channelID: "1234567890987654321",
	messageID: "0987654321234567890",
	reportDown: true,
	reportPrefixDown: "<@2345678909876543> Server has stopped responding",
	reportPrefixUp: "Server is now responding"
}).query()
```

## Options

### GameServer options

Most of the options are [gamedig query options](https://github.com/gamedig/node-gamedig#query-options) (**host** and **port** are required) with a few different defaults:
* **type**: "protocol-valve"
* **maxAttempts**: 4
* **socketTimeout**: 6000
* **givenPortOnly**: true

Non-GameDig options:
* **id**: string - Identifier for the server to show in logs and message title. Defaults to query IP:Port
* **interval**: number - Milliseconds to wait between queries. Defaults to 30 * 1000 (30 seconds)
* **client**: object - Directly pass a discord.js client object to be used instead of it being automatically created
* **token**: string - Discord Bot login token. They can be created [here](https://discord.com/developers/applications)
* **discordDebug**: boolean - Enables debug logging for discord client
* **logDebug**: boolean - console.log on updateActivity, updateMessage and sendMessage
* **logActivity**: boolean - console.log on activity change
* **updateActivity**: boolean - Update discord bot activity with player count
* **updateMessage**: boolean - Update discord message with player count (requires both ChannelID and MessageID)
* **updateInterval**: number - Milliseconds to wait before calling updateActivity even when activity text hasn't changed. Needed due to discord clearing activity after awhile of not reciving updates. Defaults to 30 * 60000 (30 minutes)
* **channelID**: string - Discord channel ID
* **messageID**: string - Discord message ID (MUST BE POSTED FROM DISCORD BOT ACCOUNT TO EDIT)
* **messageLinkIP**: boolean - Add steam://connect/ to ip address field in discord message (if game uses valve protocol). Defaults to true
* **reportDown**: boolean - Report when a server stops responding to queries, and when it starts doing so again
* **reportChannelID**: string - Use this channel instead of channelID when sending down reports
* **reportPrefixDown**: string - Prefix this message when reporting server not responding, useful for mentions
* **reportPrefixUp**: string - Prefix this message when reporting server started responding, useful for mentions

### Map formatting

You can either use **addMap** to add exact map names:
```javascript
const GameServer = require('gamedig-discord-status')
let hll1 = new GameServer({id: "Official Hell Let Loose Aus #1", type: "hll", host: "176.57.135.34", port: 28015})
.addMap("CT", "Carentan")
.addMap("Hill400", "Hill 400")
.addMap("Hurtgen", "Hürtgen Forest")
.addMap("Omaha", "Omaha Beach")
.addMap("PHL", "Purple Heart Lane",)
.addMap("StMarie", "Sainte-Marie-du-Mont")
.addMap("SME", "Sainte-Mère-Église")
.addMap("Stalin", "Stalingrad")
.addMap("Utah", "Utah Beach")
.query()
```
Or use **getMap** event to format it programmatically
```javascript
.on("getMap", function(event) {
	if (event.map == "de_") {
		event.map = event.map.substr(3)
	}
})
```

### Events

* **getMap** (event) - used by **getActivity**/**getMessage** for map
* **getGame** (event) - used by **getMessage** for game field
* **getActivity** (activity) - used to format activity when **updateActivity** is enabled
* **getMessage** (message) - used to format discord messages when sending or editing them (**updateMessage**/**reportDown**/**reportUp**)
* **updateActivity** (activity) - when **updateActivity** is called
* **updatedActivity** (activity, presence) - after **updateActivity** is called (**presence** is return value of client.setActivity)
* **updateMessage** (newMessage) - when **updateMessage** is called
* **updatedMessage** (newMessage, edit) - after **updateMessage** is called (**edit** is return value of message.edit)
* **sendMessage** (message) - when **sendMessage** is called
* **sentMessage** (message, sent) - after **sendMessage** is called (**sent** is return value of channel.send)
* **discordLogin** (client) - after discord client has logged in
* **discordLoginError** (error) - error while logging into discord
* **query** (query) - after receiving a valid query response from gamedig
* **queryError** (error) - error getting query from gamedig
* **activityChange** (from, to) - when activity text has changed
* **messageChange** (from, to) - when message text has changed
* **reportDown** () - after **queryError** when previous response was valid
* **reportUp** () - after **query** when previous response was error

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
When updating status via updateMessage the messageID MUST be one created by the bot, otherwise it will throw an error when attempting to edit it
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
