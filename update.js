const fs = require("fs");
const path = require("path");
const HTTPModule = require("https");
const QueryString = require("querystring");

const HTTP = {
  Get:async function(Host,Path,EncodingMethod){
    let Results = await new Promise(res=>{
      let req = HTTPModule.request({
        hostname:Host,
        path:Path,
        method:"GET",
      },r=>{
		let rawData="";
		r.setEncoding(EncodingMethod);
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

const files = ["site/customize.css","site/index.html","site/site.js","site/style.css","update.js","start.bat","update.bat","package.json","setup.bat","site/icon.png"];
const updateUrl = "/cswebsocketserver/";

(async()=>{
	const D = Date.now();
	console.log("\x1b[34m","Update Script Starting",'\x1b[0m')
	try {
		let fl = files.length;
		for(let k in files){
			k=+k;
			let name = files[k]
			let contents = await HTTP.Get("fireyauto.github.io",updateUrl+name,name.endsWith(".png")?"ansi":"utf8");
			console.log(`Updating "${name}" [${k+1}/${fl}]`);
			fs.writeFileSync(path.join(__dirname,name),contents.trimEnd());
			console.log("\x1b[32m",`Done Updating "${name}" [${k+1}/${fl}]`,'\x1b[0m');
		}
	}catch(e){
		console.log("\x1b[31m",`This script has errored! Contact the developer with a screenshot of this message\n${e.toString()}`,'\x1b[0m');
	}
	console.log("\x1b[34m",`Update Script Finished; took ${Date.now()-D}ms`,'\x1b[0m')
})()
