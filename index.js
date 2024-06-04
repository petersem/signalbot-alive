import { createRequire } from "module";
const pjson = createRequire(import.meta.url)("./package.json");
import express from 'express';
import axios from 'axios';

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
const GROUP_OR_PERSON_ID = process.env.GROUP_OR_PERSON_ID || "";
const KEY_PHRASE = process.env.KEY_PHRASE || "";

// Default poll frequency
const PERIOD = 3000;

let isFirstRun = true;
let runClock;

console.log("-------------------------------------------------------");
console.log(" SignalBOT-Alive - Basic Signal BOT for ALIVE group");
console.log(" Developed by Matt Petersen - Brisbane Australia");
console.log(" Donate: https://www.paypal.com/paypalme/thanksmp")
console.log(" ");
console.log(" Version: " + pjson.version);
console.log("-------------------------------------------------------");
console.log(" ");

console.log(`Monitoring started 
     - Version: ` + pjson.version + `
     - Key Phrase: ` + KEY_PHRASE + `
     - Group or Person ID: ` + GROUP_OR_PERSON_ID + `
     - BOT Number: ` + REGISTER_SIGNAL_NUMBER);

console.log()

async function sendResponse(recipient, keyword) {
    // axios code here
    console.log('Sending /' + keyword + 'response to: ' + recipient);
}

// load keywords and responses
async function GetKeywordArray(){

}

// main program to watch for keywords
async function watch() {
    const keywords = await GetKeywordArray();
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
run();

