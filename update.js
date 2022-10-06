const fs = require("fs");
const path = require("path");
const HTTPModule = require("https");
const QueryString = require("querystring");
const Stream = require('stream').Transform;

const HTTP = {
  Get:async function(Host,Path,EncodingMethod){
    let Results = await new Promise(res=>{
      let req = HTTPModule.request({
        hostname:Host,
        path:Path,
        method:"GET",
      },r=>{
		let str = ""
		r.setEncoding(EncodingMethod);
		r.on("data",chunk=>{str+=chunk});
		r.on("end",()=>{
			res(str);
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

const files = ["site/customize.css","site/index.html","site/site.js","site/style.css","start.bat","update.bat","package.json","setup.bat","site/icon.png","update.js"];
const updateUrl = "/cswebsocketserver/";

(async()=>{
	const D = Date.now();
	console.log("\x1b[34m","Update Script Starting",'\x1b[0m')
	try {
		let fl = files.length;
		for(let k in files){
			k=+k;
			let name = files[k]
			let enc = name.endsWith(".png")?"binary":"utf8";
			let contents = await HTTP.Get("fireyauto.github.io",updateUrl+name,enc);
			console.log(`Updating "${name}" [${k+1}/${fl}]`);
			fs.writeFileSync(path.join(__dirname,name),contents.trimEnd(),enc==="binary"?"binary":undefined);
			console.log("\x1b[32m",`Done Updating "${name}" [${k+1}/${fl}]`,'\x1b[0m');
		}
	}catch(e){
		console.log("\x1b[31m",`This script has errored! Contact the developer with a screenshot of this message\n${e.toString()}`,'\x1b[0m');
	}
	console.log("\x1b[34m",`Update Script Finished; took ${Date.now()-D}ms`,'\x1b[0m')
})()
