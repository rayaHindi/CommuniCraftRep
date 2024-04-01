const mysql = require('mysql');
const express = require('express');
const app = express();
const { connection } = require('./connection');

const session = require('express-session');
const auth =require('./routes/login')
const user =require('./routes/user')

const taskRoute=require('./routes/task');
const bodyParser = require('body-parser');
const loginRoute = require('./routes/login');
const projectRoute=require('./routes/project');
const favRoute=require('./routes/fav');
const materialsRoute=require('./routes/materials');
const toolsRoute=require('./routes/tools');
const notification=require('./routes/notifications');
const weather=require('./ExternalAPI/WeatherAPI');
const etsy=require('./ExternalAPI/EtsyAPI');

app.use(express.json());
app.use(bodyParser.json());

app.use('/api', loginRoute); 
app.use('/api',notification);
app.use('/api',weather);
app.use('/api',etsy);
app.use('/api', favRoute);
app.use('/api', taskRoute);
app.use('/api',auth)
app.use('/api/users',user)
app.use('/api/projects', projectRoute);
app.use('/api', materialsRoute);
app.use('/api', toolsRoute);


app.listen(3000,()=>{
    console.log('listeninggg on 3000...')
    })