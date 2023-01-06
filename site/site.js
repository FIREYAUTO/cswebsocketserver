//{{ Settings }}\\

const St = {
	WSMessages: true,
};

//{{ Websocket Functions }}\\

async function NewSocket(URL){
	const Socket = new WebSocket(URL);
	return new Promise((resolve,reject)=>{
		const Timer = setInterval(()=>{
			if(Socket.readyState==1)
				clearInterval(Timer),
				resolve(Socket);
		},10);
	})
}

function SocketObject(Socket){
	const Obj = {
		_Socket:Socket,
		send:function(Type,Data={}){
			const Send = {
				Type:Type,
				Data:Data,
			}
			this._Socket.send(JSON.stringify(Send));
		},
		connect:function(c){
			this._Socket.onmessage=(Content)=>{
				let Data = JSON.parse(Content.data);
				if (!Data.Success){
					return console.log(Data.Response);
				}
				c(Data.Response);
			}
		},
	}
	return Obj;
}

//{{ Document Variables }}\\

function element(id){
	return document.getElementById(id);
}

const Log = element("log"),
	Bar = element("bar");

//{{ Element Functions }}\\

function Apply(a,b){
	for(let k in b){
		let v=b[k];
		if(typeof v=="object")Apply(a[k],v);
		else a[k]=v;
	}
}

function Create(a,b,c={}){
	var e = document.createElement(a);
	Apply(e,c)
	if(b){
		let f=b.firstChild;
		if(f)b.insertBefore(e,f);
		else b.appendChild(e);
	}
	return e;
}

function Say(Options={}){
	let d = new Date();
	let n = d.toLocaleTimeString();
	Create("p",Log,{
		innerHTML:`<span style="color:#9a9a9a;">[${n}]</span> ${Options.Text}`,
		style:{
			color:Options.TextColor||"#efefef",
		},
	});
}

function Warn(Text){
	Say({
		Text:Text,
		TextColor:"#ffaa1c",
	});
}

function Info(Text){
	Say({
		Text:Text,
		TextColor:"#1c7aff",
	});
}

function Error(Text){
	Say({
		Text:Text,
		TextColor:"#ff1c4a",
	});
}

function BSay(Text){
	Say({
		Text:Text,
		TextColor:"#efefef",
	});
}

//{{ Start }}\\

async function Start(){
	
	/*
	const Socket = SocketObject(await NewSocket("ws://localhost:42069/ws"));

	const SocketTypes = {

	};

	Socket.connect((Data)=>{
		let C = SocketTypes[Data.Type];
		if(!C)return;
		C(Data.Data);
	});
	*/

	IPC.on("RobloxClientConnect",(Event,Data)=>{
		Warn(`Roblox-Client Socket Connected as "${Data}"!`);
	});

	IPC.on("RobloxClientDisconnect",(Event,Data)=>{
		Warn(`Roblox-Client Socket Disconnected!`);
	});

	IPC.on("RobloxClientMessage",(Event,Data)=>{
		if(!St.WSMessages)return;
		Data=JSON.parse(Data);
		BSay(`${Data.Name}: ${Data.Message}`);
	})

}

//{{ Start Setup }}\\

IPC.on("Start",(Event,Value)=>{
	if(Value)Start();
})

//{{ Backend }}\\

String.prototype.newRep = function(Find,Rep){
	let e = this.replace(new RegExp(Find,"g"),Rep);
	return e;
  };

const Backend = {
	CheckExtraData:function(ExtraData,PropName,PropValue){
		if (ExtraData == null){return true}
		if (!ExtraData.hasOwnProperty(PropName)){return true}
		if (ExtraData[PropName] == PropValue){return true}
		return false;
	},
}

function ColorWord(t,c){
	return `<span style="color:${c}">${t}</span>`;
}

// ++ -- ++ {{ COMMAND SYSTEM }} ++ -- ++ \\

// Settings

const Settings = {
	Prefix: ".",
	Splitter: " ",
	ParameterTypes: {
		String: function(self){
			return String(self.Token);
		},
		Integer: function(self){
			return parseInt(self.Token);
		},
		Float: function(self){
			return parseFloat(self.Token);
		},
		Boolean: function(self){
			return ["on","1","true","yes"].includes(self.Token.toLowerCase())?true:false;
		},
		LongString: function(self){
			let String = [];
			while(!self.IsEnd())
				String.push(self.Token),self.Next();
			return String.join(Settings.Splitter);
		},
	},
	Commands: [],
};

// Classes

class Stack {
	constructor(Arguments){
		this.Tokens = Arguments,
		this.Position = 0,
		this.Token = Arguments[0];
	}
	Next(Amount=1){
		this.Position+=Amount;
		this.Token=this.Tokens[this.Position];
		return this.Token;
	}
	IsEnd(){
		return this.Position >= this.Tokens.length;
	}
}

class Command {
	constructor(Options={}){
		this.Names = Options.Names||[],
		this.Description = Options.Description||"",
		this.Call = Options.Call,
		this.Parameters = Options.Parameters||[];
	}
	Fire(Parameters=[]){
		let P = this.Parameters,
			S = new Stack(Parameters),
			PS = [];
		for(let PN of P)
			if(S.IsEnd())break;
			else PS.push(Settings.ParameterTypes[PN.split(":")[1]](S)),S.Next();
		return this.Call(...PS);
	}
}

class CommandResult {
	constructor(Success=false,Result){
		this.Success=Success,this.Result=Result;
	}
	toString(){
		return `${this.Success}, ${this.Result}`;
	}
}

// Command System

const CommandSystem = {
	Add: function(Value){
		if(Value instanceof Command)Settings.Commands.push(Value);
	},
	Run: function(Text){
		const Message = Text.split(Settings.Splitter);
		if(!Message[0].startsWith(Settings.Prefix))return new CommandResult(false,"No Prefix");
		Message[0]=Message[0].substring(Settings.Prefix.length,Message[0].length).toLowerCase();
		for(let Command of Settings.Commands){
			if(Command.Names.includes(Message[0])){
				let Success=false,Result="";
				Message.shift();
				try{
					Result = Command.Fire(Message),
					Success = true;
				}catch(E){
					Result = E;
				}
				return new CommandResult(Success,Result);
			}
		}
	},
}

// Commands

CommandSystem.Add(new Command({
	Names: ["log"],
	Parameters: ["Text:LongString"],
	Description: "Logs the given text to the output",
	Call: function(Text){
		Say({
			Text:Text,
			TextColor:"#bfbfbf",
		});
	},
}));

CommandSystem.Add(new Command({
	Names: ["cmds","commands","help"],
	Parameters: [],
	Description: "Prints out all commands",
	Call: function(){
		for(let Command of Settings.Commands){
			let Names = "";
			if(Command.Names.length>1) Names="&lt;"+Command.Names.join(", ")+"&gt;";
			else Names=Command.Names[0];
			let Parameters = [];
			for(let PN of Command.Parameters){
				let P = PN.split(":");
				Parameters.push(`[${P[0]}: ${P[1]}]`);
			}
			Parameters = Parameters.join(Settings.Splitter);
			Info(`${Settings.Prefix}${Names}${Settings.Splitter}${Parameters} (${Command.Description})`);
		}
	},
}));

CommandSystem.Add(new Command({
	Names: ["wsmessage","wsmsg"],
	Parameters: ["Enabled:Boolean"],
	Description: "Toggles WSMessages",
	Call: function(Enabled){
		let N = "WSMessages";
		St[N]=Enabled
		Info(`${N} is now ${Enabled?"on":"off"}`);
	},
}));

CommandSystem.Add(new Command({
	Names: ["send"],
	Parameters: ["Text:LongString"],
	Description: "Sends the given text to the connected Roblox Client",
	Call: function(Text){
		IPC.send("RobloxClientSend",Text);
	},
}));

//

//{{ Input }}\\

var Blurred = true

Bar.onblur = function(){Blurred = true}
Bar.onfocus = function(){Blurred = false}

window.addEventListener("keyup",(event)=>{
	if(event.key.toLowerCase() == "/" && Blurred)
		Bar.focus();
});

Bar.addEventListener("keyup",event=>{
	if (event.keyCode == 13){
		if (Bar.value == ""){return}
		Say({
			Text:Bar.value,
			TextColor:"#bfbfbf",
		});
		let CR = CommandSystem.Run(Bar.value);
		if(!CR.Success){
			Say({
				Text:CR.Result,
				TextColor:"#ff1c4a"
			})
		}
		Bar.value = "";
	} else if (event.keyCode == 27){
		Bar.value = "";
	}
});

element("clear-btn").addEventListener("mousedown",()=>{
	let c = Log.firstChild;
	while(c){
		c.remove();
		c=Log.firstChild;
	}
})
