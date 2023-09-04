module.exports = ({ env }) => ({
  "io": {
    "enabled": true,
    "config": {
      "IOServerOptions" :{
        "cors": { "origin": "http://localhost:1337", "methods": ["GET", "POST"] },
      },
      "contentTypes": {
        "message": "*",
        "chat":["create"]
      },
      "events":[
        {
          "name": "connection",
          "handler": ({ strapi }, socket) => {
            strapi.log.info(`[io] new connection with id ${socket.id}`);
           
            socket.on('chat:connect', async (data)  =>{
              let {userID} = data;

              console.log(userID);

             try {
              //Ищем в каких чатах есть нащ пользователь с userID 
              let chats = await strapi.db.query("api::chat.chat").findMany({
                "where": {                 
                  "chat_users": {
                    "id": {
                      "$eqi": userID, 
                    }
                  }
                },             
              });            

              //Перебираем все чаты в которых есть наш пользователь и подключаем его к комнатам
              chats.forEach(chat => {
                console.log(`Connect user to CHAT_${chat.id}`);

                socket.join(`CHAT_${chat.id}`); 
              });
                
              
             } catch(error) {
              console.log(`[io] chat:connect error: ${error}`);
             }                                
            });

            socket.on('chat:sendPrivateMessage', (data) => {
                let {chatID} = data;

                console.log(`Private message from ${data.message.from} to room CHAT_${chatID}`);
          
                //Send message to room
                socket.to(`CHAT_${chatID}`).emit(
                  "chat:onNewPrivateMessage",     
                  data.message,
                );            
            });
         
            socket.on('disconnect', async (data) =>{
              console.log(`onDisconnect ${data}`);

              socket.emit('chat:userDisconnect');
            });
          },
        },    
      ]
    },
  },
});
