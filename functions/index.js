'use strict';

const {dialogflow, Permission, Suggestions} = require('actions-on-google');
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
        permissions.push('DEVICE_COARSE_LOCATION');
        permissions.push('DEVICE_PRECISE_LOCATION');
        context += '  and know your location.';
    }
    conv.ask(new Permission({
        context,
        permissions
    }));
});

app.intent('actions_intent_PERMISSION', (conv, params, permissionsGranted) => {
    const {display} = conv.user.name;

    if(permissionsGranted && display){
        conv.ask(`Okay ${display}. Thank you for letting me know you location.`);
        conv.ask(new Suggestions(`Tell about Air Quality`));
    }else {
        conv.close('Looks like i dont have permission to get enough information to get work done');
    }
    
});

app.intent('air quality index', async (conv, {'geo-city' : city}) => {

    conv.ask('While we fetch breathe some air.');
    if(city){
        await getAirQualityCity(city, conv);
    }else{
        const {latitude,longitude} = conv.device.location.coordinates;

        await getAirQualityLatLang(latitude,longitude,conv);
    }
})


exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);

async function getAirQualityLatLang(latitude, longitude, conv) {
    try {
        const reponse = await client.get(`/feed/geo:${latitude};${longitude}/?token=${TOKEN}`);
        conv.close(`AQI in your area is ${reponse.data.data.aqi}`);
    }
    catch (error) {
        conv.close('Something went wrong in fetching data.');
    }
}
async function getAirQualityCity(city, conv) {
    try {
        const reponse = await client.get(`/feed/${city}/?token=${TOKEN}`);
        conv.close(`Air Quality in ${city} is ${reponse.data.data.aqi}`);
    }
    catch (error) {
        conv.close('Something went wrong in fetching data.');
    }
}