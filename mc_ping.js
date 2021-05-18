var mc = require('minecraft-protocol');
const fs = require("fs")
const fetch = require("node-fetch")
const http = require('http');
const path = require('path');

// var authData = JSON.parse(fs.readFileSync("auth.json").toString())
var options = {host: "test.2b2t.org",port: 25565} // ,username: authData.username,password: authData.password,auth: 'mojang'

function again() {
    mc.ping(options, function (err,data) {
        // console.log("Err",err)
        // console.log(data)
        var pastinfo = JSON.parse(fs.readFileSync("pastinfo.json").toString())
        if(err){
            pastinfo[new Date().getTime()] = JSON.stringify({"message":"Ping failed","code":err.code})
        }else{
            pastinfo[new Date().getTime()] = JSON.stringify(data)
        }
        
        fs.writeFileSync("pastinfo.json",JSON.stringify(pastinfo))
        console.log(JSON.stringify(data))
    })
    setTimeout(again,300000)
}
setTimeout(again,300000 - (new Date().getTime() % 300000))
// again()
http.createServer(async function (request, response) {
    console.log('request ', request.url);
    var url = new URL("http://localhost:8125"+request.url)
    rurl = url.pathname
    args = url.searchParams
    if(rurl=="/"){
        fs.readFile("mcgraph.html",function (err,data) {
            fs.readFile("pastinfo.json",function (errr,d) {
                d = JSON.parse(d.toString())
                var k = Object.keys(d).filter(e => !JSON.parse(d[e]).code)
                data = data.toString().replace("[ICONURL]",JSON.parse(d[k[k.length - 1]]).favicon).replace('["PINGLABEL"]',JSON.stringify(k.map(e => JSON.parse(d[e]).latency))).replace('["LABELLABEL"]',JSON.stringify(k/*.map(e => new Date(e*1).toTimeString().split(" ")[0])*/)).replace('["ONLINELABEL"]',JSON.stringify(k.map(e => JSON.parse(d[e]).players.online))).replace('["MAXLABEL"]',JSON.stringify(k.map(e => JSON.parse(d[e]).players.max)))
                // console.log(args.get("tfl"))
                if(args.get("tfl") !== null){
                    var bdata = data = data.replace(' selected="true"',"")
                    data = data.replace('<option value="'+args.get("tfl")+'">', '<option value="'+args.get("tfl")+'" selected="true">')
                    if(data == bdata){
                        data = data.replace('            <option value="a">all time</option>','            <option value="a">all time</option>\n            <option value="'+args.get("tfl")+'" selected="true">custom ('+args.get("tfl")+')</option>')
                    }
                }
                if(args.get("animation") === false) {
                    data.replace("animation: true,","animation: false,")
                }
                if(args.get("animation") === null){
                    data.replace("animation: true,","")
                }
                response.writeHead(200, { 'Content-Type': "text/html" });
                response.end(data, 'utf-8');
            })
        })
    }else
    if(rurl=="/api2b2tio"){
        if(!url.search){url.search = '?range=7d'}
        fs.readFile("pastinfo.json",async function (err,d) {
            // d = JSON.parse(d.toString())
            // var k = Object.keys(d)
            console.log(url.search)
            apidata = JSON.parse((await (await fetch("https://2b2t.io/api/pingstats"+url.search)).text()))
            // k = k.map(e => e.slice(0,-5) + "00")
            // console.log(k,apidata.map(e => `${e[0]}`.slice(0,-1)+"0"))
            // apidata = apidata.filter(e => k.includes(`${e[0]}`.slice(0,-2)+"00"))
            // apidata = apidata.map((e) => {e[0] = `${e[0]}`.slice(0,-2)+"00";return e;})
            response.writeHead(200, { 'Content-Type': "application/json" });
            response.end(JSON.stringify(apidata), 'utf-8');
        })
    }else
    if(rurl=="/newstats"){
        if(!args){
            response.writeHead(400, { 'Content-Type': "application/json" });
            response.end('{"error":"400",message:"Malformed request"}', 'utf-8');
            return
        }
        
        response.writeHead(200, { 'Content-Type': "application/json" });
        response.end(data, 'utf-8');
    }else if(rurl=="/t2a/icons"){
        var i = JSON.parse(fs.readFileSync("pastinfo.json"));
        response.writeHead(200, { 'Content-Type': "application/json" });
        response.end(JSON.stringify([... new Set(Object.keys(i).map(e => JSON.parse(i[e]).favicon))]), 'utf-8');

    }else if(rurl=="/t2a/motds"){
        var i = JSON.parse(fs.readFileSync("pastinfo.json"));
        response.writeHead(200, { 'Content-Type': "application/json" });
        response.end(JSON.stringify([... new Set(Object.keys(i).map(e => JSON.parse(i[e]).desciption))]), 'utf-8');

    }else if(rurl.startsWith("/t2a/players")){
        var surl = rurl.slice("/t2a/players".length)
        if(surl == "/disclaimer"||surl == "/warning"){
            response.writeHead(200, { 'Content-Type': "text/plain" });
            response.end("Warning: player data provided here is from random samples of 12 players taken every 5 minutes\nFull samples are not taken yet however this is planned for the future", 'utf-8');
            return;
        }
        var i = JSON.parse(fs.readFileSync("pastinfo.json"));
        if(surl===""||surl==="/"){
            response.writeHead(200, { 'Content-Type': "application/json" });
            response.end(JSON.stringify([... new Set(Object.keys(i).map(e => JSON.parse(i[e]).players.sample))]), 'utf-8');
        }
        if(surl === "/count"||surl === "/length"){
            response.writeHead(200, { 'Content-Type': "application/json" });
            response.end([... new Set(Object.keys(i).map(e => JSON.parse(i[e]).players.sample))].length.toString(), 'utf-8');
        }

    }else{
        fs.readFile("pages.json",function (err,data) {
            data = JSON.parse(data.toString())
            if(Object.keys(data).includes(rurl)){
                fs.readFile(data[rurl],function (aerr,adata) {
                    response.writeHead(200);
                    response.end(adata);
                })
            }else{
                response.writeHead(404);
                response.end();
            }
        })
    }
    
}).listen(8125);
console.log('Server running at http://127.0.0.1:8125/');