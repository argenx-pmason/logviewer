import React, { useState, useEffect, createRef } from "react";
import "./App.css";
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
  Paper,
  Button,
  Switch,
  Divider,
  CircularProgress,
  Tabs,
  Tab,
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { getDir, xmlToJson } from "./utility";
import Select from "react-select";
import sample1 from "./job_adsl.log";
import sample2 from "./sample.log";
import Add from "@mui/icons-material/Add";
import Remove from "@mui/icons-material/Remove";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import DownloadIcon from "@mui/icons-material/Download";
import ArrowCircleLeftIcon from "@mui/icons-material/ArrowCircleLeft";
import ArrowCircleRightIcon from "@mui/icons-material/ArrowCircleRight";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
// import listOfLogs from "./logs.json";
import rules from "./rules.json";
// import { Routes, Route, useNavigate } from "react-router-dom";

function App() {
  const [logText, setLogText] = useState(null),
    [logOriginalText, setLogOriginalText] = useState(null),
    logRef = createRef(),
    verticalSplit = 3.75,
    getLog = (url) => {
      // const username = "",
      //   password = "",
      //   credentials = btoa(username + ":" + password),
      //   headers = { headers: { Authorization: `Basic ${credentials}` } };
      // console.log(headers);
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
      // console.log("counts", counts);
      return counts[type];
    },
    [tabValue, changeTabValue] = useState(0),
    [badgeCountError, setBadgeCountError] = useState(0),
    [badgeCountWarn, setBadgeCountWarn] = useState(0),
    [badgeCountNotice, setBadgeCountNotice] = useState(0),
    resetCounts = () => {
      setBadgeCountError(0);
      setBadgeCountWarn(0);
      setBadgeCountNotice(0);
    },
    analyse = (text) => {
      let id = 0;
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
            // console.log("rule", rule);
            if (element.startsWith(rule.startswith)) {
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
                case "NOTICE":
                  setBadgeCountNotice(count);
                  break;
                default:
              }
              // console.log(prefix);
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
      resetCounts();
      setSelectedLog(index);
      setSelection(value);

      setWaitSelectLog(false);
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
    [checkNotice, setCheckNotice] = useState(true),
    changeCheckWarn = (event) => {
      setCheckWarn(event.target.checked);
    },
    changeCheckError = (event) => {
      setCheckError(event.target.checked);
    },
    changeCheckNotice = (event) => {
      setCheckNotice(event.target.checked);
    },
    { href } = window.location,
    [logDirectory, setLogDirectory] = useState(
      "/general/biostat/jobs/gadam_ongoing_studies/dev/logs/"
    ),
    getWebDav = async (dir) => {
      const webDavPrefix = "https://xarprod.ondemand.sas.com/lsaf/webdav/repo";
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
      // console.log("responseXML", responseXML);
      // Here you can use the Data
      let dataXML = responseXML;
      // console.log(typeof dataXML);
      let dataJSON = xmlToJson(dataXML.responseXML);
      // console.log("dataJSON:", dataJSON);
      const logs = dataJSON["d:multistatus"]["d:response"].map((record) => {
        // console.log("record", record);
        let path = record["d:href"]["#text"];
        let props = record["d:propstat"]["d:prop"];
        // console.log("path", path, "props", props);
        if (props === undefined) return null;
        const name = props["d:displayname"]["#text"] ?? "",
          created = props["d:creationdate"]["#text"],
          modified = props["d:getlastmodified"]["#text"],
          checkedOut = props["ns1:checkedOut"]["#text"],
          locked = props["ns1:locked"]["#text"],
          version = props["ns1:version"]["#text"],
          fileType = path.split(".").pop(),
          partOfLog = {
            value: "https://xarprod.ondemand.sas.com" + path,
            fileType: fileType,
            label: name,
            created: created,
            modified: modified,
            checkedOut: checkedOut,
            locked: locked,
            version: version,
          };
        // console.log(
        //   `Path: ${path},  Name: ${name},  Created: ${created},  Last modified: ${modified}, Checked out: ${checkedOut}, Locked: ${locked}, Version: ${version}`
        // );
        return partOfLog;
      });
      setListOfLogs(
        logs.filter((log) => log !== null && log.fileType === "log")
      );
      console.log("logs", logs);
    },
    tempInputs = [],
    tempOutputs = [],
    tempRealTime = [],
    tempCpuTime = [],
    analyzeLog = () => {
      logOriginalText.split("\n").forEach((line, lineNumber) => {
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
      });

      // const sortedRealTime = realTime.sort((a, b) =>
      //     a.seconds < b.seconds ? 1 : -1
      //   ),
      //   sortedCpuTime = cpuTime.sort((a, b) =>
      //     a.seconds < b.seconds ? 1 : -1
      //   );

      // console.log(inputs, outputs);
      // console.log(sortedRealTime, sortedCpuTime);
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
    const parts = href.split("?");
    if (parts.length > 1) {
      const subparts = parts[1].split("=");
      const log =
        parts.length === 2 ? subparts[1] : subparts[1] + "?" + parts[2];
      console.log("loading log from URL", log, "href", href, "log", log);
      getLog(log);
      setSelection(log);
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
    // console.log("updating log with switch values");
    getLog(selection);
    // eslint-disable-next-line
  }, [showSource, showMprint]);
  // console.log(leftPanelWidth, rightPanelWidth);

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={leftPanelWidth}>
          <TextField
            id="logDirectory"
            label="Directory containing logs"
            value={logDirectory}
            onChange={(e) => setLogDirectory(e.target.value)}
            sx={{ width: 600, mt: 2, ml: 2 }}
          />
          {!waitGetDir && (
            <Button
              onClick={() => {
                setWaitGetDir(true);
                resetCounts();
                getWebDav(logDirectory);
              }}
              sx={{
                m: 3,
                backgroundColor: "lightgray",
                color: "darkgreen",
              }}
            >
              Read directory
            </Button>
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
          <Typography
            variant="h6"
            sx={{ fontSize: { fontSize }, color: "green", mt: 3 }}
          >
            {selection}
          </Typography>
          <Paper sx={{ mt: 2 }}>
            <Tooltip title="Move center to the left">
              <IconButton
                onClick={() => {
                  setLeftPanelWidth(Math.max(leftPanelWidth - 2, 2));
                  setRightPanelWidth(Math.min(rightPanelWidth + 2, 10));
                }}
              >
                <ArrowCircleLeftIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Reset to middle">
              <IconButton
                onClick={() => {
                  setLeftPanelWidth(6);
                  setRightPanelWidth(6);
                }}
              >
                <RestartAltIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Move center to the right">
              <IconButton
                onClick={() => {
                  setLeftPanelWidth(Math.min(leftPanelWidth + 2, 10));
                  setRightPanelWidth(Math.max(rightPanelWidth - 2, 2));
                }}
              >
                <ArrowCircleRightIcon />
              </IconButton>
            </Tooltip>
            Font Size&nbsp;
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
                <RestartAltIcon />
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
            &nbsp;Download&nbsp;
            <Tooltip title="Download SAS Log">
              <IconButton
                onClick={() => {
                  openInNewTab(`${selection}`);
                }}
              >
                <DownloadIcon />
              </IconButton>
            </Tooltip>
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
              label="Source Lines"
            />
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
              label="Mprint Lines"
            />
            <Tooltip title="Page Down">
              <IconButton
                onClick={() => {
                  const clientHeight = logRef.current.clientHeight;
                  logRef.current.scrollBy(0, clientHeight - 10);
                }}
              >
                <ArrowDownwardIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Page Up">
              <IconButton
                onClick={() => {
                  const clientHeight = logRef.current.clientHeight;
                  logRef.current.scrollBy(0, -(clientHeight - 10));
                }}
              >
                <ArrowUpwardIcon />
              </IconButton>
            </Tooltip>
          </Paper>
        </Grid>
        <Grid item xs={leftPanelWidth}>
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
            label="Errors"
            control={
              <Badge color="info" badgeContent={badgeCountError}>
                <Checkbox checked={checkError} onChange={changeCheckError} />
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
              // console.log("newValue", newValue);
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
              columns={ColDefnOutputs}
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
          {inputs && tabValue === 1 && (
            <DataGrid
              rows={inputs}
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

          <Divider sx={{ m: 1 }}>Tests</Divider>
          <Tooltip title="Constructed sample from source directory (for testing)">
            <Button
              onClick={() => {
                resetCounts();
                getLog(sample2);
                setSelection(sample2);
              }}
              sx={{ border: 2, m: 1, color: "gray" }}
            >
              Test 1
            </Button>
          </Tooltip>
          <Tooltip title="Log file from source directory (for testing)">
            <Button
              onClick={() => {
                resetCounts();
                getLog(sample1);
                setSelection(sample1);
              }}
              sx={{ border: 2, m: 1, color: "gray" }}
            >
              Test 2
            </Button>
          </Tooltip>
          <Tooltip title="LSAF version of a log from webdav">
            <Button
              onClick={() => {
                resetCounts();
                getLog(
                  "https://xarprod.ondemand.sas.com/lsaf/webdav/repo/general/biostat/jobs/gadam_ongoing_studies/dev/logs/job_gadam_ongoing_studies.log?version=120.0"
                );
                setSelection(
                  "https://xarprod.ondemand.sas.com/lsaf/webdav/repo/general/biostat/jobs/gadam_ongoing_studies/dev/logs/job_gadam_ongoing_studies.log?version=120.0"
                );
              }}
              sx={{ border: 2, m: 1 }}
            >
              Test 3
            </Button>
          </Tooltip>
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
