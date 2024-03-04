const http = require("http");
const socketIo = require("socket.io");
const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
  },
});

const logsDirectory = path.join(__dirname, "logs");
const logFileExtension = ".txt";

app.get("/log-file-names", (req, res) => {
  fs.readdir(logsDirectory, (err, files) => {
    if (err) {
      console.error("Error reading log directory:", err);
      res.status(500).send("Server error");
      return;
    }
    const logFiles = files.filter((file) => file.endsWith(logFileExtension));
    res.json(logFiles);
  });
});

const getLogFilePath = (fileName) => path.join(logsDirectory, fileName);

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

const writeLogEntries = () => {
  fs.readdir(logsDirectory, (err, files) => {
    if (err) {
      console.error("Error reading log directory:", err);
      return;
    }

    files
      .filter((file) => file.endsWith(logFileExtension))
      .forEach((fileName) => {
        const filePath = getLogFilePath(fileName);
        const logEntry = generateLogEntry();
        fs.appendFileSync(filePath, logEntry);
      });
  });
};

const startLogInterval = (socket) => {
  return setInterval(() => {
    writeLogEntries();
  }, 1000);
};

const stopLogInterval = (interval) => {
  clearInterval(interval);
};

const printNewLogEntries = (socket, filePath) => {
  fs.stat(filePath, (err, stats) => {
    if (err) {
      console.error("Error getting file stats:", err);
      return;
    }

    const newSize = stats.size;
    if (newSize > lastKnownSizes[filePath]) {
      const readStream = fs.createReadStream(filePath, {
        start: lastKnownSizes[filePath],
        end: newSize,
      });

      readStream.on("data", (newData) => {
        socket.emit("new-log-entry", {
          fileName: path.basename(filePath),
          log: newData.toString(),
        });
      });

      lastKnownSizes[filePath] = newSize;
    }
  });
};

const lastKnownSizes = {};
const initializeLastKnownSizes = () => {
  fs.readdir(logsDirectory, (err, files) => {
    if (err) {
      console.error("Error reading log directory:", err);
      return;
    }

    files
      .filter((file) => file.endsWith(logFileExtension))
      .forEach((fileName) => {
        const filePath = getLogFilePath(fileName);
        lastKnownSizes[filePath] = 0;
      });
  });
};

initializeLastKnownSizes();
io.on("connection", (socket) => {
  console.log("Client connected");
  const logInterval = startLogInterval();

  socket.on("watch-log", (fileName) => {
    const filePath = getLogFilePath(fileName);
    console.log("Watching for changes in", filePath);
    const watcher = fs.watch(filePath, () => {
      printNewLogEntries(socket, filePath);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected");
      stopLogInterval(logInterval);
      watcher.close();
    });
  });
});

server.listen(8080, () => {
  console.log("WebSocket Server listening on port 8080");
});
