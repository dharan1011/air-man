'use strict';

const {dialogflow, Permission} = require('actions-on-google');
const functions = require('firebase-functions');
const axios = require('axios').default;
const client = axios.create({
    baseURL : 'https://api.waqi.info',
    timeout : 3000
});
const app = dialogflow({debug : true});
const TOKEN = functions.config().aqicn.token;

app.intent('Default Welcome Intent', (conv) => {
    const permissions = ['NAME'];
    let context = 'I need permission to address you by name';
    if(conv.user.verification === 'VERIFIED'){
        // Could use DEVICE_PRECISE_LOCATION instead for coordinates and street address
        permissions.push('DEVICE_PRECISE_LOCATION');
        context += '  and know your location.';
    }
    conv.ask(new Permission({
        context,
        permissions
    }));
});

app.intent('actions_intent_PERMISSION',async (conv, params, permissionsGranted) => {
    const {display} = conv.user.name;
    const {formattedAddress} = conv.device.location;
    const {latitude,longitude} = conv.device.location.coordinates;

    if(formattedAddress && display){
        conv.ask(`Okay ${display}. You are located at ${formattedAddress}. Wait while we Fetching AQI.`);

        try {
            const reponse = await client.get(`/feed/geo:${latitude};${longitude}/?token=${TOKEN}`);
            conv.close(`AQI at ${formattedAddress} is ${reponse.data.data.aqi}`)
        } catch (error) {
            conv.close('Something went wrong in fetching data.')
        }
    }else {
        conv.ask('Looks like i dont have permission to get enough information to get work done');
    }
    
});


exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);