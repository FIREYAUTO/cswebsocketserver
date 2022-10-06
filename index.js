const Version = "0.0.3";
const {app:App,BrowserWindow,ipcMain:IPCMain} = require("electron");
const { endianness } = require("os");
const Path = require("path");
const WebSocket = require("ws");

//{{ Websocket Functions }}\\

function uuidv4() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
	  	return v.toString(16);
	});
}

//{{ Window Loaded }}\\

function WindowLoaded(Window,IPC){

	const WServer = new WebSocket.Server({ port: 42069 });
	const Clients = new Map();

	function GetClientByName(Name){
		for(let Client of Clients.keys()){
			let Meta = Clients.get(Client);
			if(Meta.Name == Name){
				return Client;
			}
		}
	}

	function RobloxFire(Type,Data){
		let Roblox = GetClientByName("Roblox");
		if(Roblox)
			Roblox.send(JSON.stringify({
				Type:Type,
				Data:Data,
			}));
	}

	//{{ Websocket Connections }}\\

	const SocketTypes = {
		RobloxSocketConnectInbound:function(Data,Client,Meta){
			Meta.Name="Roblox";
			IPC.send("RobloxClientConnect",Data);
		},
		RobloxSocketStartDisconnect:function(Data,Client,Meta){
			RobloxFire("Close","Closed")
		},
		RobloxSocketMessage:function(Data,Client,Meta){
			IPC.send("RobloxClientMessage",JSON.stringify({
				Name:Data.Name,
				Message:Data.Message,
			}));
		},
	}
	WServer.on("connection",Client=>{
		const Id = uuidv4();
		const Metadata = {Id,Name:"Socket"};
		Clients.set(Client,Metadata);
		Client.on("message",Content=>{
			Content=Content.toString();
			let Result = JSON.parse(Content);
			let Success = true;
			if (SocketTypes[Result.Type]){
				try {
					Result = SocketTypes[Result.Type](Result.Data,Client,Metadata);
					Success = true;
				}catch(E){
					Result=`[Socket "${Result.Type}" Error]: ${E.toString()}`;
					Success = false
				}
			}else{
				Result = `No Socket Type "${Result.Type}"`;
				Success = false
			}
			if(Result!=undefined){
				Client.send(JSON.stringify({
					Response:Result,
					Success:Success,
				}));
			}
		});
		Client.on("close",()=>{
			if(Metadata.Name=="Roblox")
				IPC.send("RobloxClientDisconnect","Disconnected");
			Clients.delete(Client);
		})
	});

	//{{ Start IPC }}\\

	IPC.send("Start",true);

	IPC.on("RobloxClientSend",(Event,Data)=>{
		RobloxFire("Send",Data);
	})

}

//{{ Setup }}\\

function CreateWindow(){
	const Window = new BrowserWindow({
		width:800,
		height:600,
		webPreferences:{
			preload:Path.join(__dirname,"preload.js"),
		},
	});
	Window.loadFile("site/index.html");
	Window.removeMenu();

	//{{ IPC Connections }}\\

	const IPC = {
		_C:{},
		getC:function(Name){
			return this._C[Name];
		},
		setupC:function(Name,Cs){
			IPCMain.on(Name,(Event,Args)=>{
				for(let C of Cs){
					try { 
						C(Event,Args);
					}catch(E){
						console.log(`[${Name} IPC Error]: ${String(E)}`);
					}
				}
			});
		},
		makeC:function(Name){
			let v=[];
			this._C[Name]=v;
			this.setupC(Name,v);
			return v;
		},
		send:function(Name,Args){
			Window.webContents.send(Name,Args);
		},
		on:function(Name,C){
			let Cs = this.getC(Name);
			if(!Cs)Cs = this.makeC(Name);
			Cs.push(C);
		},
	}
	Window.webContents.on("did-finish-load",()=>{
		WindowLoaded(Window,IPC);
	});
}

App.whenReady().then(()=>{
	CreateWindow();
	App.on("activate",()=>{
		if(BrowserWindow.getAllWindows().length===0)CreateWindow();
	});
});

App.on("window-all-closed",()=>{
	if(process.platform!=="darwin")App.quit();
});

//{{ Version Checking }}\\

const HTTPModule = require("https");
const QueryString = require("querystring");

const HTTP = {
  Get:async function(Host,Path){
    let Results = await new Promise(res=>{
      let req = HTTPModule.request({
        hostname:Host,
        path:Path,
        method:"GET",
      },r=>{
		let rawData="";
		r.on("data",chunk=>{rawData+=chunk});
		r.on("end",()=>{
			res(rawData);
		});
      });
      req.end();
    }).then(a=>{
      return a.toString();
    });
    return Results;
  },
  URLEncode:function(Data){
    return QueryString.stringify(Data);
  },
};

(async()=>{
	let V = await HTTP.Get("fireyauto.github.io","/cswebsocketserver/version.txt");
	V=V.trimEnd();
	if(Version!=V){
		console.log("\x1b[33m",`You are using an out-of-date version!\nPlease run "npm run update"!\nYour Version: ${Version}\nNew Version: ${V}`,"\x1b[0m");
	}else{
		console.log("\x1b[32m",`You are running CS-WS-Server ${V}`,"\x1b[0m");
	}
})();
