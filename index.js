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

app.get('/status', function (req, res) {
    const status = { 'status': 'healthy' }
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    res.end(JSON.stringify(status) + '\r\n');
});

app.listen(3000);

// main program
const REGISTER_SIGNAL_NUMBER = process.env.REGISTER_SIGNAL_NUMBER || "";
const GROUP_ID = process.env.GROUP_ID || "";
const KEY_PHRASE = process.env.KEY_PHRASE || "";
const SIGNAL_SERVER = process.env.SIGNAL_SERVER || "";

// Default poll frequency
const PERIOD = 3000;

let isFirstRun = true;
let runClock;
let keyPhrases = [];

console.log("-------------------------------------------------------");
console.log(" SignalBOT - Basic Signal BOT for groups");
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
    let jsonPayload = { "message": message, "number": REGISTER_SIGNAL_NUMBER, "recipients": [recipient], "text_mode": "styled" }
    await axios.post(SIGNAL_SERVER + '/v2/send', jsonPayload, {
        headers: {
            // Overwrite Axios's automatically set Content-Type
            'Content-Type': 'application/json'
        }
    });
}

// load keywords and responses
async function GetKeywordArray() {
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
async function init() {
    // load settings object
    keyPhrases = await GetKeywordArray();
    console.log('scanning for keywords');
    run();
}

// main program to watch for keywords
async function watch() {
    await axios.get(SIGNAL_SERVER + '/v1/receive/' + REGISTER_SIGNAL_NUMBER)
        .then(function (response) {
            if (response.data.length != 0) {
                
                response.data.forEach(d => {
                    //console.log(d.envelope.syncMessage.editMessage);
                    if (d.envelope.syncMessage != undefined && d.envelope.syncMessage.sentMessage != null) {
                        if (d.envelope.syncMessage.sentMessage.groupInfo == undefined) {
                            let sourceName = d.envelope.sourceName;
                            let sourceNumber = d.envelope.sourceNumber;
                            sendResponse('warning', d.envelope.sourceNumber, '**Warning**\n\nPlease do not:\n - Edit messages and send to the bot. Messages must be new\n - Do not send bot messages outside of groups\n\n*Thank you*\n\n*This is an automated message*');
                        }
                        else {
                            let sourceName = d.envelope.sourceName;
                            let sourceNumber = d.envelope.sourceNumber;
                            let message = d.envelope.syncMessage.sentMessage.message;
                            let groupId = d.envelope.syncMessage.sentMessage.groupInfo.groupId;
                            if (message != undefined && message.length != 0 && message.toLowerCase().startsWith(KEY_PHRASE.toLowerCase()) && GROUP_ID.includes(groupId)) {
                                // console.log('found one');
                                message = d.envelope.syncMessage.sentMessage.message.toLowerCase()
                                const arr1 = keyPhrases.filter(d => d.searchTerm === message.substring(7));
                                // console.log('arr1', arr1);
                                if (arr1.length > 0) {
                                    //console.log(arr1[0].msg);
                                    sendResponse(arr1[0].searchTerm, d.envelope.sourceNumber, arr1[0].msg);
                                }
                                else {
                                    console.log(KEY_PHRASE.toLowerCase() + ' called, but not a valid keyword');
                                    sendResponse('help', d.envelope.sourceNumber, keyPhrases[0].msg);
                                }
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




