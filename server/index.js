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

let lastKnownSize = 0;
let logInterval;

const generateLogEntry = () => {
  const date = new Date().toISOString().replace("T", " ").split(".")[0];
  const endpoints = [
    "/internal/licenseExpiryStatus",
    "/internal/replicationInfo",
    "/internal/internalDbWarnings",
    "/internal/notifications",
    "/internal/activeAdministrators",
    "/internal/uiSettings",
    "/internal/extendSession",
  ];

  const randomEndpoint =
    endpoints[Math.floor(Math.random() * endpoints.length)];

  return `${date}| Administrator| Bearer| [0:0:0:0:0:0:0:1]| unknown| GET| ${randomEndpoint}| 200\n`;
};

let bigBigString = "";
for (let i = 0; i < 10; i++) {
  bigBigString += generateLogEntry();
  if (Math.random() < 0.1) {
    bigBigString += "\n";
  }
}

const writeLogEntries = () => {
  fs.appendFileSync(filePath, bigBigString);
};

const startLogInterval = (socket) => {
  logInterval = setInterval(() => {
    writeLogEntries();
  }, 500);
};

const stopLogInterval = () => {
  clearInterval(logInterval);
};

const printNewLogEntries = (socket) => {
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
    startLogInterval(socket);
    const watcher = fs.watch(filePath, () => {
      printNewLogEntries(socket);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected");
      stopLogInterval();
      watcher.close();
    });
  });
});

server.listen(8080, () => {
  console.log("WebSocket Server listening on port 8080");
});
