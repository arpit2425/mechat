const mongo = require("mongodb").MongoClient;
const client = require("socket.io").listen(4000).sockets;
const keys = require("./keys/keys");

// Connect to mongo

mongo.connect(keys.database.url, function(err, db) {
  if (err) throw err;
  console.log("database connected");
  client.on("connection", socket => {
    let chat = db.collection("chats");
    sendStatus = function(s) {
      socket.emit("status", s);
    };
    chat
      .find()
      .limit(100)
      .sort({ _id: 1 })
      .toArray(function(err, res) {
        if (err) throw err;
        socket.emit("output", res);
      });

    // Handle input events
    socket.on("input", function(data) {
      let name = data.name;
      let message = data.message;

      // Check for name and message
      if (name == "" || message == "") {
        // Send error status
        sendStatus("Please enter a name and message");
      } else {
        // Insert message
        chat.insert({ name: name, message: message }, function() {
          client.emit("output", [data]);

          // Send status object
          sendStatus({
            message: "Message sent",
            clear: true
          });
        });
      }
    });

    // Handle clear
    socket.on("clear", function(data) {
      // Remove all chats from collection
      chat.remove({}, function() {
        // Emit cleared
        socket.emit("cleared");
      });
    });
  });
});
