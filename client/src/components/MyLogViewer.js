import React from "react";
import { LogViewer, LogViewerSearch } from "@patternfly/react-log-viewer";
import ExpandIcon from "@patternfly/react-icons/dist/esm/icons/expand-icon";
import DownloadIcon from "@patternfly/react-icons/dist/esm/icons/download-icon";

import {
  Button,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Checkbox,
  ToolbarGroup,
  Tooltip,
} from "@patternfly/react-core";
import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";

const MyLogViewer = () => {
  const [log, setLog] = useState("");
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const logViewerRef = useRef(null);
  const [currentItemCount, setCurrentItemCount] = useState(0);

  useEffect(() => {
    const socket = io("http://localhost:8080");
    socket.on("connect", () => {
      console.log("Connected to server");
      socket.emit("watch-log");
    });
    socket.on("new-log-entry", (log) => {
      const logArray = log.split("\n").filter((entry) => entry.trim() !== "");
      console.log(logArray);
      console.log(logArray.length);
      setCurrentItemCount((prevCount) => prevCount + logArray.length);
      console.log(currentItemCount);
      setLog((prevLog) => prevLog + log);
    });

    return () => {
      socket.disconnect();
    };
  }, [currentItemCount]);

  const onDownloadClick = () => {
    const element = document.createElement("a");
    const dataToDownload = [log];
    const file = new Blob(dataToDownload, { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "logs.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const onExpandClick = () => {
    if (isFullScreen) {
      requestExitFullScreen();
    } else {
      requestFullScreen();
    }
  };

  const requestFullScreen = () => {
    const element = document.querySelector("#my-log-viewer");
    // Supports most browsers and their versions.
    const goFullScreen =
      element.requestFullScreen ||
      element.webkitRequestFullScreen ||
      element.mozRequestFullScreen ||
      element.msRequestFullScreen;

    if (goFullScreen) {
      goFullScreen.call(element);
      setIsFullScreen(true);
    }
  };

  const requestExitFullScreen = () => {
    const exitFullScreen =
      document.exitFullscreen ||
      document.webkitExitFullscreen ||
      document.msExitFullscreen;
    if (exitFullScreen) {
      exitFullScreen.call(document);
      setIsFullScreen(false);
    }
  };

  const leftBar = (
    <React.Fragment>
      <ToolbarGroup>
        <ToolbarItem>
          <LogViewerSearch />
        </ToolbarItem>
      </ToolbarGroup>
    </React.Fragment>
  );

  const rightBar = (
    <React.Fragment>
      <ToolbarGroup variant='icon-button-group'>
        <Checkbox
          label='Dark theme'
          isChecked={isDarkTheme}
          onChange={(value) => setIsDarkTheme(value)}
          aria-label='toggle dark theme checkbox'
          id='toggle-dark-theme'
          name='toggle-dark-theme'
        />
        <ToolbarItem>
          <Tooltip position='top' content={<div>Download</div>}>
            <Button
              onClick={onDownloadClick}
              variant='plain'
              aria-label='Download logs'>
              <DownloadIcon />
            </Button>
          </Tooltip>
        </ToolbarItem>
        <ToolbarItem>
          <Tooltip position='top' content={<div>Full Screen</div>}>
            <Button
              onClick={onExpandClick}
              variant='plain'
              aria-label='View log viewer in full screen'>
              <ExpandIcon />
            </Button>
          </Tooltip>
        </ToolbarItem>
      </ToolbarGroup>
    </React.Fragment>
  );

  return (
    <LogViewer
      id='my-log-viewer'
      innerRef={logViewerRef}
      scrollToRow={currentItemCount}
      hasLineNumbers
      height={500}
      data={log}
      theme={isDarkTheme ? "dark" : "light"}
      toolbar={
        <Toolbar>
          <ToolbarContent>
            <ToolbarGroup align={{ default: "alignLeft" }}>
              {leftBar}
            </ToolbarGroup>
            <ToolbarGroup align={{ default: "alignRight" }}>
              {rightBar}
            </ToolbarGroup>
          </ToolbarContent>
        </Toolbar>
      }
    />
  );
};

export default MyLogViewer;
