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
		innerHTML:`[<span style="color:#9a9a9a;">${n}</span>] ${Options.Text}`,
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

//{{ Input }}\\

var Blurred = true

Bar.onblur = function(){Blurred = true}
Bar.onfocus = function(){Blurred = false}

window.addEventListener("keydown",(event)=>{
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
		IPC.send("RobloxClientSend",Bar.value);
		Bar.value = "";
	} else if (event.keyCode == 27){
		Bar.value = "";
	}
});
