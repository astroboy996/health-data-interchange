var express = require('express');
var app = express();
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var http = require('http');
var cors = require('cors');
var port = process.env.PORT || 5420; // set our port



// config files
var config = require('./config/db.js');


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
app.use(cors());



app.get('/version', function (req, res) {
    res.status(200).json({ version: 1.4 });
});


// var options = { user: utils.decrypt(config.user), pass: utils.decrypt(config.pass) };
var options = { user: config.user, pass: config.pass };

(async () => {
    try {
        let conn = await mongoose.connect(config.url, options);
        let date = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format();
        console.log(`[${date}] MongoDB Connection to mongodb://${conn.connection.host}:${conn.connection.port}/${conn.connection.name} Success!!`);
        loadInterfaceUser();
        // loadRefCode();
    } catch (error) {
        console.log(error)
    }
})();

// mongoose.connect(config.url, options, async (err) => {
//     if (err) {
//         console.log(err);
//     }
//     else {
//         console.log(new Date(), 'MongoDB Connection Success');
//         loadInterfaceUser();
//         // loadRefCode();
//     }
// });

app.use((req, res, next) => {
    req.session = {
        useruid: app.get('interfaceuser'),
        reference: app.get('reference')
    }
    next();
})

var routes = require("./app/route.js")(app);

var server = http.createServer(app);
server.listen(port);
console.log('service run at port ' + port);


async function loadInterfaceUser() {
    let interfaceUserData = {
        "username": "INTERFACE",
        "code": "INTERFACE",
        "createDate": new Date("1992-02-09T11:08:10.018+07:00"),
        "modifyDate": new Date("1992-02-09T11:08:10.018+07:00"),
        "isActive": true,
        "firstName": "INTERFACE",
    }
    let interfaceUser = await mongoose.connection.collection('trn_users').findOne({ code: 'INTERFACE' })
    if (interfaceUser) {
        app.set('interfaceuser', interfaceUser._id.toString());

    } else {
        let trnUser = await mongoose.connection.collection('trn_users').insertOne(interfaceUserData)
        app.set('interfaceuser', trnUser.insertedId.toString());
    }
}


const HealthDB = require('./app/shareapi/healthdb.js');

const username = 'healthchaindba';
const password = '$$$HealthChain@KaSemRad2023!';
const dbhost = '10.31.31.33';
const dbport = '45354';
const database = 'healthchaindb';
const {ObjectId} = require('mongodb'); // or ObjectID 

async function main() {
    const healthDB = new HealthDB(username, password, dbhost, dbport, database);
   // await select_patientrecord(healthDB);
    // await update_patientform(healthDB);
    //await update_trn_user(healthDB);
    
}

async function select_patientrecord(healthDB){
    const commandText = (` [
        { 
            "$match": { 
                "createDate": { 
                    $gte: new Date('2024-03-31T17:00:00.000Z')
                 }
             } 
         }
       ]` ); 
    try {
       let result = await healthDB.QueryCommand("trn_patientrecords",commandText);
    if (result !=null){
        console.log(result)
    }    
    } catch (error) {
        console.log("*** " + error.message)
    }
}

async function update_patientform(healthDB){
    const collection = "trn_patientforms";
    const where = {  _id : new ObjectId("66273a2e47a58c35fbc5f1aa") };
    const data ={ $set : { isActive : false }} ;
    try {
       let result = await healthDB.UpdateCommand(collection,where,data);
    if (result !=null){
        console.log(result)
    }    
    } catch (error) {
        console.log("*** " + error.message)
    }
}

async function update_trn_user(healthDB){
    const collection = "trn_patientforms";
    const where = {  _id : new ObjectId("66273a2e47a58c35fbc5f1aa") };
    const data ={ $set : { isActive : false }} ;
    try {
       let result = await healthDB.UpdateCommand(collection,where,data);
    if (result !=null){
        console.log(result)
    }    
    } catch (error) {
        console.log("*** " + error.message)
    }
}

//main();