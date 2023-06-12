import React, { useState, useEffect, createRef } from "react";
import Select from "react-select";
import {
  Box,
  Grid,
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
  Dialog,
  DialogContent,
  DialogTitle,
  Chip,
  Menu,
  MenuItem,
  Snackbar,
} from "@mui/material";
// import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { DataGridPro } from "@mui/x-data-grid-pro";
import { LicenseInfo } from "@mui/x-data-grid-pro";

import { getDir, getVersions, xmlToJson } from "./utility";
import "./App.css";
// rules are kept on LSAF in /general/biostat/tools/common/metadata/rules.json
import defaultRules from "./rules.json";
import {
  Add,
  Remove,
  RestartAlt,
  Download,
  ArrowCircleLeft,
  ArrowCircleRight,
  ArrowUpward,
  ArrowDownward,
  SquareFoot,
  FileDownloadDone,
  BarChart,
  Close,
  Compress,
  Expand,
  ZoomIn,
  ZoomOut,
  Colorize,
} from "@mui/icons-material";
// import { Routes, Route, useNavigate } from "react-router-dom";
// import Mermaid from "react-mermaid";
import Mermaid from "./Mermaid";

function App() {
  LicenseInfo.setLicenseKey(
    "5b931c69b031b808de26d5902e04c36fTz00Njk0NyxFPTE2ODg4MDI3MDM3MjAsUz1wcm8sTE09c3Vic2NyaXB0aW9uLEtWPTI="
  );
  const rowHeight = 22,
    increment = 0.25,
    [chart, setChart] = useState(`flowchart TD
    Start --> Stop`),
    [openModal, setOpenModal] = useState(false),
    [verticalSplit, setVerticalSplit] = useState(3),
    urlPrefix = window.location.protocol + "//" + window.location.host,
    filePrefix = "/lsaf/filedownload/sdd%3A//",
    webDavPrefix = urlPrefix + "/lsaf/webdav/repo",
    [logText, setLogText] = useState(null),
    [logOriginalText, setLogOriginalText] = useState(null),
    logRef = createRef(),
    localFileRef = createRef(),
    iconPadding = 0.1,
    // [showFileSelector, setShowFileSelector] = useState(false),
    [lastUrl, setLastUrl] = useState(null),
    [lastShowSource, setLastShowSource] = useState(null),
    [lastShowMacroLines, setLastShowMacroLines] = useState(null),
    [uniqueTypes, setUniqueTypes] = useState(null),
    [nLines, setNLines] = useState(null),
    [localUrl, setLocalUrl] = useState(null),
    [scale, setScale] = useState(1),
    [mermaidInfo, setMermaidInfo] = useState({ characters: null, lines: null }),
    [rules, setRules] = useState(defaultRules),
    [anchorEl, setAnchorEl] = useState(null),
    getLog = (url) => {
      // const username = "",
      //   password = "",
      //   credentials = btoa(username + ":" + password),
      //   headers = { headers: { Authorization: `Basic ${credentials}` } };
      // fetch(url, headers)
      // fetch(url, { credentials: "include" })
      if (
        url === lastUrl &&
        showSource === lastShowSource &&
        showMacroLines === lastShowMacroLines
      )
        return; // optimise process to avoid loading the same thing multiple times
      if (mode === "local") {
        setLastShowMacroLines(showMacroLines);
        setLastShowSource(showSource);
        fetch(localUrl).then(function (response) {
          // console.log(response);
          if (response.type !== "basic") {
            response.text().then(function (text) {
              console.log(
                `${text.length} characters read from file ${localUrl}`
              );
              setLogOriginalText(text);
              const newText = analyse(text); // make the log text with links and lookup for line to link
              setLogText(newText);
            });
          }
        });
      } else {
        console.log("getLog ", url);
        fetch(url).then(function (response) {
          setLastUrl(url);
          setLastShowMacroLines(showMacroLines);
          setLastShowSource(showSource);
          response.text().then(function (text) {
            setLogOriginalText(text);
            const newText = analyse(text); // make the log text with links and lookup for line to link
            setLogText(newText);
          });
        });
      }
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
    [selectedLocalFile, setSelectedLocalFile] = useState(""),
    incrementCount = (type) => {
      if (!counts.hasOwnProperty(type)) counts[type] = 0;
      counts[type]++;
      return counts[type];
    },
    [tabValue, changeTabValue] = useState(0),
    [badgeCount, setBadgeCount] = useState({}),
    [check, setCheck] = useState({}),
    changeCheck = (type) => {
      if (check.hasOwnProperty(type)) {
        const newCheck = { ...check };
        newCheck[type] = !newCheck[type];
        setCheck(newCheck);
      } else {
        const newCheck = { ...check };
        newCheck[type] = true;
        setCheck(newCheck);
      }
    },
    // [badgeCountError, setBadgeCountError] = useState(0),
    // [badgeCountWarn, setBadgeCountWarn] = useState(0),
    // [badgeCountNotice, setBadgeCountNotice] = useState(0),
    // [badgeCountJob, setBadgeCountJob] = useState(0),
    // [badgeCountSerious, setBadgeCountSerious] = useState(0),
    // [badgeCountOther, setBadgeCountOther] = useState(0),
    [currentLine, setCurrentLine] = useState(1),
    [macrosSelected, setMacrosSelected] = useState(null),
    resetCounts = () => {
      console.log("resetCounts");
      // setBadgeCountError(0);
      // setBadgeCountWarn(0);
      // setBadgeCountNotice(0);
      // setBadgeCountSerious(0);
      // setBadgeCountJob(0);
      // setBadgeCountOther(0);
      // TODO: generalise the reset
      const tempBadgeCount = {};
      uniqueTypes.forEach((type) => {
        console.log(type);
        tempBadgeCount[type] = 0;
      });
      setBadgeCount(tempBadgeCount);
    },
    selectStyles = {
      control: (baseStyles, state) => ({
        ...baseStyles,
        fontSize: "12px",
        marginLeft: 3,
        background: "#c5e1c5",
        border: state.isFocused ? "1px solid #0000ff" : "2px solid #00ffff",
        // borderColor: state.isFocused ? "green" : "red",
        // "&:hover": {
        //   border: "1px solid #ff8b67",
        //   boxShadow: "0px 0px 6px #ff8b67",
        // },
      }),
      option: (baseStyles, state) => ({
        ...baseStyles,
        fontSize: "12px",
      }),
      // container: (baseStyles, state) => ({
      //   ...baseStyles,
      //   border: "2px solid #ff8b67",
      // }),
    },
    [popUpMessage, setPopUpMessage] = useState(null),
    [openPopUp, setOpenPopUp] = useState(false),
    extractSasCode = (text) => {
      if (!logOriginalText) return;
      let lastLineNumber = null;
      const sasCode = logOriginalText
        .split("\n")
        .filter((element) => /^(\d+ )/.test(element))
        .map((line) => {
          const lineNumber = line.split(" ")[0],
            content = line.replace(/\d+\s+[\\+|\\!]?([^\n]*)/, "$1"),
            actual = lineNumber.Number;
          if (!lastLineNumber || actual > lastLineNumber) {
            lastLineNumber = actual;
            return content;
          } else return null;
        })
        .filter((element) => element != null);

      navigator.clipboard.writeText(sasCode.join("\n"));
      setPopUpMessage("SAS code copied to clipboard");
      setOpenPopUp(true);
    },
    analyse = (text) => {
      let id = 0;
      // console.log("rules", rules);
      const lines = text.split("\n"),
        tempLinks = [],
        tempLineNumberToLink = [],
        html = lines.map((element, lineNumber) => {
          // const lineNumber = ln + 1; // so the first line will be line 1, not line 0
          let matchFound = false;
          // if (/^\W(\d+)\s+The SAS System\s+/.test(element)) return null;
          if (/The SAS System/.test(element)) return null;
          if (!showSource && /^(\d+ )/.test(element)) return null;
          // mprint
          if (element.startsWith("MPRINT(")) {
            if (!showMacroLines) return null;
            else {
              const tempMacroName = element.split("(")[1].split(")")[0];
              if (macrosSelected && !macrosSelected.includes(tempMacroName)) {
                return null;
              }
            }
          }
          if (
            !showMacroLines &&
            (element.startsWith("MLOGIC(") || element.startsWith("SYMBOLGEN: "))
          )
            return null;
          let preparedToReturn = element;
          // make sure we have rules that handle all the things we might want to link to, so that there will be a link to be used
          rules.forEach((rule) => {
            if (
              !matchFound &&
              ((rule.ruleType === "startswith" &&
                element.startsWith(rule.startswith)) ||
                (rule.ruleType === "regex" &&
                  rule.regularExpression.test(element)))
            ) {
              id++;
              matchFound = true; // set this showing we have matched a rule for this line, so we dont want to match any other rules for this line
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
              incrementCount(rule.type);
              // switch (rule.type) {
              //   case "ERROR":
              //     setBadgeCountError(count);
              //     break;
              //   case "WARN":
              //     setBadgeCountWarn(count);
              //     break;
              //   case "SERIOUS":
              //     setBadgeCountSerious(count);
              //     break;
              //   case "JOB":
              //     setBadgeCountJob(count);
              //     break;
              //   case "NOTICE":
              //     setBadgeCountNotice(count);
              //     break;
              //   case "OTHER":
              //     setBadgeCountOther(count);
              //     break;
              //   default:
              // }
              preparedToReturn = prefix + preparedToReturn + rule.suffix;
              // if (rule.linkColor === "red")
              //   console.log(
              //     rule,
              //     rule.ruleType,
              //     rule.substitute,
              //     rule.regularExpression?.test(element),
              //     element
              //   );
              // handle link creation, where we have a regex and want to make something using the matching text
              if (
                rule.ruleType === "regex" &&
                rule.substitute &&
                rule.regularExpression.test(element)
              ) {
                const matches = element.match(rule.regularExpression);
                matches.forEach((match) => {
                  preparedToReturn = element;
                  if (rule.prefix.includes("{{matched}}")) {
                    //TODO: if match ends in . then remove it when making link
                    const a = rule.prefix.replace("{{matched}}", match),
                      b = rule.suffix.replace("{{matched}}", match);
                    preparedToReturn = element.replace(match, a + b);
                  }
                  if (rule.prefix.includes("{{line}}")) {
                    const c = rule.prefix.replace(
                        "{{line}}",
                        encodeURI(element)
                      ),
                      d = rule.suffix.replace("{{line}}", element);
                    preparedToReturn = "<span id=" + id + "></span>" + c + d;
                  }
                });
              }
            }
          });
          setLinks(tempLinks);
          return preparedToReturn;
        });
      const tempBadgeCount = {};
      uniqueTypes.forEach((type) => {
        if (counts.hasOwnProperty(type)) tempBadgeCount[type] = counts[type];
      });
      setBadgeCount(tempBadgeCount);

      setNLines(lines.length.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","));
      setLineNumberToLink(tempLineNumberToLink);
      return html.filter((element) => element != null).join("<br>");
    },
    selectLog = (index) => {
      setWaitSelectLog(true);
      const { value } = index;
      if (mode !== "local") {
        // eslint-disable-next-line
        getLog(value);
        document.title = value.split("/").pop();
        resetCounts();
        setSelectedLog(index);
        setSelection(value);
      } else {
        // handle selecting a local file
        // console.log(index);
        // document.title = value.split("/").pop();
        // resetCounts();
        setSelectedLocalFile(value);
        setSelectedLog(index);
        // setSelection(value);
      }
      setWaitSelectLog(false);
    },
    handleNewLog = (newLog) => {
      resetCounts();
      if (selection.substring(0, 1) === "/") getLog(webDavPrefix + selection);
      else getLog(selection);
      document.title = selection.split("/").pop();
    },
    openInNewTab = (url) => {
      const win = window.open(url, "_blank");
      win.focus();
    },
    [showSource, setShowSource] = useState(true),
    [showMacroLines, setshowMacroLines] = useState(true),
    [selection, setSelection] = useState(""),
    [selectedLog, setSelectedLog] = useState(null),
    [links, setLinks] = useState(null),
    [lineNumberToLink, setLineNumberToLink] = useState(null),
    [waitGetDir, setWaitGetDir] = useState(false),
    [waitSelectLog, setWaitSelectLog] = useState(false),
    [useMaxWidth] = useState(false),
    // [checkWarn, setCheckWarn] = useState(true),
    // [checkError, setCheckError] = useState(true),
    // [checkNotice, setCheckNotice] = useState(false),
    // [checkSerious, setCheckSerious] = useState(true),
    // [checkJob, setCheckJob] = useState(true),
    // [checkOther, setCheckOther] = useState(false),
    // changeCheckWarn = (event) => {
    //   setCheckWarn(event.target.checked);
    // },
    // changeCheckError = (event) => {
    //   setCheckError(event.target.checked);
    // },
    // changeCheckNotice = (event) => {
    //   setCheckNotice(event.target.checked);
    // },
    // changeCheckJob = (event) => {
    //   setCheckJob(event.target.checked);
    // },
    // changeCheckSerious = (event) => {
    //   setCheckSerious(event.target.checked);
    // },
    // changeCheckOther = (event) => {
    //   setCheckOther(event.target.checked);
    // },
    { href } = window.location,
    mode = href.startsWith("http://localhost") ? "local" : "remote",
    // server = href.split("//")[1].split("/")[0],
    [rulesDirectory, setRulesDirectory] = useState(
      "/Users/philipmason/Documents/GitHub/logviewer/src"
    ),
    [listOfRules, setListOfRules] = useState([]),
    [openRulesMenu, setOpenRulesMenu] = useState(false),
    // http://localhost:3001/getfile/%2FUsers%2Fphilipmason%2FDocuments%2FGitHub%2Flogviewer%2Ftests/a.log
    // http://localhost:3001/getfile/%2FUsers%2Fphilipmason%2FDocuments%2FGitHub%2Flogviewer%2Fsrc%2Flogs.json
    handleCloseRulesMenu = (item) => {
      console.log(item);
      const url =
        "http://localhost:3001/getfile/" +
        encodeURIComponent(rulesDirectory) +
        "/" +
        item;
      fetch(url).then(function (response) {
        response.text().then(function (text) {
          const tempRules = JSON.parse(text);
          console.log(
            `${tempRules.length} rules were read from rules file: ${url}`
          );
          setRules(tempRules);
        });
      });
      setOpenRulesMenu(false);
    },
    [logDirectory, setLogDirectory] = useState(
      "/general/biostat/jobs/gadam_ongoing_studies/dev/logs/"
    ),
    getWebDav = async (dir) => {
      // const webDavPrefix = urlPrefix + "/lsaf/webdav/repo";
      await getDir(webDavPrefix + dir, 1, processXml);
      setWaitGetDir(false);
    },
    getLogVersions = async (dir) => {
      // const webDavPrefix = urlPrefix + "/lsaf/webdav/repo";
      await getVersions(webDavPrefix + dir, processXml);
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
    ColDefnFiles = [
      { field: "id", headerName: "ID", width: 90, hide: true },
      { field: "lineNumber", headerName: "Line", width: 90 },
      { field: "link", headerName: "link", width: 90, hide: true },
      { field: "file", headerName: "File", width: 240, flex: 1 },
      { field: "size", headerName: "Size", width: 120 },
    ],
    [files, setFiles] = useState(null),
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
    ColDefnMprint = [
      { field: "id", headerName: "ID", width: 90, hide: true },
      { field: "show", headerName: "Show", width: 50, hide: true },
      { field: "name", headerName: "Macro name", width: 400, flex: 1 },
      { field: "lines", headerName: "Lines", width: 50 },
    ],
    [mprint, setMprint] = useState(null),
    ColDefnMlogic = [
      { field: "id", headerName: "ID", width: 90, hide: true },
      { field: "name", headerName: "Macro name", width: 400, flex: 1 },
      { field: "lines", headerName: "Lines", width: 50 },
    ],
    [mlogic, setMlogic] = useState(null),
    ColDefnSymbolgen = [
      { field: "id", headerName: "ID", width: 90, hide: true },
      { field: "name", headerName: "Macro variable name", width: 400, flex: 1 },
      { field: "lines", headerName: "Lines", width: 50 },
    ],
    [symbolgen, setSymbolgen] = useState(null),
    [selectionModel, setSelectionModel] = React.useState([]),
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
            label: name + " [" + modified.trim() + "]",
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
    tempFiles = [],
    tempOutputs = [],
    tempRealTime = [],
    tempCpuTime = [],
    [program, setProgram] = useState(null),
    [submitted, setSubmitted] = useState(null),
    [submitEnd, setSubmitEnd] = useState(null),
    analyzeLog = () => {
      const logArray = logOriginalText.split("\n"),
        tempMprint = {},
        tempMlogic = {},
        tempSymbolgen = {};
      // console.log("logArray", logArray);
      logArray.forEach((line, lineNumber) => {
        // Inputs
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
        // detect filename for infile or file
        if (
          line.startsWith("NOTE: The infile ") ||
          line.startsWith("NOTE: The file ")
        ) {
          const long = logArray
              .filter(
                (item, lineNum) =>
                  lineNum >= lineNumber && lineNum <= lineNumber + 14
              )
              .map((e) => e.trim())
              .join(""),
            from0 = long.indexOf("Filename=") + 9,
            to0 = long.indexOf(","),
            tempFile = long.substring(from0, to0),
            from1 = long.indexOf("File Size") + 10,
            to1 = Math.max(
              long.substring(from1).indexOf("\n"),
              long.substring(from1).indexOf(",")
            ),
            size = to1 ? long.substring(from1, to1 + from1) : "",
            link = lineNumberToLink.filter(
              (link) => link.lineNumber === lineNumber
            )[0].id;
          tempFiles.push({
            id: lineNumber,
            type: "In",
            file: tempFile,
            size: size,
            lineNumber: lineNumber,
            link: link,
          });
        }
        // Outputs
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
        if (
          line.startsWith("NOTE: ") &&
          line.includes("data set was successfully created")
        ) {
          const split = line.split(" "),
            dset = split[1],
            libname = dset.split(".")[0],
            dataset = dset.split(".")[1],
            link = lineNumberToLink.filter(
              (link) => link.lineNumber === lineNumber
            )[0].id,
            prev = logArray[lineNumber - 1],
            split2 = prev.split(" "),
            obs = prev.startsWith("NOTE: The import data set has")
              ? split2[6]
              : null,
            vars = prev.startsWith("NOTE: The import data set has")
              ? split2[9]
              : null;
          tempOutputs.push({
            id: lineNumber,
            libname: libname,
            dataset: dataset,
            vars: vars ? Number(vars) : undefined,
            obs: obs ? Number(obs) : undefined,
            lineNumber: lineNumber,
            link: link,
            type: prev.startsWith("NOTE: The import data set has")
              ? "Import"
              : undefined,
          });
        }
        if (line.startsWith("NOTE: Table ")) {
          const split = line.split(" "),
            dset = split[2],
            obs = line.includes("been modified") ? null : split[5],
            vars = line.includes("been modified") ? split[7] : split[8],
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
            obs: obs ? Number(obs) : undefined,
            lineNumber: lineNumber,
            link: link,
          });
        }
        // Stats
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
        if (line.startsWith("      user cpu time")) {
          const split = line.split(" "),
            time = split[15],
            units = split[16],
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
        if (line.startsWith("      system cpu time ")) {
          const split = line.split(" "),
            time = split[13],
            units = split[14],
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
        // Submission info - specific to argenx
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
        // Macro lines
        if (line.startsWith("MPRINT(")) {
          const tempMacroName = line.substring(7).split(")")[0];
          if (!(tempMacroName in tempMprint)) tempMprint[tempMacroName] = 0;
          tempMprint[tempMacroName]++;
        }
        if (line.startsWith("MLOGIC(")) {
          const tempMacroName = line.substring(7).split(")")[0];
          if (!(tempMacroName in tempMlogic)) tempMlogic[tempMacroName] = 0;
          tempMlogic[tempMacroName]++;
        }
        if (line.startsWith("SYMBOLGEN:")) {
          const tempMacroVarName = line.split(" ")[4];
          if (!(tempMacroVarName in tempSymbolgen))
            tempSymbolgen[tempMacroVarName] = 0;
          tempSymbolgen[tempMacroVarName]++;
        }
      });
      let tempMprint0 = [],
        tempMlogic0 = [],
        tempSymbolgen0 = [],
        id = 0;
      for (const name in tempMprint) {
        id++;
        tempMprint0.push({
          id: id,
          show: true,
          name: name,
          lines: tempMprint[name],
        });
      }
      for (const name in tempMlogic) {
        id++;
        tempMlogic0.push({ id: id, name: name, lines: tempMlogic[name] });
      }
      for (const name in tempSymbolgen) {
        id++;
        tempSymbolgen0.push({ id: id, name: name, lines: tempSymbolgen[name] });
      }
      // const sortedRealTime = realTime.sort((a, b) =>
      //     a.seconds < b.seconds ? 1 : -1
      //   ),
      //   sortedCpuTime = cpuTime.sort((a, b) =>
      //     a.seconds < b.seconds ? 1 : -1
      //   );
      setOutputs(tempOutputs);
      setInputs(tempInputs);
      setFiles(tempFiles);
      setRealTime(tempRealTime);
      setCpuTime(tempCpuTime);
      setMprint(tempMprint0);
      const tempSelectionModel = Object.keys(tempMprint0).map((i, id) => {
        const n = id + 1;
        return n;
      });
      setSelectionModel(tempSelectionModel);
      setMlogic(tempMlogic0);
      setSymbolgen(tempSymbolgen0);
      makeDiagram(tempInputs, tempOutputs, tempRealTime);
    },
    makeDiagram = (inputs, outputs, real) => {
      let step = 0;
      const all = inputs
        .map((item) => {
          return {
            type: "input",
            ...item,
          };
        })
        .concat(
          outputs.map((item) => {
            return {
              type: "output",
              ...item,
            };
          })
        )
        .concat(
          real.map((item) => {
            return {
              type: "real",
              ...item,
            };
          })
        )
        .sort((a, b) => (a.lineNumber < b.lineNumber ? -1 : 1))
        .map((item, id) => {
          if (item.type === "real") step++;
          return { step: item.type === "real" ? step - 1 : step, ...item };
        });
      const inputRows = all.filter((item) => item.type === "input"),
        outputRows = all.filter((item) => item.type === "output"),
        realRows = all.filter((item) => item.type === "real");
      const mappings = inputRows.map((i) => {
        const outputsForInputs = outputRows
          .filter((o) => o.step === i.step)
          .map((o) => {
            return { table: o.libname + "." + o.dataset, step: o.step };
          });
        return {
          i: i.libname + "." + i.dataset,
          outputsForInputs: outputsForInputs,
        };
      });
      let dot = [];
      // add dot commands for outputs that have no inputs
      outputRows.forEach((o) => {
        const inputsForOutputs = inputRows.filter((i) => o.step === i.step);
        if (inputsForOutputs.length === 0)
          dot.push(
            o.libname +
              "." +
              o.dataset +
              "[[" +
              o.libname +
              "." +
              o.dataset +
              "]]"
          );
      });
      // add dot commands for inputs
      mappings.forEach((item) => {
        if (item.outputsForInputs.length === 0)
          dot.push(item.i + "([" + item.i + "])");
        else {
          item.outputsForInputs.forEach((o, oIndex) => {
            const stepInfo = realRows.filter((r) => r.step === o.step);
            const seconds =
              stepInfo.length > 0 ? " |" + stepInfo[0].seconds + "| " : null;
            dot.push(
              item.i +
                "([" +
                item.i +
                "]) -->" +
                seconds +
                o.table +
                "[[" +
                o.table +
                "]]"
            );
          });
        }
      });
      const uniqueDot = [...new Set(dot)],
        mermaid = `flowchart TB\n${uniqueDot.join("\n")}`;
      setChart(mermaid);
      setMermaidInfo({ characters: mermaid.length, lines: uniqueDot.length });
    };

  // run once on page load
  useEffect(() => {
    rules.forEach((rule) => {
      if (rule.ruleType === "regex")
        rule.regularExpression = new RegExp(rule.regex, "i"); //compile text regular expressions into usable ones
    });
    const rulesToProcess = rules.filter(
      (item) => item.type !== null && item.anchor
    );
    setUniqueTypes([...new Set(rulesToProcess.map((item) => item.type))]);
  }, [rules]);

  // when uniqueTypes changes, run this to update associated data structures
  useEffect(() => {
    if (!uniqueTypes) return;
    const tempBadgeCount = {},
      tempCheck = {};
    uniqueTypes.forEach((type) => {
      tempBadgeCount[type] = 0;
      tempCheck[type] = true;
    });
    setBadgeCount(tempBadgeCount);
    setCheck(tempCheck);
  }, [uniqueTypes]);

  useEffect(() => {
    if (!logText) return;
    analyzeLog();
    // eslint-disable-next-line
  }, [logText]); // logText changes when it has been analyzed and all links and lookups prepared

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
      const logDirBits = log.includes("%3A")
        ? log.split("%3A")[1].split("?")[0].split("/")
        : log.split("?")[0].split("/");
      logDirBits.pop();
      if (logDirBits[0] === "https:") {
        logDirBits.shift();
        logDirBits.shift();
        logDirBits.shift();
      }
      const tempLogDir = logDirBits.filter((element) => element),
        logDir0 = tempLogDir.join("/"),
        logDir = logDir0.startsWith("lsaf/webdav/")
          ? logDir0.substring(17)
          : logDir0;
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

  // for local mode - get the list of logs by reading directory
  useEffect(() => {
    const dir = encodeURIComponent(
        "/Users/philipmason/Documents/GitHub/logviewer/tests"
      ),
      url = "http://localhost:3001/dir/" + dir;
    setLogDirectory(decodeURIComponent(dir));
    fetch(url).then(function (response) {
      response.text().then(function (text) {
        const files = JSON.parse(text);
        setListOfLogs(
          files
            .filter((log) => {
              return log !== null && log.endsWith(".log");
            })
            .map((log) => {
              return { value: log, label: log };
            })
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
      });
    });
  }, []);

  // for local mode - get the list of rules by reading directory
  useEffect(() => {
    const dir = encodeURIComponent(rulesDirectory),
      url = "http://localhost:3001/dir/" + dir;
    setRulesDirectory(decodeURIComponent(dir));
    fetch(url).then(function (response) {
      response.text().then(function (text) {
        const files = JSON.parse(text);
        setListOfRules(
          files
            .filter((ruleFile) => {
              return ruleFile !== null && ruleFile.endsWith(".json");
            })
            .map((ruleFile) => {
              return { value: ruleFile, label: ruleFile };
            })
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
      });
    });
    // eslint-disable-next-line
  }, []);

  // for local mode - get the log file
  useEffect(() => {
    // const dir = encodeURIComponent(
    //     "/Users/philipmason/Documents/GitHub/logviewer/src"
    //   ),
    //   file = "sample.log",
    //   url = "http://localhost:3001/getfile/" + dir + "/" + file;
    if (selectedLocalFile === "") return;
    const file = selectedLocalFile.split("/").pop(),
      dir = encodeURIComponent(
        "/Users/philipmason/Documents/GitHub/logviewer/tests"
      ),
      url = "http://localhost:3001/getfile/" + dir + "/" + file;
    setLocalUrl(url);
    // console.log(
    //   "selectedLocalFile",
    //   selectedLocalFile,
    //   "\nfile",
    //   file,
    //   "\ndir",
    //   dir,
    //   "\nfile",
    //   file,
    //   "\nurl",
    //   url
    // );
    fetch(url).then(function (response) {
      response.text().then(function (text) {
        console.log(`${text.length} characters were read from file ${url}`);
        setLogOriginalText(text);
        const newText = analyse(text); // make the log text with links and lookup for line to link
        setLogText(newText);
      });
    });
    // eslint-disable-next-line
  }, [selectedLocalFile, rules]);

  useEffect(() => {
    if (selection === null) return;
    const tempMacrosSelected = [];
    selectionModel.forEach((item) => {
      tempMacrosSelected.push(mprint[item - 1].name);
    });
    setMacrosSelected(tempMacrosSelected);
    // eslint-disable-next-line
  }, [showSource, showMacroLines, selectionModel]);

  useEffect(() => {
    if (macrosSelected === null) return;
    getLog(selection);
    // eslint-disable-next-line
  }, [macrosSelected]);

  return (
    <Box>
      <Grid container spacing={1}>
        <Grid item xs={leftPanelWidth} sx={{ mt: 1 }}>
          {logDirectory ? (
            <TextField
              id="logDirectory"
              label="Directory containing logs"
              value={logDirectory}
              size={"small"}
              onChange={(e) => setLogDirectory(e.target.value)}
              inputProps={{ style: { fontSize: 14 } }}
              sx={{
                width: (windowDimension.winWidth * leftPanelWidth) / 12 - 140,
                mt: 1,
                ml: 1,
              }}
            />
          ) : null}
          {!waitGetDir && mode !== "local" ? (
            <Tooltip title="Read directory and show a list of logs to select from">
              <Button
                onClick={() => {
                  if (mode === "local") {
                    localFileRef.current.click();
                  } else {
                    setWaitGetDir(true);
                    resetCounts();
                    getWebDav(logDirectory);
                  }
                }}
                sx={{
                  m: 2,
                  fontSize: 12,
                  backgroundColor: "lightgray",
                  color: "darkgreen",
                }}
              >
                Read
              </Button>
            </Tooltip>
          ) : null}
          {waitGetDir ? <CircularProgress sx={{ ml: 9, mt: 2 }} /> : null}
          {!waitSelectLog && listOfLogs ? (
            <Select
              placeholder="Choose a log"
              options={listOfLogs}
              value={selectedLog}
              onChange={selectLog}
              styles={selectStyles}
            />
          ) : null}
          {waitSelectLog ? <CircularProgress sx={{ ml: 9, mt: 2 }} /> : null}
        </Grid>
        <Grid item xs={rightPanelWidth}>
          <Box
            variant={"dense"}
            sx={{
              bgcolor: "background.paper",
              color: "text.secondary",
            }}
          >
            <TextField
              label="Log Name"
              value={selection}
              size={"small"}
              inputProps={{ style: { fontSize: 14 } }}
              onChange={(event) => {
                setSelection(event.target.value);
              }}
              sx={{
                width: (windowDimension.winWidth * rightPanelWidth) / 12 - 100,
                mt: 1,
              }}
            />
            <Tooltip title="Load log - either starting with http or /">
              <IconButton
                size="small"
                onClick={handleNewLog}
                sx={{ mt: 1, color: "green" }}
              >
                <FileDownloadDone fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Get a list of versions to choose from (not yet working)">
              <IconButton
                size="small"
                onClick={() => {
                  setWaitGetDir(true);
                  resetCounts();
                  getLogVersions(logDirectory);
                }}
                sx={{ mt: 1, color: "green" }}
              >
                <Download fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
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
              // padding: iconPadding,
              bgcolor: "background.paper",
              color: "text.secondary",
            }}
          >
            <Tooltip title="Move center to the left">
              <IconButton
                size="small"
                sx={{ padding: iconPadding }}
                onClick={() => {
                  // setLeftPanelWidth(2);
                  // setRightPanelWidth(10);
                  setLeftPanelWidth(Math.max(leftPanelWidth - 3, 0));
                  setRightPanelWidth(Math.min(rightPanelWidth + 3, 12));
                }}
              >
                <ArrowCircleLeft fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Reset to middle">
              <IconButton
                size="small"
                sx={{ padding: iconPadding }}
                onClick={() => {
                  setLeftPanelWidth(6);
                  setRightPanelWidth(6);
                }}
              >
                <RestartAlt fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Move center to the right">
              <IconButton
                size="small"
                sx={{ padding: iconPadding }}
                onClick={() => {
                  // setLeftPanelWidth(10);
                  // setRightPanelWidth(2);
                  setLeftPanelWidth(Math.min(leftPanelWidth + 3, 12));
                  setRightPanelWidth(Math.max(rightPanelWidth - 3, 0));
                }}
              >
                <ArrowCircleRight fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Smaller">
              <IconButton
                size="small"
                sx={{ padding: iconPadding }}
                onClick={() => {
                  setFontSize(fontSize - 1);
                }}
              >
                <Remove fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Reset to 12">
              <IconButton
                size="small"
                sx={{ padding: iconPadding }}
                onClick={() => {
                  setFontSize(12);
                }}
              >
                <RestartAlt fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Larger">
              <IconButton
                size="small"
                sx={{ padding: iconPadding }}
                onClick={() => {
                  setFontSize(fontSize + 1);
                }}
              >
                <Add fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Download SAS Log">
              <IconButton
                size="small"
                sx={{ padding: iconPadding }}
                onClick={() => {
                  openInNewTab(`${selection}`);
                }}
              >
                <Download fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Show Source Lines">
              <FormControlLabel
                sx={{ marginRight: iconPadding + 0.5 }}
                control={
                  <Switch
                    checked={showSource}
                    onChange={() => {
                      setShowSource(!showSource);
                    }}
                    name="source"
                    size="small"
                  />
                }
              />
            </Tooltip>
            <Tooltip title="Show Mprint/Mlogic/Symbolgen Lines">
              <FormControlLabel
                sx={{ marginRight: iconPadding }}
                control={
                  <Switch
                    checked={showMacroLines}
                    onChange={() => {
                      setshowMacroLines(!showMacroLines);
                    }}
                    name="mprint"
                    size="small"
                  />
                }
              />
            </Tooltip>
            <Tooltip title="Page Down">
              <IconButton
                size="small"
                sx={{ padding: iconPadding }}
                onClick={() => {
                  const clientHeight = logRef.current.clientHeight;
                  logRef.current.scrollBy(0, clientHeight - 20);
                }}
              >
                <ArrowDownward fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Page Up">
              <IconButton
                size="small"
                sx={{ padding: iconPadding }}
                onClick={() => {
                  const clientHeight = logRef.current.clientHeight;
                  logRef.current.scrollBy(0, -(clientHeight - 10));
                }}
              >
                <ArrowUpward fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Next Interesting thing">
              <IconButton
                size="small"
                sx={{ padding: iconPadding }}
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
                  fontSize="small"
                  sx={{
                    padding: iconPadding,
                    backgroundColor: "lightblue",
                    border: 1,
                    borderRadius: 3,
                  }}
                />
              </IconButton>
            </Tooltip>
            <Tooltip title="Previous Interesting thing">
              <IconButton
                size="small"
                sx={{ padding: iconPadding }}
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
                  fontSize="small"
                  sx={{
                    padding: iconPadding,
                    backgroundColor: "lightblue",
                    border: 1,
                    borderRadius: 3,
                  }}
                />
              </IconButton>
            </Tooltip>
            <Tooltip title="Next Error">
              <IconButton
                size="small"
                sx={{ padding: iconPadding }}
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
                  fontSize="small"
                  sx={{
                    padding: iconPadding,
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
                size="small"
                sx={{ padding: iconPadding }}
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
                  fontSize="small"
                  sx={{
                    padding: iconPadding,
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
                size="small"
                sx={{ padding: iconPadding }}
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
                  fontSize="small"
                  sx={{
                    padding: iconPadding,
                    backgroundColor: "lightgreen",
                    border: 1,
                    borderRadius: 3,
                  }}
                />
              </IconButton>
            </Tooltip>
            <Tooltip title="Previous Warning">
              <IconButton
                size="small"
                sx={{ padding: iconPadding }}
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
                  fontSize="small"
                  sx={{
                    padding: iconPadding,
                    backgroundColor: "lightgreen",
                    border: 1,
                    borderRadius: 3,
                  }}
                />
              </IconButton>
            </Tooltip>
            <Tooltip title="Show Chart">
              <IconButton size="small" onClick={() => setOpenModal(true)}>
                <BarChart fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Choose rules used to parse logs">
              <IconButton
                size="small"
                sx={{ padding: iconPadding }}
                onClick={(e) => {
                  setAnchorEl(e.currentTarget);
                  setOpenRulesMenu(true);
                }}
              >
                <SquareFoot fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Extract SAS code (if possible)">
              <IconButton
                size="small"
                sx={{ padding: iconPadding }}
                onClick={(e) => {
                  extractSasCode();
                }}
              >
                <Colorize fontSize="small" />
              </IconButton>
            </Tooltip>
            <Snackbar
              open={openPopUp}
              onClose={() => setOpenPopUp(false)}
              autoHideDuration={3000}
              message={popUpMessage}
            />
            <Menu
              open={openRulesMenu}
              onClose={handleCloseRulesMenu}
              anchorEl={anchorEl}
            >
              {listOfRules &&
                listOfRules.length > 0 &&
                listOfRules.map((rule, id) => (
                  <MenuItem
                    key={id}
                    onClick={(e) => handleCloseRulesMenu(rule.value)}
                  >
                    {rule.label}
                  </MenuItem>
                ))}
            </Menu>
            <Tooltip title={`Compress by ${increment}`}>
              <IconButton
                size="small"
                onClick={() => {
                  setVerticalSplit(verticalSplit + increment);
                }}
                // sx={{
                //   backgroundColor: buttonBackground,
                //   color: "yellow",
                // }}
              >
                <Compress fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={`Expand by ${increment}`}>
              <IconButton
                size="small"
                onClick={() => {
                  setVerticalSplit(verticalSplit - increment);
                }}
                // sx={{
                //   backgroundColor: buttonBackground,
                //   color: "yellow",
                // }}
              >
                <Expand fontSize="small" />
              </IconButton>
            </Tooltip>

            {mode === "local" ? (
              <Tooltip title="Test email">
                <Button
                  onClick={() => {
                    console.log("email");
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
            ) : null}
          </Box>
          <b>Program:</b> {program}, <b>Submitted:</b> {submitted},{" "}
          <b>Ended:</b> {submitEnd}, <b>Lines:</b> {nLines}
        </Grid>
        <Grid item xs={leftPanelWidth}>
          {uniqueTypes &&
            // uniqueTypes.length === badgeCount.length &&
            uniqueTypes.map((t) => {
              // console.log(
              //   "t",
              //   t,
              //   // badgeCount,
              //   "badgeCount[t]",
              //   badgeCount[t],
              //   "uniqueTypes.length",
              //   uniqueTypes.length,
              //   "Object.keys(badgeCount).length",
              //   Object.keys(badgeCount).length
              // );
              if (uniqueTypes.length >= Object.keys(badgeCount).length)
                return (
                  <FormControlLabel
                    key={t}
                    label={t}
                    control={
                      <Badge color="info" badgeContent={badgeCount[t]}>
                        <Checkbox
                          checked={check[t] === undefined ? true : check[t]}
                          onChange={() => changeCheck(t)}
                          inputProps={{ "aria-label": "controlled" }}
                        />
                      </Badge>
                    }
                  />
                );
              else return null;
            })}
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
                uniqueTypes.forEach((t) => {
                  if (!check[t] && link.type === t) show = false;
                });
                if (show) {
                  return (
                    <React.Fragment key={id}>
                      <a
                        style={{ color: `${link.linkColor}` }}
                        href={`#${link.id}`}
                        onClick={() => {
                          setTimeout(function () {
                            logRef.current.scrollBy({
                              top: -33,
                              left: 0,
                              behavior: "smooth",
                            });
                          }, 500);
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
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab
              label="Outputs"
              id={"tab0"}
              sx={{
                fontSize: 12,
              }}
            />
            <Tab label="Inputs" id={"tab1"} sx={{ fontSize: 12 }} />
            <Tab label="Files" id={"tab2"} sx={{ fontSize: 12 }} />
            <Tab label="Real Time" id={"tab3"} sx={{ fontSize: 12 }} />
            <Tab label="CPU Time" id={"tab4"} sx={{ fontSize: 12 }} />
            <Tab
              label="MPRINT"
              id={"tab5"}
              sx={{
                fontSize: 12,
              }}
            />
            <Tab label="MLOGIC" id={"tab6"} sx={{ fontSize: 12 }} />
            <Tab label="SYMBOLGEN" id={"tab7"} sx={{ fontSize: 12 }} />
          </Tabs>
          {outputs && tabValue === 0 && (
            <DataGridPro
              rows={outputs}
              rowHeight={rowHeight}
              columns={ColDefnOutputs}
              density="compact"
              hideFooter={true}
              sx={{
                height: windowDimension.winHeight / verticalSplit,
                fontWeight: "fontSize=5",
                fontSize: "0.7em",
                padding: iconPadding,
              }}
              onRowClick={(e) => {
                window.location.hash = e.row.link;
              }}
              // components={{ Toolbar: GridToolbar }}
            />
          )}
          {inputs && tabValue === 1 && (
            <DataGridPro
              rows={inputs}
              rowHeight={rowHeight}
              columns={ColDefnInputs}
              density="compact"
              hideFooter={true}
              sx={{
                height: windowDimension.winHeight / verticalSplit,
                fontWeight: "fontSize=5",
                fontSize: "0.7em",
              }}
              onRowClick={(e) => {
                window.location.hash = e.row.link;
              }}
              // components={{ Toolbar: GridToolbar }}
            />
          )}
          {inputs && tabValue === 2 && (
            <DataGridPro
              rows={files}
              rowHeight={rowHeight}
              columns={ColDefnFiles}
              density="compact"
              hideFooter={true}
              sx={{
                height: windowDimension.winHeight / verticalSplit,
                fontWeight: "fontSize=5",
                fontSize: "0.7em",
              }}
              onRowClick={(e) => {
                window.location.hash = e.row.link;
              }}
              // components={{ Toolbar: GridToolbar }}
            />
          )}
          {inputs && tabValue === 3 && (
            <DataGridPro
              rows={realTime}
              rowHeight={rowHeight}
              columns={ColDefnRealTime}
              density="compact"
              hideFooter={true}
              sx={{
                height: windowDimension.winHeight / verticalSplit,
                fontWeight: "fontSize=5",
                fontSize: "0.7em",
              }}
              onRowClick={(e) => {
                window.location.hash = e.row.link;
              }}
              // components={{ Toolbar: GridToolbar }}
            />
          )}
          {inputs && tabValue === 4 && (
            <DataGridPro
              rows={cpuTime}
              rowHeight={rowHeight}
              columns={ColDefnCpuTime}
              density="compact"
              hideFooter={true}
              sx={{
                height: windowDimension.winHeight / verticalSplit,
                fontWeight: "fontSize=5",
                fontSize: "0.7em",
              }}
              onRowClick={(e) => {
                window.location.hash = e.row.link;
              }}
              // components={{ Toolbar: GridToolbar }}
            />
          )}
          {inputs && tabValue === 5 && (
            <DataGridPro
              checkboxSelection
              onSelectionModelChange={(newSelectionModel) => {
                setSelectionModel(newSelectionModel);
              }}
              selectionModel={selectionModel}
              rows={mprint}
              rowHeight={rowHeight}
              columns={ColDefnMprint}
              density="compact"
              hideFooter={true}
              sx={{
                height: windowDimension.winHeight / verticalSplit,
                fontWeight: "fontSize=5",
                fontSize: "0.7em",
                "& .MuiSvgIcon-root": {
                  width: "0.6em",
                },
              }}
              onRowClick={(e) => {
                window.location.hash = e.row.link;
              }}
              // components={{ Toolbar: GridToolbar }}
            />
          )}
          {inputs && tabValue === 6 && (
            <DataGridPro
              rows={mlogic}
              rowHeight={rowHeight}
              columns={ColDefnMlogic}
              density="compact"
              hideFooter={true}
              sx={{
                height: windowDimension.winHeight / verticalSplit,
                fontWeight: "fontSize=5",
                fontSize: "0.7em",
              }}
              onRowClick={(e) => {
                window.location.hash = e.row.link;
              }}
              // components={{ Toolbar: GridToolbar }}
            />
          )}
          {inputs && tabValue === 7 && (
            <DataGridPro
              rows={symbolgen}
              rowHeight={rowHeight}
              columns={ColDefnSymbolgen}
              density="compact"
              hideFooter={true}
              sx={{
                height: windowDimension.winHeight / verticalSplit,
                fontWeight: "fontSize=5",
                fontSize: "0.7em",
              }}
              onRowClick={(e) => {
                window.location.hash = e.row.link;
              }}
              // components={{ Toolbar: GridToolbar }}
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
                maxHeight: windowDimension.winHeight - 50 * verticalSplit,
                maxWidth:
                  (windowDimension.winWidth / 12) * rightPanelWidth - 25,
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
          {!logText && (
            <Box sx={{ m: 10, fontSize: 20, color: "red" }}>
              Log will be displayed here.
            </Box>
          )}
          <Dialog
            open={openModal}
            onClose={() => setOpenModal(false)}
            scroll={"paper"}
            fullScreen
            style={{ backdropFilter: "blur(5px" }}
          >
            <DialogTitle>
              <Tooltip title={`Zoom out`}>
                <IconButton
                  size="small"
                  onClick={() => {
                    setScale(scale > 0.25 ? scale - 0.25 : 0.125);
                  }}
                  sx={{
                    backgroundColor: "white",
                    color: "blue",
                    float: "left",
                  }}
                >
                  <ZoomOut fontSize="small" />
                </IconButton>
              </Tooltip>{" "}
              <Tooltip title={`Reset`}>
                <IconButton
                  size="small"
                  onClick={() => {
                    setScale(1);
                  }}
                  sx={{
                    backgroundColor: "white",
                    color: "blue",
                    float: "left",
                  }}
                >
                  <RestartAlt fontSize="small" />
                </IconButton>
              </Tooltip>{" "}
              <Tooltip title={`Zoom out`}>
                <IconButton
                  size="small"
                  onClick={() => {
                    setScale(scale + 0.5);
                  }}
                  sx={{
                    backgroundColor: "white",
                    color: "blue",
                    float: "left",
                  }}
                >
                  <ZoomIn fontSize="small" />
                </IconButton>
              </Tooltip>
              <Button
                onClick={() => {
                  setOpenModal(false);
                }}
              >
                Close
              </Button>
              <Tooltip title={`Close Dialog`}>
                <IconButton
                  size="small"
                  onClick={() => {
                    setOpenModal(false);
                  }}
                  sx={{
                    backgroundColor: "white",
                    color: "red",
                    float: "right",
                  }}
                >
                  <Close fontSize="small" />
                </IconButton>
              </Tooltip>
              {mermaidInfo.lines && (
                <Chip
                  label={mermaidInfo.lines.toLocaleString() + " lines"}
                  sx={{
                    fontSize: 12,
                    float: "right",
                  }}
                />
              )}
              {mermaidInfo.characters && (
                <Chip
                  label={
                    mermaidInfo.characters.toLocaleString() + " characters"
                  }
                  sx={{
                    fontSize: 12,
                    float: "right",
                  }}
                />
              )}
            </DialogTitle>
            <DialogContent
              sx={{
                transform: `scale(${scale})`,
                transformOrigin: "0% 0% 0px;",
                width: Math.round(windowDimension.winWidth / scale),
              }}
            >
              <Mermaid chart={chart} useMaxWidth={useMaxWidth} />
            </DialogContent>
          </Dialog>
        </Grid>
      </Grid>
    </Box>
  );
}

export default App;
