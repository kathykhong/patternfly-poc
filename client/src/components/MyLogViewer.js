import React from "react";
import { LogViewer } from "@patternfly/react-log-viewer";
import { useEffect, useState } from "react";
import io from "socket.io-client";


const MyLogViewer = () => {
  const [log, setLog] = useState("");

  useEffect(() => {
    const socket = io("http://localhost:8080");
    socket.on("connect", () => {
      console.log("Connected to server");
      socket.emit("watch-log");
    });
    socket.on("new-log-entry", (log) => {
      setLog((prevLog) => prevLog + "\n" + log);
    });

    return () => {
      socket.disconnect();
    };
  }, []);
  return (
    <LogViewer
      hasLineNumbers
      height={1500}
      data={["hello"]}
      theme='dark'
      isTextWrapped={false}
      toolbar={[]}
    />
  );
};

export default MyLogViewer;
