require('dotenv').config();
var player = require('play-sound')(opts = {player: 'rhythmbox'})
const fetch = require("node-fetch");
// const credentials = process.env.token || 'xyz';
// const beneficiaryId = process.env.beneficiaryId || '1234567890123';
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const dose = 1;
const client = require('twilio')(accountSid, authToken);
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

async function findSlot(districtIds="100,101",pinCode=110001,days="01,02",vaccine="COVAXIN", min_age_limit="18",doseNumber=1){

    let sessions, session;

    for (let day of days.split(",")) {

        if (pinCode) {
            sessions = await fetchCall(pinCode, null, `${day}-06-2021`); 
            if (sessions) session = sessionAvailable(sessions, vaccine, min_age_limit, doseNumber);
            if (session) { alertSlot(session, `${day}-06-2021`); return; }
        }

        if (districtIds) {

            for (let districtId of districtIds.split(",")) {
                sessions =  await fetchCall(null,districtId,`${day}-06-2021`, doseNumber);
                if (sessions) session = sessionAvailable(sessions, vaccine, min_age_limit, doseNumber);
                if (session) { alertSlot(session, `${day}-06-2021`); return; }
            }
            
        }

    }

    console.log("No slot. Trying again in 300s");
    setTimeout(findSlot,300000);

}

async function alertSlot(session, date) {
    if (!session.center_id) return;
    console.log("Slot available at Center " + session.name);

    client.messages
    .create({
        to: process.env.YOUR_PHONE.
        from: process.env.SENDER_PHONE,
        body: `Slot available: Center Name: ${session.name} Center ID: ${session.center_id} Date: ${date}`,
    })
    .then(message => console.log(message.sid));

    let txnId = await generateOtp();
    let token;

    readline.question('Enter the OTP', async function (otp)  {
        token = await getToken(txnId, otp);
        bookSlot(session, token);
        readline.close();
    });

}

function sessionAvailable(sessions,vaccine,min_age_limit,doseNumber=1){

    for (session of sessions)
        if (session.vaccine == vaccine && session.min_age_limit==min_age_limit && session.available_capacity>0)
            {
                console.log(session.name + " : " + session.available_capacity + " (Total) : " + session[`available_capacity_dose${doseNumber}`] + ` (Dose ${doseNumber})`);
                if (session[`available_capacity_dose${doseNumber}`] > 0){
                    console.log(session); return session;
		}
            } 
    return null;
}

async function fetchCall(pinCode,districtId, dateParam){

    await setTimeout(()=> {} ,1000);

    let url = "https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/";
    if (pinCode) url = url + `findByPin?pincode=${pinCode}&date=${dateParam}`;
    else if (districtId) url = url + `findByDistrict?district_id=${districtId}&date=${dateParam}`

    console.log(url);
    let json;
    let data = await fetch(url, {
        "headers": {
            "accept": "application/json",
            "user-agent" : "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90"
        },
        "body": null,
        "method": "GET",
        "mode": "cors"
      }).catch(error => {
        console.log(error);
        return null;
    });

      try {
          if (data.status == 200)
            json = await data.json();
          else 
            console.log(await data.text());
      } catch (error) {
          console.log(error);
          return null;
      }

      if (json && json.sessions) return json.sessions;
      else return null;

}

function email(){
    
}


async function appointmentCalendar(){

}


function bookSlot(session, date="01-06-2021",token, slot="FORENOON"){

    console.log("Booking Slot for " + session.center_id);

    let data = {
        "dose": dose,
        "session_id": session.session_id,
        "slot": slot,
        "beneficiaries": [
          "1234567890123",
        ]
    }

    let url = `"https://cdn-api.co-vin.in/api/v2/appointment/schedule`
    let headers = {
        "accept" : "application/json",
        "Content-Type":"application/json",
        "Authorization" : `Bearer ${token}` 
}
    let options = {method: "POST", headers, body: JSON.stringify(data)}

    fetch(url, options)
    .then(data => data.json())
    .then(data => {
        if (data.appointment_id)
            console.log("Appointment Booked:" + data.appointment_id);

    }).catch(err => console.log(err))
    
}


async function getToken(txnId, otp){

    let url = "https://cdn-api.co-vin.in/api/v2/auth/public/confirmOTP  ";

    console.log(url);
    let json;
    let data = await fetch(url, {
        "headers": {
            "accept": "application/json",
            "Content-Type": "application/json",
            "user-agent" : "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90"
        },
        "body": JSON.stringify({"otp": otp, "txnId" : txnId}),
        "method": "POST",
        "mode": "cors"
      }).then(data => data.json())
      .catch(error => {
        console.log(error);
        return null;
    });

      try {
          if (data) return data.token; else throw "Couldn't get token";
      } catch (error) {
          console.log(error);
          return null;
      }      

}

async function generateOtp(phone="9810881998"){

    let url = "https://cdn-api.co-vin.in/api/v2/auth/public/generateOTP";

    console.log(url);
    let json;
    let data = await fetch(url, {
        "headers": {
            "accept": "application/json",
            "Content-Type": "application/json",
            "user-agent" : "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90"
        },
        "body": JSON.stringify({"mobile": phone}),
        "method": "POST",
        "mode": "cors"
      }).then(data => data.json()).catch(error => {
        console.log(error);
        return null;
    });

      try {
          if (data) return data.txnId; else throw "No data on OTP gen"
      } catch (error) {
          console.log(error);
          return null;
      }      

}

async function test(){
    fetch("https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/findByPin?pincode=110001&date=30-06-2021", {
  "headers": {
    "accept": "application/json",
    "user-agent" : "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90"
  },
  "body": null,
  "method": "GET",
  "mode": "cors"
}).then(data => data.json()).then(json => console.log(json));
}

async function testOtp(){

    generateOtp().then(txnId => {

        console.log("Transaction ID for OTP" + txnId);
        
        readline.question('Enter the OTP \n', async otp => {
        let token = await getToken(txnId, otp);
        console.log(token);
        listBeneficiaries(token);
        readline.close();
        });
        
    })
    
}


function listBeneficiaries(token){

    console.log("Listing Beneficiaries");

    let url = `"https://cdn-api.co-vin.in/api/v2/appointment/beneficiaries`

    let headers = {
            "accept" : "application/json",
            "Authorization" : `Bearer ${token}` 
    }
    let options = {method: "GET", headers}

    fetch(url, options)
    .then(data => data.json())
    .then(data => {
        if (data && data.length > 0)
            for (let data of data)
            console.log(data.beneficiary_reference_id);

    }).catch(err => console.log(err))
    
}

function alarm(){
    player.play('/usr/share/sounds/ubuntu/ringtones/Alarm clock.ogg', function (err) {
     if (err) throw err;
     console.log("Audio finished");
   });
  
  }

//alarm();
//test();
//alertSlot("100","23-05-2021");
//testOtp();

findSlot();

