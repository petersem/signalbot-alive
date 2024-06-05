import { createRequire } from "module";
const pjson = createRequire(import.meta.url)("./package.json");
import express from 'express';
import axios from 'axios';
import fs from 'fs';

process.on('warning', (warning) => {
    console.log(warning.stack);
});

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/status', function(req, res) {
    const status = {'status': 'healthy'}
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    res.end(JSON.stringify(status) + '\r\n');
});

app.listen(3000);

// main program
const REGISTER_SIGNAL_NUMBER = process.env.REGISTER_SIGNAL_NUMBER || "";
const GROUP_ID = process.env.GROUP_ID || "";
const KEY_PHRASE = process.env.KEY_PHRASE || "";

// Default poll frequency
const PERIOD = 3000;

let isFirstRun = true;
let runClock;
let keyPhrases = [];

console.log("-------------------------------------------------------");
console.log(" SignalBOT-Alive - Basic Signal BOT for ALIVE group");
console.log(" Developed by Matt Petersen - Brisbane Australia");
console.log(" Donate: https://www.paypal.com/paypalme/thanksmp");
console.log(" ");
console.log(" Version: " + pjson.version);
console.log(" Key Phrase: " + KEY_PHRASE);
console.log(" Group ID: " + GROUP_ID);
console.log(" BOT Number: " + REGISTER_SIGNAL_NUMBER);
console.log("-------------------------------------------------------");
console.log(" ");

async function sendResponse(type, recipient, message) {
    // axios code here
    console.log('Sending: "' + type + '" response sent to: ' + recipient + '\r\n');
    let jsonPayload = {"message": message, "number": REGISTER_SIGNAL_NUMBER, "recipients": [recipient], "text_mode": "styled"}
    await axios.post('https://signal.nesretep.net/v2/send', jsonPayload, {
        headers: {
          // Overwrite Axios's automatically set Content-Type
          'Content-Type': 'application/json'
        }
      });
}

// load keywords and responses
async function GetKeywordArray(){
    // check if file exists before downloading
    if (!fs.existsSync("/config/watchwords.json")) {
        const data = fs.readFileSync("config/watchwords.json", "utf-8");
    
        try {
          keyPhrases = await JSON.parse(data.toString());
        } catch (ex) {
          // do nothing if error as it reads ok anyhow
          let d = new Date();
          console.log(d.toLocaleString() + " *Failed to load keyPhrases:", ex);
        }
    
        //console.log(keyPhrases);
      }
      return keyPhrases;
}

// init
async function init(){
    // load settings object
    keyPhrases = await GetKeywordArray();
    
    run();
}

// main program to watch for keywords
async function watch() {
    console.log('scanning for keywords');
    //signal.nesretep.net/v1/receive/+61413332329
    await axios.get('https://signal.nesretep.net/v1/receive/' + REGISTER_SIGNAL_NUMBER)
    .then(function (response) {
    if(response.data.length != 0){
        //console.log(response.data[0]);
        response.data.forEach(d => {
            if(d.envelope.syncMessage != undefined && d.envelope.syncMessage.sentMessage != null){
                let sourceName = d.envelope.sourceName;
                let sourceNumber = d.envelope.sourceNumber;
                let message = d.envelope.syncMessage.sentMessage.message;
                let groupId = d.envelope.syncMessage.sentMessage.groupInfo.groupId;
                // console.log(sourceName);
                // console.log(sourceNumber);
                // console.log(message);
                // console.log(groupId);
                // console.log(GROUP_ID);
                if(message != undefined && message.length != 0 && message.toLowerCase().includes('/alive') && groupId == GROUP_ID){
                    // console.log('found one');
                    message = d.envelope.syncMessage.sentMessage.message.toLowerCase()
                    const arr1 = keyPhrases.filter(d => d.searchTerm === message.substring(7));
                    // console.log('arr1', arr1);
                    if(arr1.length > 0){
                        //console.log(arr1[0].msg);
                        sendResponse(arr1[0].searchTerm,d.envelope.sourceNumber,arr1[0].msg);
                    }
                    else{
                        console.log('/alive called, but not a valid keyword');
                    }

                } 
            }
        });
        //console.log(response.data[0]);
        // response.data.envelope.forEach(env => {
        //     console.log(env);
                
        // });

    }
    })
    // .catch(function (error) {
    //     console.log("** Watch execption" + error);
    // });


    // axios
    // .get("https://finalspaceapi.com/api/v0/character/?limit=2")
    // .then(function (response) {
    //   console.log(response);
    // });    

}

async function run() {
    // stop timer to ensure no race conditions
    clearInterval(runClock);
    // run check
    await watch();
    // restart timer
    runClock = setInterval(run, 3000);
}

// start processing
init();




