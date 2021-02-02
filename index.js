const express = require("express");
const { WebhookClient } = require("dialogflow-fulfillment");
const { Payload } = require("dialogflow-fulfillment");
const app = express();

const MongoClient = require('mongodb').MongoClient;
var url="mongodb://localhost:27017/";

//CONNECTING TO DB
var randomstring = require("randomstring");
var sName="";

app.post("/dialogflow", express.json(), (req, res) => {
    const agent = new WebhookClient({request: req, response: res});


//identifying users
async function identify_user(agent){
    const phone_number = agent.parameters.phone_number;
    const client = new MongoClient(url,{ useUnifiedTopology: true });
    await client.connect();
    const snap = await client.db("micro2").collection("users").findOne({phone_number: phone_number});

    if(snap==null){
        await agent.add("Re-Enter your phone number");
    }

    else{
        user_name=snap.sName;
        await agent.add("Welcome  "+user_name+"!! \n How can I help you")
        console.log(user_name)
    }
}

function report_issue(agent)
{

  var issue_val={1:"Internet Down",2:"Slow Internet",3:"Buffering problem",4:"No connectivity"};
  const intent_val=agent.parameters.number;
  var val=issue_val[intent_val];
  var trouble_ticket=randomstring.generate(7);

    //Generating trouble ticket and storing it in Mongodb
    //Using random module
    MongoClient.connect(url,{ useUnifiedTopology: true }, function(err, db) {
      if (err) throw err;
      var dbo = db.db("micro2");
        
      var u_name = user_name;    
      var issue_val=val; 
      var status="pending";

      let ts = Date.now();
      let date_ob = new Date(ts);
      let date = date_ob.getDate();
      let month = date_ob.getMonth() + 1;
      let year = date_ob.getFullYear();

      var time_date=year + "-" + month + "-" + date;
      var myobj = { u_name:user_name,val:issue_val,status:status,time_date:time_date,trouble_ticket:trouble_ticket };
  
      dbo.collection("Issues").insertOne(myobj, function(err, res) {
        if (err) throw err;
        db.close();
      });
    });
    agent.add("The issue reported is: "+ val +"\nThe ticket number is: "+trouble_ticket);
  }


//trying to load rich response
function custom_payload(agent)
{
  var payLoadData=
  {
    "richContent":
    [
      [
        {
          "type": "list",
          "title": "Internet Down",
          "subtitle": "Press '1' for Internet is down",
          "event": {
            "name": "",
            "languageCode": "",
            "parameters": {}
          }
        },
        {
          "type": "divider"
        },
        {
          "type": "list",
          "title": "Slow Internet",
          "subtitle": "Press '2' Slow Internet",
          "event": {
            "name": "",
            "languageCode": "",
            "parameters": {}
          }
        },
        {
          "type": "divider"
        },
        {
          "type": "list",
          "title": "Buffering problem",
          "subtitle": "Press '3' for Buffering problem",
          "event": {
            "name": "",
            "languageCode": "",
            "parameters": {}
          }
        },
        {
          "type": "divider"
        },
        {
          "type": "list",
          "title": "No connectivity",
          "subtitle": "Press '4' for No connectivity",
          "event": {
            "name": "",
            "languageCode": "",
            "parameters": {}
          }
        }
      ]
    ]
  }
  agent.add(new Payload(agent.UNSPECIFIED,payLoadData,{sendAsMessage:true, rawPayload:true }));
}

var intentMap = new Map();
intentMap.set("service_intent", identify_user);
intentMap.set("service_intent - custom - custom", report_issue);
intentMap.set("service_intent - custom", custom_payload);

agent.handleRequest(intentMap);

});//Closing tag of app.post

app.listen(process.env.PORT || 8080);