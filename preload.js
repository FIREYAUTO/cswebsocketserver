const { contextBridge,webFrame,ipcRenderer:IPCRenderer } = require("electron");

const IPC = {
	_C:{},
	getC:function(Name){
		return IPC._C[Name];
	},
	setupC:function(Name,Cs){
		IPCRenderer.on(Name,(Event,Args)=>{
			for(let C of Cs){
				try { 
					C(Event,Args);
				}catch(E){
					webFrame.executeJavaScript(`console.log("[${Name} IPC Error]: ${String(E)}")`)
				}
			}
		});
	},
	makeC:function(Name){
		let v=[];
		IPC._C[Name]=v;
		IPC.setupC(Name,v);
		return v;
	},
	send:function(Name,Args={}){
		IPCRenderer.send(Name,Args);
	},
	on:function(Name,C){
		let Cs = IPC.getC(Name);
		if(!Cs)Cs = IPC.makeC(Name);
		Cs.push(C);
	},
}

contextBridge.exposeInMainWorld("IPC",IPC)
