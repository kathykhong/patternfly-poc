import React from "react";
import { LogViewer, LogViewerSearch } from "@patternfly/react-log-viewer";
import ExpandIcon from "@patternfly/react-icons/dist/esm/icons/expand-icon";
import DownloadIcon from "@patternfly/react-icons/dist/esm/icons/download-icon";
import PauseIcon from "@patternfly/react-icons/dist/esm/icons/pause-icon";
import PlayIcon from "@patternfly/react-icons/dist/esm/icons/play-icon";
import OutlinedPlayCircleIcon from "@patternfly/react-icons/dist/esm/icons/outlined-play-circle-icon";

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
  const [isPaused, setIsPaused] = useState(false);
  const [linesBehind, setLinesBehind] = React.useState(0);
  const [renderedData, setRenderedData] = useState([]);

  useEffect(() => {
    const socket = io("http://localhost:8080");
    socket.on("connect", () => {
      console.log("Connected to server");
      socket.emit("watch-log");
    });
    socket.on("new-log-entry", (log) => {
      setLog((prevLog) => prevLog + log);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const logArray = log.split("\n").filter((entry) => entry.trim() !== "");
    if (!isPaused && logArray.length > 0) {
      setCurrentItemCount(logArray.length);
      setRenderedData(log);
      if (logViewerRef && logViewerRef.current) {
        logViewerRef.current.scrollToBottom();
      }
    } else if (logArray.length !== currentItemCount) {
      setLinesBehind(logArray.length - currentItemCount);
    } else {
      setLinesBehind(0);
    }
  }, [isPaused, log]);

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

  const onScroll = ({
    scrollOffsetToBottom,
    _scrollDirection,
    scrollUpdateWasRequested,
  }) => {
    console.log(scrollUpdateWasRequested, scrollOffsetToBottom);
    if (!scrollUpdateWasRequested) {
      if (scrollOffsetToBottom > 1) {
        setIsPaused(true);
      } else {
        setIsPaused(false);
      }
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

  const ControlButton = () => (
    <Button
      variant={isPaused ? "plain" : "link"}
      onClick={() => {
        setIsPaused(!isPaused);
      }}>
      {isPaused ? <PlayIcon /> : <PauseIcon />}
      {isPaused ? ` Resume Log` : ` Pause Log`}
    </Button>
  );

  const FooterButton = () => {
    const handleClick = (e) => {
      setIsPaused(false);
    };
    return (
      <Button onClick={handleClick}>
        <OutlinedPlayCircleIcon />
        resume {linesBehind === 0 ? null : `and show ${linesBehind} lines`}
      </Button>
    );
  };

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
          <ControlButton />
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
      onScroll={onScroll}
      hasLineNumbers
      height={isFullScreen ? "100%" : 600}
      data={renderedData}
      theme={isDarkTheme ? "dark" : "light"}
      footer={isPaused && <FooterButton />}
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
