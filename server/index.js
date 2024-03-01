const http = require("http");
const socketIo = require("socket.io");
const fs = require("fs");
const path = require("path");

const server = http.createServer();
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
  },
});

const filePath = path.join(__dirname, "logs", "logfile.txt");

let lastKnownSize = 0; // assume file is blank initally for simplicity

const printNewLogEntries = (socket) => {
  console.log("print new log entries");
  fs.stat(filePath, (err, stats) => {
    if (err) {
      console.error("Error getting file stats:", err);
      return;
    }

    const newSize = stats.size;
    if (newSize > lastKnownSize) {
      const readStream = fs.createReadStream(filePath, {
        start: lastKnownSize,
        end: newSize,
      });

      readStream.on("data", (newData) => {
        console.log(newData.toString());
        socket.emit("new-log-entry", newData.toString());
      });

      lastKnownSize = newSize;
    }
  });
};
io.on("connection", (socket) => {
  console.log("Client connected");
  console.log(socket.id);

  socket.on("watch-log", () => {
    console.log("Watching for changes in", filePath);

    const watcher = fs.watch(filePath, () => {
      printNewLogEntries(socket);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected");
      watcher.close();
    });
  });
});

server.listen(8080, () => {
  console.log("WebSocket Server listening on port 8080");
});
