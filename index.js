'use strict';
require('dotenv').config();

const Alexa = require('ask-sdk-core');
const axios = require('axios');
const moment = require('moment');

const BASE_URL = process.env.API_CALL_URL;

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speechText = 'Palmyra Racing Association can tell you about things going on at Palmyra Racing Association.';
        return speakAndShowCard(handlerInput, speechText);
    }
};

const AllEventsIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AllEventsIntent';
    },
    async handle(handlerInput) {
        let allEventsResponse = await axios.get(BASE_URL + '/latest/events/thisyear');
        let allEvents = allEventsResponse.data;
        console.log((allEvents));
 
        let eventsText = buildSpeakableDates(allEvents);
        return speakAndShowCard(handlerInput, eventsText.join('. '));
    }
};

const NextEventIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'NextEventIntent';
    },
    async handle(handlerInput) {
        let allEventsResponse = await axios.get(BASE_URL + '/latest/events/next');
        let allEvents = allEventsResponse.data;
        console.log((allEvents));
 
        let eventsText = buildSpeakableDates(allEvents);

        return speakAndShowCard(handlerInput, eventsText.join('. '));
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speechText = 'I can help you figure out what to ask Palmyra Racing Association.  Ask things like "whens the next race"';
        return speakAndShowCard(handlerInput, speechText);
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
                || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        return speakAndShowCard(handlerInput, 'Goodbye!');
    }
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        //any cleanup logic goes here
        return handlerInput.responseBuilder.getResponse();
    }
};

const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`Error handled: ${error.message}`);
        return handlerInput.responseBuilder
        .speak('Sorry, I can\'t understand the command. Please say again.')
        .reprompt('Sorry, I can\'t understand the command. Please say again.')
        .getResponse();
    },
};

function buildSpeakableDates(allEvents) {
    let eventsText = [];      
    eventsText.push('All races have a practice on the Saturday before.')
    for (let event of allEvents)  {
        // this is a hack to put the dates on the right day since dates coming back from the 
        // API are in UTC+0 but they are actually meant for UTC+4.  
        let speakableDate = moment(event.date).utcOffset(0).format('dddd, MMMM Do YYYY');
        eventsText.push('On ' + speakableDate + ' there is a ' + event.type + '.  This is the ' + event.event_name + '.');
    }
    return eventsText;
}

function speakAndShowCard(handlerInput, speechText) {
    return handlerInput.responseBuilder
        .speak(speechText)
        .withSimpleCard('Palmyra Racing Association', speechText)
        .getResponse();
}

exports.handler = Alexa.SkillBuilders.custom()
     .addRequestHandlers(LaunchRequestHandler,                         
                         AllEventsIntentHandler,
                         NextEventIntentHandler,
                         HelpIntentHandler,
                         CancelAndStopIntentHandler,
                         SessionEndedRequestHandler)
     .lambda();
