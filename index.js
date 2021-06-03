const Discord = require('discord.js'); 
const client = new Discord.Client(); 
const axios = require('axios');
const scheduler = require('node-schedule');
const mysql = require('mysql');
const configuration = require('./config/config.json');
const mysqlconnect = mysql.createConnection({
    host : '127.0.0.1',
    user : 'root', 
    password : 'mysql1@', 
    database : 'overwatchscrim'
});
mysqlconnect.connect();
const job = scheduler.scheduleJob('*/1 * * * *', function(){
    console.log("Checked mysql database.");
    let date_ob = new Date();
    let date = ("0" + date_ob.getDate()).slice(-2);
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    let year = date_ob.getFullYear();
    let hours = date_ob.getHours();
    let minutes = ("0" + date_ob.getMinutes()).slice(-2);
    let seconds = ("0" + date_ob.getSeconds()).slice(-2);
    var datetime = year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds;
    mysqlconnect.query('SELECT * FROM `scrimschedule` WHERE krdatetime LIKE ' +`'${datetime}'`, function(error, results, fields){
        if(error)
        {
            console.log(error);
        }
        else if(!error && !(typeof results[0] === 'undefined'))
        {
            var nativetime = results[0].nativedatetime;
            var krtime = results[0].krdatetime; 
            var teamname = results[0].teamname;
            console.log(`Results: | Nativetime : ${nativetime}, TargetTime : ${krtime}, TeamName: ${teamname} |`);
            var discordembed = new Discord.MessageEmbed()
                .setColor('#ffc233')
                .setTitle(`Scrim with ` + teamname)
                .setDescription('Good luck!')
                .addFields(
                    {
                        name : "Opponent Team",
                        value : teamname
                    },
                    {
                        name : `${configuration.nativecity}'s Time`,
                        value : nativetime
                    },
                    {
                        name : `${configuration.targetcity}'s Time`, 
                        value : krtime
                    }
                )
                .setTimestamp()
            client.channels.cache.get(`${configuration.sendingchannel}`).send(`<@&${configuration.mentionedrole}>`); 
            client.channels.cache.get(`${configuration.sendingchannel}`).send(discordembed);
        }
    });
})
client.on("ready", () => {
    console.log("Ready."); 
});
client.on('unhandledRejection', error => console.error('Uncaught Promise Rejection', error));
client.on("message", async message => 
{
    const prefix = message.content.substring(0,1);
    const messages = message.content.substring(1, message.content.length); 
    if(!(prefix === configuration.prefix)) {}
    else 
    {
        if(messages === "help")
        {
            var discordhelpembed = new Discord.MessageEmbed()
                .setColor('#ffc233')
                .setTitle('Scrim Schedule Bot')
                .setDescription(`Shows Scrim Schedule Bot's commands`)
                .addFields(
                    {
                        name : "help",
                        value : "shows list of commands"
                    },
                    {
                        name : "add YYYY-MM-DD HH:MM:SS Teamname",
                        value : "adds scrim schedule to bot"
                    },
                    {
                        name : "remove YYYY-MM-DD HH:MM:SS Teamname", 
                        value : "removes scrim schedule from bot's database"
                    }
                )
                .setTimestamp()
                message.channel.send(discordhelpembed); 
        }
        else if(messages.substring(0, 3) === "add")
        {
            var target = false; 
            for(var i = 0; i < configuration.admins.length; i++)
            {
                if(message.author.id === configuration.admins[i].id)
                {
                    target = true; 
                    break; 
                }
            }
            if(target)
            {
                var nativedatetime = messages.substring(4,23); 
                var teamname = messages.substring(24); 
                var url = 'https://timezone.abstractapi.com/v1/convert_time?api_key=' + configuration.apikey +  '&base_datetime=' + nativedatetime + `&base_location=${configuration.nativecity}` + `&target_location=${configuration.targetcity}`;
                var jsonbody = await axios.get(url); 
                var krdatetime = jsonbody.data.target_location.datetime;
                mysqlconnect.query('INSERT INTO `scrimschedule` VALUES' +`('${nativedatetime}', '${krdatetime}', '${teamname}')`, function(error, results, fields){
                    if(error)
                    {
                        message.channel.send(":x: MYSQL Query error. Call Bot Creator. Or Did you put duplicate data entry? :x:");
                        console.log(error);
                    }
                    else 
                    {
                        message.channel.send(":o: Finished adding scrim schedule to bot. :o:"); 
                    }
                })
                
            }
            else
            {
                message.channel.send(":x: You don't have permission to add Scrim schedule. :x:");
            }
        }
        else if(messages.substring(0, 6) === "remove")
        {
            console.log('im here.');
            var nativedatetime = messages.substring(6, 26); 
            var teamname = messages.substring(26); 
            console.log('DELETE FROM `scrimschedule` WHERE nativedatetime=' +`'${nativedatetime}' AND teamname='${teamname}'`);
            mysqlconnect.query('DELETE FROM `scrimschedule` WHERE nativedatetime=' +`'${nativedatetime}' AND teamname='${teamname}'` , function(error, results, fields){
                if(error)
                {
                    message.channel.send(":x: MYSQL Query error. Call Bot Creator. Or Did you put duplicate data entry? :x:");
                    console.log(error);
                }
                else
                {
                    message.channel.send(":o: Finished removing scrim schedule from bot. :o:"); 
                }
            });
        }
    }
});
client.login(configuration.token);