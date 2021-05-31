# vaccine-appointment-india

Step 1: Install NodeJS

`https://nodejs.org/en/download/`


Step 2: 

a. Update the default districtId, pinCode and dates in findSlot()

b. Run the program `node index.js`


Step 3: Setup SMS alerts (Optional)

If you need custom SMS alerts, create a twilio account and add a `.env` file

```
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
YOUR_PHONE="+91xxx"
SENDER_PHONE="+1xxx"
```

If not, you can still get alerted by the COWIN OTP anyway, just without the center details.




