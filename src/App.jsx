import React, { useState, useEffect, createRef } from "react";
import Select from "react-select";
import {
  Box,
  Grid,
  Typography,
  Badge,
  Tooltip,
  IconButton,
  FormControlLabel,
  TextField,
  Checkbox,
  Button,
  Switch,
  CircularProgress,
  Tabs,
  Tab,
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";

import { getDir, xmlToJson } from "./utility";
import "./App.css";
import rules from "./rules.json";
import sample1 from "./job_adsl.log";
import sample2 from "./sample.log";

import {
  Add,
  Remove,
  RestartAlt,
  Download,
  ArrowCircleLeft,
  ArrowCircleRight,
  ArrowUpward,
  ArrowDownward,
} from "@mui/icons-material";
// import { Routes, Route, useNavigate } from "react-router-dom";

function App() {
  const rowHeight = 22,
    urlPrefix = window.location.protocol + "//" + window.location.host,
    filePrefix = "/lsaf/filedownload/sdd%3A//",
    [logText, setLogText] = useState(null),
    [logOriginalText, setLogOriginalText] = useState(null),
    logRef = createRef(),
    verticalSplit = 2.75,
    getLog = (url) => {
      // const username = "",
      //   password = "",
      //   credentials = btoa(username + ":" + password),
      //   headers = { headers: { Authorization: `Basic ${credentials}` } };
      // fetch(url, headers)
      // fetch(url, { credentials: "include" })
      fetch(url).then(function (response) {
        response.text().then(function (text) {
          setLogOriginalText(text);
          const newText = analyse(text);
          setLogText(newText);
        });
      });
    },
    [listOfLogs, setListOfLogs] = useState(null),
    [fontSize, setFontSize] = useState(12),
    [leftPanelWidth, setLeftPanelWidth] = useState(6),
    [rightPanelWidth, setRightPanelWidth] = useState(6),
    [windowDimension, detectHW] = useState({
      winWidth: window.innerWidth,
      winHeight: window.innerHeight,
    }),
    detectSize = () => {
      detectHW({
        winWidth: window.innerWidth,
        winHeight: window.innerHeight,
      });
    },
    counts = {},
    incrementCount = (type) => {
      if (!counts.hasOwnProperty(type)) counts[type] = 0;
      counts[type]++;
      return counts[type];
    },
    [tabValue, changeTabValue] = useState(0),
    [badgeCountError, setBadgeCountError] = useState(0),
    [badgeCountWarn, setBadgeCountWarn] = useState(0),
    [badgeCountNotice, setBadgeCountNotice] = useState(0),
    [badgeCountJob, setBadgeCountJob] = useState(0),
    [badgeCountSerious, setBadgeCountSerious] = useState(0),
    [badgeCountOther, setBadgeCountOther] = useState(0),
    [currentLine, setCurrentLine] = useState(1),
    resetCounts = () => {
      setBadgeCountError(0);
      setBadgeCountWarn(0);
      setBadgeCountNotice(0);
      setBadgeCountSerious(0);
      setBadgeCountJob(0);
      setBadgeCountOther(0);
    },
    analyse = (text) => {
      let id = 0;
      rules.forEach((rule) => {
        if (rule.ruleType === "regex")
          rule.regularExpression = new RegExp(rule.regex, "i"); //compile text regular expressions into usable ones
      });
      const lines = text.split("\n"),
        tempLinks = [],
        tempLineNumberToLink = [],
        html = lines.map((element, lineNumber) => {
          // if (/^\W(\d+)\s+The SAS System\s+/.test(element)) return null;
          if (/The SAS System/.test(element)) return null;
          if (!showSource && /^(\d+ )/.test(element)) return null;
          if (!showMprint && element.startsWith("MPRINT(")) return null;
          let preparedToReturn = element;
          rules.forEach((rule) => {
            if (
              (rule.ruleType === "startswith" &&
                element.startsWith(rule.startswith)) ||
              (rule.ruleType === "regex" &&
                rule.regularExpression.test(element))
            ) {
              id++;
              const tag = rule.prefix,
                prefix = tag.substring(0, tag.length - 1) + ` id='${id}'>`;
              if (rule.anchor)
                tempLinks.push({
                  text: element,
                  id: id,
                  lineNumber: lineNumber,
                  linkColor: rule.linkColor,
                  type: rule.type,
                  interesting: rule.interesting,
                });
              tempLineNumberToLink.push({ id: id, lineNumber: lineNumber });
              const count = incrementCount(rule.type);
              switch (rule.type) {
                case "ERROR":
                  setBadgeCountError(count);
                  break;
                case "WARN":
                  setBadgeCountWarn(count);
                  break;
                case "SERIOUS":
                  setBadgeCountSerious(count);
                  break;
                case "JOB":
                  setBadgeCountJob(count);
                  break;
                case "NOTICE":
                  setBadgeCountNotice(count);
                  break;
                case "OTHER":
                  setBadgeCountOther(count);
                  break;
                default:
              }
              preparedToReturn = prefix + preparedToReturn + rule.suffix;
            }
          });
          setLineNumberToLink(tempLineNumberToLink);
          setLinks(tempLinks);
          return preparedToReturn;
        });
      return html.filter((element) => element != null).join("<br>");
    },
    selectLog = (index) => {
      setWaitSelectLog(true);
      const { value } = index;
      // eslint-disable-next-line
      getLog(value);
      document.title = value.split("/").pop();
      resetCounts();
      setSelectedLog(index);
      setSelection(value);

      setWaitSelectLog(false);
    },
    handleNewLog = (newLog) => {
      console.log("newLog", newLog);
    },
    openInNewTab = (url) => {
      const win = window.open(url, "_blank");
      win.focus();
    },
    [showSource, setShowSource] = useState(true),
    [showMprint, setShowMprint] = useState(true),
    [selection, setSelection] = useState(null),
    [selectedLog, setSelectedLog] = useState(null),
    [links, setLinks] = useState(null),
    [lineNumberToLink, setLineNumberToLink] = useState(null),
    [checkWarn, setCheckWarn] = useState(true),
    [waitGetDir, setWaitGetDir] = useState(false),
    [waitSelectLog, setWaitSelectLog] = useState(false),
    [checkError, setCheckError] = useState(true),
    [checkNotice, setCheckNotice] = useState(false),
    [checkSerious, setCheckSerious] = useState(true),
    [checkJob, setCheckJob] = useState(true),
    [checkOther, setCheckOther] = useState(false),
    changeCheckWarn = (event) => {
      setCheckWarn(event.target.checked);
    },
    changeCheckError = (event) => {
      setCheckError(event.target.checked);
    },
    changeCheckNotice = (event) => {
      setCheckNotice(event.target.checked);
    },
    changeCheckJob = (event) => {
      setCheckJob(event.target.checked);
    },
    changeCheckSerious = (event) => {
      setCheckSerious(event.target.checked);
    },
    changeCheckOther = (event) => {
      setCheckOther(event.target.checked);
    },
    { href } = window.location,
    [logDirectory, setLogDirectory] = useState(
      "/general/biostat/jobs/gadam_ongoing_studies/dev/logs/"
    ),
    getWebDav = async (dir) => {
      const webDavPrefix = urlPrefix + "/lsaf/webdav/repo";
      await getDir(webDavPrefix + dir, 1, processXml);
      setWaitGetDir(false);
    },
    ColDefnOutputs = [
      { field: "id", headerName: "ID", width: 90, hide: true },
      { field: "lineNumber", headerName: "Line", width: 90 },
      { field: "link", headerName: "link", width: 90, hide: true },
      { field: "libname", headerName: "Libname", width: 90 },
      { field: "dataset", headerName: "dataset", width: 180 },
      { field: "obs", headerName: "# obs", width: 90 },
      { field: "vars", headerName: "# variables", width: 90 },
    ],
    [outputs, setOutputs] = useState(null),
    ColDefnInputs = [
      { field: "id", headerName: "ID", width: 90, hide: true },
      { field: "lineNumber", headerName: "Line", width: 90 },
      { field: "link", headerName: "link", width: 90, hide: true },
      { field: "libname", headerName: "Libname", width: 90 },
      { field: "dataset", headerName: "dataset", width: 180 },
      { field: "obs", headerName: "# obs", width: 90 },
    ],
    [inputs, setInputs] = useState(null),
    ColDefnRealTime = [
      { field: "id", headerName: "ID", width: 90, hide: true },
      { field: "lineNumber", headerName: "Line", width: 90 },
      { field: "link", headerName: "link", width: 90, hide: true },
      { field: "time", headerName: "Time", width: 90 },
      { field: "units", headerName: "Units", width: 90 },
      {
        field: "seconds",
        headerName: "Seconds",
        width: 90,
        valueFormatter: (params) => {
          if (params.value == null) {
            return "";
          }
          const valueFormatted = Number(params.value).toLocaleString();
          return `${valueFormatted}`;
        },
      },
    ],
    [realTime, setRealTime] = useState(null),
    ColDefnCpuTime = [
      { field: "id", headerName: "ID", width: 90, hide: true },
      { field: "lineNumber", headerName: "Line", width: 90 },
      { field: "link", headerName: "link", width: 90, hide: true },
      { field: "time", headerName: "Time", width: 90 },
      { field: "units", headerName: "Units", width: 90 },
      {
        field: "seconds",
        headerName: "Seconds",
        width: 90,
        valueFormatter: (params) => {
          if (params.value == null) {
            return "";
          }
          const valueFormatted = Number(params.value).toLocaleString();
          return `${valueFormatted}`;
        },
      },
    ],
    [cpuTime, setCpuTime] = useState(null),
    processXml = (responseXML) => {
      // Here you can use the Data
      let dataXML = responseXML;
      let dataJSON = xmlToJson(dataXML.responseXML);
      const logs = dataJSON["d:multistatus"]["d:response"].map((record) => {
        let path = record["d:href"]["#text"];
        let props = record["d:propstat"]["d:prop"];
        if (props === undefined) return null;
        const name = props["d:displayname"]["#text"] ?? "",
          created = props["d:creationdate"]["#text"],
          modified = props["d:getlastmodified"]["#text"],
          checkedOut = props["ns1:checkedOut"]["#text"],
          locked = props["ns1:locked"]["#text"],
          version = props["ns1:version"]["#text"],
          fileType = path.split(".").pop(),
          partOfLog = {
            value: urlPrefix + path,
            fileType: fileType,
            label: name,
            created: created,
            modified: modified,
            checkedOut: checkedOut,
            locked: locked,
            version: version,
          };
        return partOfLog;
      });
      setListOfLogs(
        logs
          .filter((log) => log !== null && log.fileType === "log")
          .sort((a, b) => {
            const x = a.label.toLowerCase(),
              y = b.label.toLowerCase();
            if (x < y) {
              return -1;
            }
            if (x > y) {
              return 1;
            }
            return 0;
          })
      );
    },
    jumpTo = (id) => {
      const url = window.location.href;
      window.location.href = "#" + id;
      window.history.replaceState(null, null, url);
    },
    tempInputs = [],
    tempOutputs = [],
    tempRealTime = [],
    tempCpuTime = [],
    [program, setProgram] = useState(null),
    [submitted, setSubmitted] = useState(null),
    [submitEnd, setSubmitEnd] = useState(null),
    analyzeLog = () => {
      const logArray = logOriginalText.split("\n");
      logArray.forEach((line, lineNumber) => {
        if (line.startsWith("NOTE: There were ")) {
          const split = line.split(" "),
            obs = split[3],
            dset = split[10],
            libname = dset.split(".")[0],
            dataset = dset.split(".")[1],
            link = lineNumberToLink.filter(
              (link) => link.lineNumber === lineNumber
            )[0].id;
          tempInputs.push({
            id: lineNumber,
            libname: libname,
            dataset: dataset,
            obs: Number(obs),
            lineNumber: lineNumber,
            link: link,
          });
        }
        if (line.startsWith("NOTE: The data set ")) {
          const split = line.split(" "),
            dset = split[4],
            obs = split[6],
            vars = split[9],
            libname = dset.split(".")[0],
            dataset = dset.split(".")[1],
            link = lineNumberToLink.filter(
              (link) => link.lineNumber === lineNumber
            )[0].id;

          tempOutputs.push({
            id: lineNumber,
            libname: libname,
            dataset: dataset,
            vars: Number(vars),
            obs: Number(obs),
            lineNumber: lineNumber,
            link: link,
          });
        }
        if (line.startsWith("NOTE: Table ")) {
          const split = line.split(" "),
            dset = split[2],
            obs = split[5],
            vars = split[8],
            libname = dset.split(".")[0],
            dataset = dset.split(".")[1],
            link = lineNumberToLink.filter(
              (link) => link.lineNumber === lineNumber
            )[0].id;

          tempOutputs.push({
            id: lineNumber,
            libname: libname,
            dataset: dataset,
            vars: Number(vars),
            obs: Number(obs),
            lineNumber: lineNumber,
            link: link,
          });
        }
        if (line.startsWith("      real time")) {
          const split = line.split(" "),
            time = split[18],
            units = split[19],
            hms = time.split(":"),
            countColons = hms.length - 1,
            seconds =
              countColons === 2
                ? +hms[0] * 60 * 60 + +hms[1] * 60 + +hms[2]
                : countColons === 1
                ? +hms[0] * 60 + +hms[1]
                : Number.parseFloat(time),
            link = lineNumberToLink.filter(
              (link) => link.lineNumber === lineNumber
            )[0].id;
          tempRealTime.push({
            id: lineNumber,
            time: time,
            units: units,
            seconds: seconds,
            lineNumber: lineNumber,
            link: link,
          });
        }
        if (line.startsWith("      cpu time")) {
          const split = line.split(" "),
            time = split[19],
            units = split[20],
            hms = time.split(":"),
            countColons = hms.length - 1,
            seconds =
              countColons === 2
                ? +hms[0] * 60 * 60 + +hms[1] * 60 + +hms[2]
                : countColons === 1
                ? +hms[0] * 60 + +hms[1]
                : Number.parseFloat(time),
            link = lineNumberToLink.filter(
              (link) => link.lineNumber === lineNumber
            )[0].id;
          tempCpuTime.push({
            id: lineNumber,
            time: time,
            units: units,
            seconds: seconds,
            lineNumber: lineNumber,
            link: link,
          });
        }
        if (line.startsWith(" * Submission Start: ")) {
          const tempProgram = line.substring(21),
            tempSubmitted = logArray[lineNumber + 1].substring(3);
          setProgram(tempProgram);
          setSubmitted(tempSubmitted);
        }
        if (line.startsWith(" * Submission End: ")) {
          const tempSubmitEnd = logArray[lineNumber + 1].substring(3);
          setSubmitEnd(tempSubmitEnd);
        }
      });

      // const sortedRealTime = realTime.sort((a, b) =>
      //     a.seconds < b.seconds ? 1 : -1
      //   ),
      //   sortedCpuTime = cpuTime.sort((a, b) =>
      //     a.seconds < b.seconds ? 1 : -1
      //   );

      setOutputs(tempOutputs);
      setInputs(tempInputs);
      setRealTime(tempRealTime);
      setCpuTime(tempCpuTime);
    };

  useEffect(() => {
    if (!logOriginalText) return;
    analyzeLog();
    // eslint-disable-next-line
  }, [logOriginalText]);

  useEffect(() => {
    const splitQuestionMarks = href.split("?");
    // if a log was passed in then extract log and logDir
    if (splitQuestionMarks.length > 1) {
      const splitEquals = splitQuestionMarks[1].split("="),
        partialFile = splitEquals[1].startsWith("http")
          ? splitEquals[1]
          : urlPrefix + filePrefix + splitEquals[1],
        log1 =
          splitQuestionMarks.length > 2
            ? partialFile + "?" + splitQuestionMarks[2]
            : partialFile,
        logNames =
          splitQuestionMarks.length > 1
            ? splitQuestionMarks[1].split("/").pop().split(",")
            : [""],
        versionNumbers =
          splitQuestionMarks.length > 2
            ? splitQuestionMarks[2].split("=")[1].split(",")
            : [""],
        a = splitQuestionMarks[1].split("/"),
        logFileName = a.pop();
      document.title = logFileName;
      a.pop(); // remove the logFileName so we can work stuff out
      // console.log("splitEquals", splitEquals, "partialFile", partialFile);
      const middlePart = a.join("/") + "/" + logNames[0],
        lastPart = versionNumbers[0] ? "?version=" + versionNumbers[0] : "",
        log2 = middlePart.substring(4) + lastPart,
        log = logNames.length > 1 ? log2 : log1;
      console.log("loading log from URL", log, "href", href, "log", log);
      if (logNames.length > 1) {
        const tempListOfLogs = logNames.map((logName, i) => {
          const middlePart = a.join("/") + "/" + logNames[i],
            lastPart = versionNumbers[i] ? "?version=" + versionNumbers[i] : "",
            log2 = middlePart.substring(4) + lastPart;
          return {
            value: log2,
            label: logName + " (" + versionNumbers[i] + ")",
          };
        });
        setListOfLogs(tempListOfLogs);
      }
      getLog(log);
      setSelection(log);
      // set the directory to that of the log which was passed in
      console.log("href", href, "log", log);
      const logDirBits = log.includes("%3A")
        ? log.split("%3A")[1].split("?")[0].split("/")
        : log.split("?")[0].split("/");
      logDirBits.pop();
      if (logDirBits[0] === "https:") {
        logDirBits.shift();
        logDirBits.shift();
        logDirBits.shift();
      }
      console.log("logDirBits", logDirBits);
      const tempLogDir = logDirBits.filter((element) => element),
        logDir = tempLogDir.join("/");
      setLogDirectory("/" + logDir);
    }
    // eslint-disable-next-line
  }, [href]);

  useEffect(() => {
    window.addEventListener("resize", detectSize);
    return () => {
      window.removeEventListener("resize", detectSize);
    };
  }, [windowDimension]);

  useEffect(() => {
    if (selection === null) return;
    getLog(selection);
    // eslint-disable-next-line
  }, [showSource, showMprint]);

  return (
    <Box>
      <Grid container spacing={1}>
        <Grid item xs={leftPanelWidth} sx={{ mt: 1 }}>
          <TextField
            id="logDirectory"
            label="Directory containing logs"
            value={logDirectory}
            onChange={(e) => setLogDirectory(e.target.value)}
            sx={{
              width: (windowDimension.winWidth * leftPanelWidth) / 12 - 140,
              mt: 1,
            }}
          />
          {!waitGetDir && (
            <Tooltip title="Read directory and show a list of logs to select from">
              <Button
                onClick={() => {
                  setWaitGetDir(true);
                  resetCounts();
                  getWebDav(logDirectory);
                }}
                sx={{
                  m: 3,
                  fontSize: 12,
                  backgroundColor: "lightgray",
                  color: "darkgreen",
                }}
              >
                Read
              </Button>
            </Tooltip>
          )}
          {waitGetDir && <CircularProgress sx={{ ml: 9, mt: 2 }} />}
          {!waitSelectLog && listOfLogs && (
            <Select
              placeholder="Choose a log"
              options={listOfLogs}
              value={selectedLog}
              onChange={selectLog}
            />
          )}
          {waitSelectLog && <CircularProgress sx={{ ml: 9, mt: 2 }} />}
        </Grid>
        <Grid item xs={rightPanelWidth}>
          {/* <Typography
            variant="h6"
            sx={{ fontSize: { fontSize }, color: "black", mt: 1 }}
          >
            {selection}
          </Typography> */}
          <TextField
            label="Log Name"
            value={selection}
            onFocusout={handleNewLog}
            sx={{
              width: (windowDimension.winWidth * rightPanelWidth) / 12 - 40,
              mt: 1,
              fontSize: { fontSize },
            }}
          />
          <Box
            // disableGutters={true}
            variant={"dense"}
            sx={{
              // mt: 2,
              // display: "flex",
              // alignItems: "right",
              // width: "fit-content",
              // border: (theme) => `1px solid ${theme.palette.divider}`,
              // borderRadius: 1,
              bgcolor: "background.paper",
              color: "text.secondary",
            }}
          >
            <Tooltip title="Move center to the left">
              <IconButton
                onClick={() => {
                  setLeftPanelWidth(2);
                  setRightPanelWidth(10);
                  // setLeftPanelWidth(Math.max(leftPanelWidth - 2, 2));
                  // setRightPanelWidth(Math.min(rightPanelWidth + 2, 10));
                }}
              >
                <ArrowCircleLeft />
              </IconButton>
            </Tooltip>
            <Tooltip title="Reset to middle">
              <IconButton
                onClick={() => {
                  setLeftPanelWidth(6);
                  setRightPanelWidth(6);
                }}
              >
                <RestartAlt />
              </IconButton>
            </Tooltip>
            <Tooltip title="Move center to the right">
              <IconButton
                onClick={() => {
                  setLeftPanelWidth(10);
                  setRightPanelWidth(2);
                  // setLeftPanelWidth(Math.min(leftPanelWidth + 2, 10));
                  // setRightPanelWidth(Math.max(rightPanelWidth - 2, 2));
                }}
              >
                <ArrowCircleRight />
              </IconButton>
            </Tooltip>
            <Tooltip title="Smaller">
              <IconButton
                onClick={() => {
                  setFontSize(fontSize - 1);
                }}
              >
                <Remove />
              </IconButton>
            </Tooltip>
            <Tooltip title="Reset to 12">
              <IconButton
                onClick={() => {
                  setFontSize(12);
                }}
              >
                <RestartAlt />
              </IconButton>
            </Tooltip>
            <Tooltip title="Larger">
              <IconButton
                onClick={() => {
                  setFontSize(fontSize + 1);
                }}
              >
                <Add />
              </IconButton>
            </Tooltip>
            <Tooltip title="Download SAS Log">
              <IconButton
                onClick={() => {
                  openInNewTab(`${selection}`);
                }}
              >
                <Download />
              </IconButton>
            </Tooltip>
            <Tooltip title="Show Source Lines">
              <FormControlLabel
                control={
                  <Switch
                    checked={showSource}
                    onChange={() => {
                      setShowSource(!showSource);
                    }}
                    name="source"
                  />
                }
              />
            </Tooltip>
            <Tooltip title="Show MPrint Lines">
              <FormControlLabel
                control={
                  <Switch
                    checked={showMprint}
                    onChange={() => {
                      setShowMprint(!showMprint);
                    }}
                    name="mprint"
                  />
                }
              />
            </Tooltip>
            <Tooltip title="Page Down">
              <IconButton
                onClick={() => {
                  const clientHeight = logRef.current.clientHeight;
                  logRef.current.scrollBy(0, clientHeight - 10);
                }}
              >
                <ArrowDownward />
              </IconButton>
            </Tooltip>
            <Tooltip title="Page Up">
              <IconButton
                onClick={() => {
                  const clientHeight = logRef.current.clientHeight;
                  logRef.current.scrollBy(0, -(clientHeight - 10));
                }}
              >
                <ArrowUpward />
              </IconButton>
            </Tooltip>
            <Tooltip title="Next Interesting thing">
              <IconButton
                onClick={() => {
                  const interesting = links.filter(
                    (link) => link.interesting && link.lineNumber > currentLine
                  );
                  if (interesting.length > 0) {
                    jumpTo(interesting[0].id);
                    setCurrentLine(interesting[0].lineNumber);
                  }
                }}
              >
                <ArrowDownward
                  sx={{
                    backgroundColor: "lightblue",
                    border: 1,
                    borderRadius: 3,
                  }}
                />
              </IconButton>
            </Tooltip>
            <Tooltip title="Previous Interesting thing">
              <IconButton
                onClick={() => {
                  const interesting = links.filter(
                    (link) => link.interesting && link.lineNumber < currentLine
                  );
                  if (interesting.length > 0) {
                    jumpTo(interesting[0].id);
                    setCurrentLine(interesting[0].lineNumber);
                  }
                }}
              >
                <ArrowUpward
                  sx={{
                    backgroundColor: "lightblue",
                    border: 1,
                    borderRadius: 3,
                  }}
                />
              </IconButton>
            </Tooltip>
            <Tooltip title="Next Error">
              <IconButton
                onClick={() => {
                  const errors = links.filter(
                    (link) =>
                      link.type === "ERROR" && link.lineNumber > currentLine
                  );
                  if (errors.length > 0) {
                    jumpTo(errors[0].id);
                    setCurrentLine(errors[0].lineNumber);
                  }
                }}
              >
                <ArrowDownward
                  sx={{
                    backgroundColor: "red",
                    color: "white",
                    border: 1,
                    borderRadius: 3,
                  }}
                />
              </IconButton>
            </Tooltip>
            <Tooltip title="Previous Error">
              <IconButton
                onClick={() => {
                  const errors = links.filter(
                    (link) =>
                      link.type === "ERROR" && link.lineNumber < currentLine
                  );
                  if (errors.length > 0) {
                    jumpTo(errors[0].id);
                    setCurrentLine(errors[0].lineNumber);
                  }
                }}
              >
                <ArrowUpward
                  sx={{
                    backgroundColor: "red",
                    color: "white",
                    border: 1,
                    borderRadius: 3,
                  }}
                />
              </IconButton>
            </Tooltip>
            <Tooltip title="Next Warning">
              <IconButton
                onClick={() => {
                  const warnings = links.filter(
                    (link) =>
                      link.type === "WARN" && link.lineNumber > currentLine
                  );
                  if (warnings.length > 0) {
                    jumpTo(warnings[0].id);
                    setCurrentLine(warnings[0].lineNumber);
                  }
                }}
              >
                <ArrowDownward
                  sx={{
                    backgroundColor: "lightgreen",
                    border: 1,
                    borderRadius: 3,
                  }}
                />
              </IconButton>
            </Tooltip>
            <Tooltip title="Previous Warning">
              <IconButton
                onClick={() => {
                  const warnings = links.filter(
                    (link) =>
                      link.type === "WARN" && link.lineNumber < currentLine
                  );
                  if (warnings.length > 0) {
                    jumpTo(warnings[0].id);
                    setCurrentLine(warnings[0].lineNumber);
                  }
                }}
              >
                <ArrowUpward
                  sx={{
                    backgroundColor: "lightgreen",
                    border: 1,
                    borderRadius: 3,
                  }}
                />
              </IconButton>
            </Tooltip>
            <Tooltip title="Constructed sample from source directory (for testing)">
              <Button
                onClick={() => {
                  resetCounts();
                  getLog(sample2);
                  setSelection(sample2);
                }}
                sx={{
                  minWidth: 0,
                  fontSize: 8,
                  p: 1,
                  border: 1,
                  m: 0.5,
                  color: "lightgray",
                }}
              >
                1
              </Button>
            </Tooltip>
            <Tooltip title="Log file from source directory (for testing)">
              <Button
                onClick={() => {
                  resetCounts();
                  getLog(sample1);
                  setSelection(sample1);
                }}
                sx={{
                  minWidth: 0,
                  fontSize: 8,
                  p: 1,
                  border: 0.5,
                  m: 1,
                  color: "lightgray",
                }}
              >
                2
              </Button>
            </Tooltip>
            <Tooltip title="LSAF version of a log from webdav">
              <Button
                onClick={() => {
                  resetCounts();
                  getLog(
                    urlPrefix +
                      "/lsaf/webdav/repo/general/biostat/jobs/gadam_ongoing_studies/dev/logs/job_gadam_ongoing_studies.log?version=120.0"
                  );
                  setSelection(
                    urlPrefix +
                      "/lsaf/webdav/repo/general/biostat/jobs/gadam_ongoing_studies/dev/logs/job_gadam_ongoing_studies.log?version=120.0"
                  );
                }}
                sx={{
                  minWidth: 0,
                  fontSize: 8,
                  p: 1,
                  border: 0.5,
                  m: 1,
                  color: "lightgray",
                }}
              >
                3
              </Button>
            </Tooltip>
          </Box>
          <b>Program:</b> {program}, <b>Submitted:</b> {submitted},{" "}
          <b>Ended:</b> {submitEnd}
        </Grid>
        <Grid item xs={leftPanelWidth}>
          <FormControlLabel
            label="Errors"
            control={
              <Badge color="info" badgeContent={badgeCountError}>
                <Checkbox checked={checkError} onChange={changeCheckError} />
              </Badge>
            }
          />
          <FormControlLabel
            sx={{ ml: 1 }}
            label="Warnings"
            control={
              <Badge color="info" badgeContent={badgeCountWarn}>
                <Checkbox checked={checkWarn} onChange={changeCheckWarn} />
              </Badge>
            }
          />
          <FormControlLabel
            label="Serious"
            control={
              <Badge color="info" badgeContent={badgeCountSerious}>
                <Checkbox
                  checked={checkSerious}
                  onChange={changeCheckSerious}
                />
              </Badge>
            }
          />
          <FormControlLabel
            label="Job"
            control={
              <Badge color="info" badgeContent={badgeCountJob}>
                <Checkbox checked={checkJob} onChange={changeCheckJob} />
              </Badge>
            }
          />
          <FormControlLabel
            label="Notice"
            control={
              <Badge color="info" badgeContent={badgeCountNotice}>
                <Checkbox checked={checkNotice} onChange={changeCheckNotice} />
              </Badge>
            }
          />
          <FormControlLabel
            label="Other"
            control={
              <Badge color="info" badgeContent={badgeCountOther}>
                <Checkbox checked={checkOther} onChange={changeCheckOther} />
              </Badge>
            }
          />
          <p />
          <Box
            placeholder="Empty"
            sx={{
              border: 1,
              color: "gray",
              fontSize: fontSize - 1,
              fontFamily: "courier",
              height: windowDimension.winHeight / verticalSplit,
              // maxWidth: (windowDimension.winWidth / 12) * leftPanelWidth - 100,
              overflow: "auto",
            }}
          >
            {links &&
              links.map((link, id) => {
                // should we show a link?
                let show = true;
                if (!checkWarn && link.type === "WARN") show = false;
                if (!checkError && link.type === "ERROR") show = false;
                if (!checkNotice && link.type === "NOTICE") show = false;
                if (!checkSerious && link.type === "SERIOUS") show = false;
                if (!checkJob && link.type === "JOB") show = false;
                if (!checkOther && link.type === "OTHER") show = false;
                if (show) {
                  return (
                    <React.Fragment key={id}>
                      <a
                        style={{ color: `${link.linkColor}` }}
                        href={`#${link.id}`}
                        onClick={() => {
                          setTimeout(function () {
                            logRef.current.scrollBy({
                              top: -20,
                              left: 0,
                              behavior: "smooth",
                            });
                          }, 1000);
                        }}
                      >
                        {link.text}
                      </a>
                      <br />
                    </React.Fragment>
                  );
                } else return null;
              })}
          </Box>

          <Tabs
            value={tabValue}
            onChange={(event, newValue) => {
              changeTabValue(newValue);
            }}
          >
            <Tab label="Outputs" id={"tab0"} />
            <Tab label="Inputs" id={"tab1"} />
            <Tab label="Real Time" id={"tab2"} />
            <Tab label="CPU Time" id={"tab3"} />
          </Tabs>
          {outputs && tabValue === 0 && (
            <DataGrid
              rows={outputs}
              rowHeight={rowHeight}
              columns={ColDefnOutputs}
              density="compact"
              sx={{
                height: windowDimension.winHeight / verticalSplit,
                fontWeight: "fontSize=5",
                fontSize: "0.7em",
                padding: 0,
              }}
              onRowClick={(e) => {
                window.location.hash = e.row.link;
              }}
              components={{ Toolbar: GridToolbar }}
            />
          )}
          {inputs && tabValue === 1 && (
            <DataGrid
              rows={inputs}
              rowHeight={rowHeight}
              columns={ColDefnInputs}
              density="compact"
              sx={{
                height: windowDimension.winHeight / verticalSplit,
                fontWeight: "fontSize=5",
                fontSize: "0.7em",
              }}
              onRowClick={(e) => {
                window.location.hash = e.row.link;
              }}
              components={{ Toolbar: GridToolbar }}
            />
          )}
          {inputs && tabValue === 2 && (
            <DataGrid
              rows={realTime}
              rowHeight={rowHeight}
              columns={ColDefnRealTime}
              density="compact"
              sx={{
                height: windowDimension.winHeight / verticalSplit,
                fontWeight: "fontSize=5",
                fontSize: "0.7em",
              }}
              onRowClick={(e) => {
                window.location.hash = e.row.link;
              }}
              components={{ Toolbar: GridToolbar }}
            />
          )}
          {inputs && tabValue === 3 && (
            <DataGrid
              rows={cpuTime}
              rowHeight={rowHeight}
              columns={ColDefnCpuTime}
              density="compact"
              sx={{
                height: windowDimension.winHeight / verticalSplit,
                fontWeight: "fontSize=5",
                fontSize: "0.7em",
              }}
              onRowClick={(e) => {
                window.location.hash = e.row.link;
              }}
              components={{ Toolbar: GridToolbar }}
            />
          )}
        </Grid>
        <Grid item xs={rightPanelWidth}>
          {logText && (
            <Box
              placeholder="Empty"
              sx={{
                border: 2,
                fontSize: fontSize,
                fontFamily: "courier",
                maxHeight: windowDimension.winHeight - 150,
                maxWidth:
                  (windowDimension.winWidth / 12) * rightPanelWidth - 100,
                overflow: "auto",
              }}
              ref={logRef}
            >
              <pre
                className="content"
                style={{
                  whiteSpace: "pre",
                  padding: 10,
                }}
                dangerouslySetInnerHTML={{ __html: logText }}
              ></pre>
            </Box>
          )}
          {!logText && <Typography>Log will be displayed here.</Typography>}
        </Grid>
      </Grid>
    </Box>
  );
}

export default App;
