import React, { useState, useEffect, createRef } from "react";
import Select from "react-select";
import {
  Box,
  Grid,
  AppBar,
  Toolbar,
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
  DialogActions,
  LinearProgress,
  Typography,
  DialogContentText,
  Autocomplete,
} from "@mui/material";
import PropTypes from "prop-types";
import { DataGridPro, LicenseInfo } from "@mui/x-data-grid-pro";
import worker_script from "./worker";
import { getDir, getVersions, xmlToJson } from "./utility";
import "./App.css";
// rules are kept on LSAF in /general/biostat/tools/common/metadata/rules.json
import defaultRules from "./rules.json";
import requiredRules from "./required-rules.json";
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
  Visibility,
  Publish,
  Refresh,
  Info,
  Email,
  ContentPaste,
} from "@mui/icons-material";
import Mermaid from "./Mermaid";

function LinearProgressWithLabel(props) {
  return (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <Box sx={{ width: "100%", mr: 1 }}>
        <LinearProgress variant="determinate" {...props} />
      </Box>
      <Box sx={{ minWidth: 35 }}>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {`${Math.round(props.value)}%`}
        </Typography>
      </Box>
    </Box>
  );
}
LinearProgressWithLabel.propTypes = {
  /**
   * The value of the progress indicator for the determinate and buffer variants.
   * Value between 0 and 100.
   */
  value: PropTypes.number.isRequired,
};

function App() {
  LicenseInfo.setLicenseKey(
    "6b1cacb920025860cc06bcaf75ee7a66Tz05NDY2MixFPTE3NTMyNTMxMDQwMDAsUz1wcm8sTE09c3Vic2NyaXB0aW9uLEtWPTI="
  );
  const myWorker = new Worker(worker_script),
    rowHeight = 22,
    increment = 0.25,
    [chart, setChart] = useState(`flowchart TD
    Start --> Stop`),
    [openModal, setOpenModal] = useState(false),
    [verticalSplit, setVerticalSplit] = useState(3),
    urlPrefix = window.location.protocol + "//" + window.location.host,
    filePrefix = "/lsaf/filedownload/sdd%3A//",
    webDavPrefix = urlPrefix + "/lsaf/webdav/repo",
    [logText, setLogText] = useState(""),
    [logOriginalText, setLogOriginalText] = useState(""),
    [showLineNumbers, setShowLineNumbers] = useState(null),
    [dirListing, setDirListing] = useState(null),
    logRef = createRef(),
    // localFileRef = createRef(),
    iconPadding = 0.25,
    [openInfo, setOpenInfo] = useState(false),
    [direction, setDirection] = useState(true),
    // [showFileSelector, setShowFileSelector] = useState(false),
    [lastUrl, setLastUrl] = useState(null),
    [search, setSearch] = useState(null),
    [lastShowSource, setLastShowSource] = useState(null),
    [lastShowMacroLines, setLastShowMacroLines] = useState(null),
    [uniqueTypes, setUniqueTypes] = useState(null),
    [nLines, setNLines] = useState(null),
    [openRulesModal, setOpenRulesModal] = useState(false),
    // handleClickOpenRulesModal = () => {
    //   setOpenRulesModal(true);
    // },
    handleCloseRulesModal = () => {
      setOpenRulesModal(false);
    },
    [lineVar, setLineVar] = useState("obs"),
    lineVarOptions = ["real", "obs"],
    [localUrl, setLocalUrl] = useState(null),
    [scale, setScale] = useState(1),
    [mermaidInfo, setMermaidInfo] = useState({ characters: null, lines: null }),
    [rules, setRules] = useState([...defaultRules, ...requiredRules]),
    [anchorEl, setAnchorEl] = useState(null),
    getLog = (url) => {
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
          if (response.type !== "basic") {
            if (response.ok) {
              response.text().then(function (text) {
                console.log(
                  `${text.length} characters read from file ${localUrl}`
                );
                setLogOriginalText(text);
                analyse(1, text);
              });
            } else {
              const message =
                "Getting log failed, response = " + response.status;
              setLogOriginalText(message);
              setLogText("<p>" + message + "</p>");
            }
          }
        });
      } else {
        console.log("getLog:- url = ", url);
        fetch(url).then((response) => {
          setLastUrl(url);
          setLastShowMacroLines(showMacroLines);
          setLastShowSource(showSource);
          if (response.ok) {
            response.text().then((text) => {
              setLogOriginalText(text);
              analyse(2, text);
            });
          } else {
            const message = "Getting log failed, response = " + response.status;
            setLogOriginalText(message);
            setLogText("<p>" + message + "</p>");
          }
        });
      }
    },
    [listOfLogs, setListOfLogs] = useState(null),
    [listOfDirs, setListOfDirs] = useState(null),
    [fontSize, setFontSize] = useState(12),
    [leftPanelWidth, setLeftPanelWidth] = useState(6),
    [rightPanelWidth, setRightPanelWidth] = useState(6),
    [windowDimension, setWindowDimension] = useState({
      winWidth: window.innerWidth - 50,
      winHeight: window.innerHeight - 50,
    }),
    detectSize = () => {
      setWindowDimension({
        winWidth: window.innerWidth - 50,
        winHeight: window.innerHeight - 50,
      });
    },
    zeroPad = (num, places) => String(num).padStart(places, "0"),
    // [counts, setCounts] = useState({}),
    [selectedLocalFile, setSelectedLocalFile] = useState(""),
    [tabValue, setTabValue] = useState(0),
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
    [currentLine, setCurrentLine] = useState(1),
    [macrosSelected, setMacrosSelected] = useState(null),
    resetCounts = () => {
      console.log("resetCounts");
      if (!uniqueTypes) return;
      uniqueTypes.forEach((type) => {
        badgeCount[type] = 0;
        check[type] = true;
        counts[type] = 0;
      });
      counts = {};
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
    [processingTime, setProcessingTime] = useState(null),
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
    // paste the contents of clipboard in as a new log
    pasteClipboard = async () => {
      const text = await navigator.clipboard.readText();
      if (text.length > 100) {
        text.replace(/\r\n/g, "\n");
        const lines = text.split("\n");
        // show first element of lines in hex
        let hex,
          i,
          result = "",
          l1 = lines[0];
        for (i = 0; i < l1.length; i++) {
          hex = l1.charCodeAt(i).toString(16);
          result += ("000" + hex).slice(-4);
        }
        console.log("lines[0]", lines[0], "result", result);

        setOpenPopUp(true);
        setPopUpMessage("Pasting contents of clipboard");
        setLogOriginalText(text);
        analyse(3, text);
      } else {
        setOpenPopUp(true);
        setPopUpMessage(
          "Length of clipboard text is less than 100 characters, so not pasting it"
        );
      }
    },
    [progress, setProgress] = useState(null),
    // use rules to analyse text and modify it
    analyse = (calledFrom, text) => {
      if (text === null || text.length === 0 || !uniqueTypes) return;
      console.log("analyse - calledFrom=", calledFrom, "length=", text.length);
      resetCounts();
      setProgress(0);
      const lines = text.split("\n"),
        linesPackage = {
          lines: lines,
          showSource: showSource,
          showMacroLines: showMacroLines,
          macrosSelected: macrosSelected,
          rules: rules,
        };

      setNLines(lines.length.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","));

      myWorker.postMessage(linesPackage); // hand off the processing of lines to web worker thread
    },
    selectLog = (index) => {
      console.log("> selectLog function called", index);
      setAnalyseAgain(false);
      setWaitSelectLog(true);
      const { value } = index;
      if (mode !== "local") {
        // eslint-disable-next-line
        getLog(value);
        document.title = value.split("/").pop();
        setSelectedLog(index);
        setSelection(value);
      } else {
        setSelectedLocalFile(value);
        setSelectedLog(index);
      }
      setWaitSelectLog(false);
    },
    handleNewLog = (newLog) => {
      console.log("(handleNewLog) newLog:", newLog, ", selection:", selection);
      console.log(
        "newLog.nativeEvent.view.location.search:",
        newLog.nativeEvent.view.location.search
      );
      const locSearch = newLog.nativeEvent.view.location.search;
      let logPrefix = null;
      if (locSearch) {
        let logParam = locSearch.split(/[\\?\\&]log=/)[1].split(/[\\?\\&]/)[0];
        let logParamArray = logParam.split("://");
        logPrefix =
          logParamArray[0] +
          "://" +
          logParamArray[1].split("/").slice(0, 4).join("/");
        console.log("logPrefix:", logPrefix);
      }
      resetCounts();
      if (selection.substring(0, 1) === "/") {
        if (logPrefix) {
          getLog(logPrefix + selection);
          setSelection(logPrefix + selection); // added
        } else {
          console.log("webDavPrefix:", webDavPrefix);
          getLog(webDavPrefix + selection);
          setSelection(webDavPrefix + selection); // added
        }
      } else {
        getLog(selection);
      }
      document.title = selection.split("/").pop();
    },
    openInNewTab = (url) => {
      const win = window.open(url, "_blank");
      win.focus();
    },
    processDirectory = (dirPassed) => {
      if (mode === "local") {
        readLocalFiles(dirPassed || logDirectory);
      } else {
        setWaitGetDir(true);
        getLogWebDav(dirPassed || logDirectory);
      }
    },
    [showSource, setShowSource] = useState(true),
    [showMacroLines, setShowMacroLines] = useState(true),
    [selection, setSelection] = useState(""),
    [selectedLog, setSelectedLog] = useState(null),
    [links, setLinks] = useState(null),
    [waitGetDir, setWaitGetDir] = useState(false),
    [waitSelectLog, setWaitSelectLog] = useState(false),
    [useMaxWidth] = useState(true),
    { href } = window.location,
    mode = href.startsWith("http://localhost") ? "local" : "remote",
    [rulesDirectory, setRulesDirectory] = useState(
      navigator.platform.startsWith("Win") && mode === "remote"
        ? "/general/biostat/apps/logviewer/rules"
        : navigator.platform.startsWith("Win") && mode === "local"
        ? "C:/github/logviewer/src"
        : "/Users/philipmason/github/logviewer/src"
    ),
    [listOfRules, setListOfRules] = useState([]),
    [openRulesMenu, setOpenRulesMenu] = useState(false),
    handleCloseRulesMenu = (item) => {
      console.log(item);
      const url =
        mode === "local"
          ? "http://localhost:3001/getfile/%2f" +
            encodeURIComponent(rulesDirectory) +
            "%2F" +
            item
          : item;
      fetch(url).then(function (response) {
        response.text().then(function (text) {
          const tempRules = JSON.parse(text);
          console.log(
            `${tempRules.length} rules were read from rules file: ${url}`
          );
          setRules([...tempRules, ...requiredRules]);
        });
      });
      setOpenRulesMenu(false);
    },
    [logDirectory, setLogDirectory] = useState(
      "/general/biostat/jobs/gadam_ongoing_studies/dev/logs/"
    ),
    getLogWebDav = async (dir) => {
      await getDir(webDavPrefix + dir, 1, processLogXml);
      setWaitGetDir(false);
    },
    getRulesWebDav = async (dir) => {
      await getDir(webDavPrefix + dir, 1, processRulesXml);
      setWaitGetDir(false);
    },
    getLogVersions = async (dir) => {
      await getVersions(webDavPrefix + dir, processRulesXml);
      setWaitGetDir(false);
    },
    ColDefnRules = [
      { field: "id", headerName: "ID", width: 90, hide: true },
      { field: "type", headerName: "type", width: 80 },
      { field: "ruleType", headerName: "ruleType", width: 80 },
      { field: "caseInsensitive", headerName: "Case Insensitive", width: 50 },
      { field: "startswith", headerName: "startswith", width: 100 },
      { field: "regex", headerName: "regex", width: 400 },
      { field: "prefix", headerName: "prefix", width: 400 },
      { field: "suffix", headerName: "suffix", width: 90 },
      { field: "anchor", headerName: "anchor", width: 50 },
      { field: "linkColor", headerName: "linkColor", width: 50 },
      { field: "interesting", headerName: "interesting", width: 50 },
      { field: "substitute", headerName: "substitute", width: 50 },
    ],
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
    [searchField, setSearchField] = useState(null),
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
    processLogXml = (responseXML) => {
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
    processRulesXml = (responseXML) => {
      // Here you can use the Data
      let dataXML = responseXML;
      let dataJSON = xmlToJson(dataXML.responseXML);
      const rules = dataJSON["d:multistatus"]["d:response"].map((record) => {
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
          partOfRule = {
            value: urlPrefix + path,
            fileType: fileType,
            label: name + " [" + modified.trim() + "]",
            created: created,
            modified: modified,
            checkedOut: checkedOut,
            locked: locked,
            version: version,
          };
        return partOfRule;
      });
      setListOfRules(
        rules
          .filter((rule) => rule !== null && rule.fileType === "json")
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
    [analyseAgain, setAnalyseAgain] = useState(null),
    analyseLog = (n, logText) => {
      console.log("analyseLog - n=", n);
      // extracts info for tables in the bottom left of screen
      const logArray = logText.split("\n"),
        tempMprint = {},
        tempMlogic = {},
        tempSymbolgen = {};
      logArray.forEach((line, lineNumber) => {
        if (shiftLineSpaces) line = line.substring(shiftLineSpaces);
        // Inputs
        if (line.startsWith("NOTE: There were ")) {
          const split = line.split(" "),
            obs = split[3],
            dset = split[10],
            libname = dset.split(".")[0],
            dataset = dset.split(".")[1],
            link = lineNumber;
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
            link = lineNumber;
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
            link = lineNumber;
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
            link = lineNumber,
            // link = lineNumberToLink.filter(
            //   (link) => link.lineNumber === lineNumber
            // )[0].id,
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
            link = lineNumber;

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
        if (/\breal time\b\s+\d/i.test(line)) {
          const split = line.split(" "),
            len = split.length,
            time = split[len - 2],
            units = split[len - 1],
            hms = time.split(":"),
            countColons = hms.length - 1,
            seconds =
              countColons === 2
                ? +hms[0] * 60 * 60 + +hms[1] * 60 + +hms[2]
                : countColons === 1
                ? +hms[0] * 60 + +hms[1]
                : Number.parseFloat(time),
            link = lineNumber;
          tempRealTime.push({
            id: lineNumber,
            time: time,
            units: units,
            seconds: seconds,
            lineNumber: lineNumber,
            link: link,
          });
        }
        if (/\bcpu time\b\s+\d/i.test(line)) {
          const split = line.split(" "),
            len = split.length,
            time = split[len - 2],
            units = split[len - 1],
            hms = time.split(":"),
            countColons = hms.length - 1,
            seconds =
              countColons === 2
                ? +hms[0] * 60 * 60 + +hms[1] * 60 + +hms[2]
                : countColons === 1
                ? +hms[0] * 60 + +hms[1]
                : Number.parseFloat(time),
            link = lineNumber;
          tempCpuTime.push({
            id: lineNumber,
            time: time,
            units: units,
            seconds: seconds,
            lineNumber: lineNumber,
            link: link,
          });
        }
        if (/\buser cpu time\b\s+\d/i.test(line)) {
          const split = line.split(" "),
            len = split.length,
            time = split[len - 2],
            units = split[len - 1],
            // time = split[15],
            // units = split[16],
            hms = time.split(":"),
            countColons = hms.length - 1,
            seconds =
              countColons === 2
                ? +hms[0] * 60 * 60 + +hms[1] * 60 + +hms[2]
                : countColons === 1
                ? +hms[0] * 60 + +hms[1]
                : Number.parseFloat(time),
            link = lineNumber;
          tempCpuTime.push({
            id: lineNumber,
            time: time,
            units: units,
            seconds: seconds,
            lineNumber: lineNumber,
            link: link,
          });
        }
        if (/\bsystem time\b\s+\d/i.test(line)) {
          const split = line.split(" "),
            len = split.length,
            time = split[len - 2],
            units = split[len - 1],
            //   time = split[13],
            // units = split[14],
            hms = time.split(":"),
            countColons = hms.length - 1,
            seconds =
              countColons === 2
                ? +hms[0] * 60 * 60 + +hms[1] * 60 + +hms[2]
                : countColons === 1
                ? +hms[0] * 60 + +hms[1]
                : Number.parseFloat(time),
            link = lineNumber;
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
      console.log("all", all);
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
          obs: i.obs || "?",
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
            const seconds = stepInfo.length > 0 ? stepInfo[0].seconds : null,
              obs = item.obs ? item.obs.toLocaleString() : null,
              arrowLabel = lineVar === "obs" ? obs : seconds;
            dot.push(
              item.i +
                "([" +
                item.i +
                "]) --> |" +
                arrowLabel +
                "| " +
                o.table +
                "[[" +
                o.table +
                "]]"
            );
          });
        }
      });
      const uniqueDot = [...new Set(dot)],
        dir = direction ? "TB" : "LR",
        mermaid = `flowchart ${dir}\n${uniqueDot.join("\n")}`;
      setChart(mermaid);
      setMermaidInfo({ characters: mermaid.length, lines: uniqueDot.length });
    },
    updateRules = () => {
      rules.forEach((rule) => {
        // Compile text regular expressions into usable ones
        if (rule.ruleType === "regex") {
          if ("caseInsensitive" in rule && rule.caseInsensitive === false)
            rule.regularExpression = new RegExp(rule.regex);
          else rule.regularExpression = new RegExp(rule.regex, "i"); // i means case insensitive
        }
      });
      const rulesToProcess = rules.filter(
          (item) => item.type !== null && item.anchor
        ),
        tempUniqueTypes = [...new Set(rulesToProcess.map((item) => item.type))];
      setUniqueTypes(tempUniqueTypes);
      counts = {};
      console.log("tempUniqueTypes", tempUniqueTypes);
    },
    makeDirListing = (dirsArray) => {
      if (dirsArray === null) return;
      console.log("dirsArray", dirsArray);
      const obj = dirsArray.map((dir, i) => {
        return (
          <Box
            key={dir + i}
            sx={{ color: "blue" }}
            onClick={() => {
              readLocalFiles(logDirectory + "/" + dir);
            }}
          >
            {dir}
          </Box>
        );
      });
      console.log("obj", obj);
      setDirListing(obj);
    },
    readLocalFiles = (localDir) => {
      if (mode === "local") {
        const dir = encodeURIComponent(localDir),
          url = "http://localhost:3001/dir/" + dir;
        setLogDirectory(decodeURIComponent(dir));
        console.log("url", url);
        fetch(url).then(function (response) {
          console.log(response);
          response.text().then(function (text) {
            const dirObject = JSON.parse(text);
            const { dirs, files } = dirObject;
            console.log(
              "dirObject",
              dirObject,
              "localDir",
              localDir,
              "dirs",
              dirs,
              "files",
              files,
              "text",
              text
            );
            setSelectedLog(null);
            setListOfDirs(dirs);
            makeDirListing(dirs);
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
      }
    },
    previousSearchTerm = () => {
      const found = logText
          .substring(0, currentLine ? currentLine - 1 : nLines - 1)
          .lastIndexOf(search),
        id1 = logText.substring(0, found).lastIndexOf("id=") + 4,
        section = logText.substring(id1, found),
        id = /\d+/.exec(section);
      // { current } = logRef;
      window.location.hash = "#" + id;
      if (found > 0) setCurrentLine(found);
      else setCurrentLine(nLines - 1);
    },
    nextSearchItem = () => {
      const found = logText.indexOf(search, currentLine ? currentLine + 1 : 0),
        id1 = logText.substring(0, found).lastIndexOf("id=") + 4,
        section = logText.substring(id1, found),
        id = /\d+/.exec(section);
      // { current } = logRef;
      window.location.hash = "#" + id;
      if (found > 0) setCurrentLine(found);
      else setCurrentLine(0);
    },
    [shiftLineSpaces, setShiftLineSpaces] = useState(null);
  let counts = {};

  // update when rules change
  useEffect(() => {
    console.log("*** rules", rules.length);
    updateRules();
    // eslint-disable-next-line
  }, [rules]);

  // when uniqueTypes changes, run this to update associated data structures
  useEffect(() => {
    if (!uniqueTypes) return;
    console.log("*** uniqueTypes", uniqueTypes);
    const tempBadgeCount = {},
      tempCheck = {};
    uniqueTypes.forEach((type) => {
      tempBadgeCount[type] = 0;
      tempCheck[type] = true;
    });
    setBadgeCount(tempBadgeCount);
    setCheck(tempCheck);
    setAnalyseAgain(!analyseAgain);
    console.log("*1*");
    setLogText(logOriginalText);
    // eslint-disable-next-line
  }, [uniqueTypes]);

  // analyse text again using current rules, if the flag is set true
  useEffect(() => {
    if (
      !logOriginalText ||
      analyseAgain === false ||
      analyseAgain === null ||
      mode === "local"
    )
      return;
    console.log("*** analyseAgain", analyseAgain, logOriginalText.length);
    analyseLog(4, logOriginalText); // populate tables in bottom left of screen
    analyse(4, logOriginalText);
    // eslint-disable-next-line
  }, [analyseAgain, logOriginalText]);

  // change whether we show line numbers in log
  useEffect(() => {
    if (logOriginalText === null || showLineNumbers === null) return;
    console.log("*** showLineNumbers", showLineNumbers);
    analyse(5, logOriginalText);
    // eslint-disable-next-line
  }, [showLineNumbers]);

  useEffect(() => {
    console.log("*** href", href);
    document.title = "Log Viewer";
    const splitQuestionMarks = href.split("?");
    console.log("splitQuestionMarks", splitQuestionMarks);
    // if a log was passed in then extract log and logDir
    if (splitQuestionMarks.length > 1 && href.includes("log=")) {
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
      document.title = logFileName.split("#")[0];
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
      console.log("logDir", logDir);
      setLogDirectory("/" + logDir);
    } else if (splitQuestionMarks.length > 1 && href.includes("paste=")) {
      const paste = splitQuestionMarks[1].split("=");
      if (paste[1] === "1") {
        setTimeout(() => {
          pasteClipboard();
        }, 1000);
      }
    } else if (
      splitQuestionMarks.length > 1 &&
      href.includes("shiftlinespaces=")
    ) {
      const ls = splitQuestionMarks[1].split("=");
      console.log("ls", ls);
      setShiftLineSpaces(ls[1]);
    }
    // eslint-disable-next-line
  }, [href]);

  useEffect(() => {
    console.log("*** windowDimension", windowDimension);
    window.addEventListener("resize", detectSize);
    return () => {
      window.removeEventListener("resize", detectSize);
    };
  }, [windowDimension]);

  // for remote mode
  useEffect(() => {
    if (mode !== "remote") return;
    getRulesWebDav(rulesDirectory); // get the list of rules by reading directory
    const splitQuestionMarks = href.split("?");
    if (splitQuestionMarks.length > 1) return; // handled in href section since we have a log specified in URL
    console.log("*** remote");
    const defaultDirectory = navigator.platform.startsWith("Win")
      ? "/general/biostat/jobs/dashboard/dev/logs"
      : "/Users/philipmason/github/logviewer/tests";
    setLogDirectory(defaultDirectory);
    getLogWebDav(defaultDirectory); // get the list of logs by reading directory
    analyseLog(6, logOriginalText); // populate tables in bottom left of screen
    analyse(6, logOriginalText);
    // eslint-disable-next-line
  }, []);

  // for local mode
  // - get the list of logs by reading directory
  // - get the list of rules by reading directory
  useEffect(() => {
    if (mode !== "local") return;
    const splitQuestionMarks = href.split("?");
    if (splitQuestionMarks.length > 1) return; // handled in href section since we have a log specified in URL
    console.log("*** local");
    const defaultDirectory = navigator.platform.startsWith("Win")
      ? "C:/github/logviewer/tests"
      : "/Users/philipmason/github/logviewer/tests";
    setLogDirectory(defaultDirectory);
    readLocalFiles(defaultDirectory);

    const dir = encodeURIComponent(rulesDirectory),
      url = "http://localhost:3001/dir/" + dir;
    console.log("url", url);
    setRulesDirectory(decodeURIComponent(dir));
    fetch(url).then(function (response) {
      response.text().then(function (text) {
        const dirObject = JSON.parse(text);
        const files = dirObject,
          dirs = null;
        console.log("dirs", dirs, "files", files);
        setListOfRules(
          files.files
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
    if (selectedLocalFile === "") return;
    console.log("*** selectedLocalFile", selectedLocalFile);
    const file = selectedLocalFile.split("/").pop(),
      dir = encodeURIComponent(logDirectory),
      url = "http://localhost:3001/getfile/" + dir + "/" + file;
    console.log(url);
    setLocalUrl(url);
    fetch(url).then((response) => {
      response.text().then((text) => {
        console.log(`${text.length} characters were read from file ${url}`);
        setLogOriginalText(text);
        setLogText(text);
        analyseLog(7, text); // populate tables in bottom left of screen
        analyse(7, text);
      });
    });
    // eslint-disable-next-line
  }, [selectedLocalFile]);

  myWorker.onmessage = (m) => {
    console.log("===================> msg from worker: ", m);

    // get the info sent back from worker and display on the screen
    const { tempLinks, progress_pct, counts, html, elapsed } = m.data;

    setLinks(tempLinks);
    setProgress(progress_pct);

    if (uniqueTypes) {
      uniqueTypes.forEach((type) => {
        badgeCount[type] = counts[type];
      });
    } else {
      Object.keys(counts).forEach((type) => {
        badgeCount[type] = counts[type];
      });
    }

    const modified = html
      .map((h, hid) => {
        let extra = "";
        if (showLineNumbers) extra = zeroPad(hid, 7) + "|" + h;
        if (h !== null) return `<span id="${hid}">` + extra + h + "</span>";
        return null;
      })
      .filter((element) => element != null);
    // const newText = logText + modified.join("\n");
    setLogText((currentLogText) => {
      if (currentLogText === null || currentLogText === "null")
        modified.join("\n");
      else return currentLogText + modified.join("\n");
    });
    setProcessingTime(elapsed);
  };

  useEffect(() => {
    if (showSource === null && showMacroLines === null) return;
    console.log(
      "*** showSource, showMacroLines, selectionModel",
      showSource,
      showMacroLines,
      selectionModel
    );
    const tempMacrosSelected = [];
    selectionModel.forEach((item) => {
      tempMacrosSelected.push(mprint[item - 1].name);
    });
    setMacrosSelected(tempMacrosSelected);
    // eslint-disable-next-line
  }, [showSource, showMacroLines, selectionModel]);

  return (
    <Box>
      <AppBar position="static">
        <Toolbar
          variant="dense"
          disableGutters
          sx={{ backgroundColor: "#f7f7f7" }}
        >
          <Tooltip title="Move center to the left">
            <IconButton
              size="small"
              sx={{
                mr: iconPadding,
              }}
              onClick={() => {
                setLeftPanelWidth(Math.max(leftPanelWidth - 3, 0));
                setRightPanelWidth(Math.min(rightPanelWidth + 3, 12));
              }}
            >
              <ArrowCircleLeft />
            </IconButton>
          </Tooltip>
          <Tooltip title="Reset to middle">
            <IconButton
              size="small"
              sx={{
                mr: iconPadding,
              }}
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
              size="small"
              sx={{
                mr: iconPadding,
              }}
              onClick={() => {
                setLeftPanelWidth(Math.min(leftPanelWidth + 3, 12));
                setRightPanelWidth(Math.max(rightPanelWidth - 3, 0));
              }}
            >
              <ArrowCircleRight />
            </IconButton>
          </Tooltip>
          <Tooltip title="Smaller">
            <IconButton
              size="small"
              sx={{
                mr: iconPadding,
              }}
              onClick={() => {
                setFontSize(fontSize - 1);
              }}
            >
              <Remove />
            </IconButton>
          </Tooltip>
          <Tooltip title="Reset to 12">
            <IconButton
              size="small"
              sx={{
                mr: iconPadding,
              }}
              onClick={() => {
                setFontSize(12);
              }}
            >
              <RestartAlt />
            </IconButton>
          </Tooltip>
          <Tooltip title="Larger">
            <IconButton
              size="small"
              sx={{
                mr: iconPadding,
              }}
              onClick={() => {
                setFontSize(fontSize + 1);
              }}
            >
              <Add />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download SAS Log">
            <IconButton
              size="small"
              sx={{
                mr: iconPadding,
              }}
              onClick={() => {
                openInNewTab(`${selection}`);
              }}
            >
              <Download />
            </IconButton>
          </Tooltip>
          <Tooltip title="Show Source Lines">
            <FormControlLabel
              sx={{
                mr: iconPadding,
                ml: iconPadding,
              }}
              control={
                <Switch
                  checked={showSource}
                  onChange={() => {
                    setShowSource(!showSource);
                    setAnalyseAgain(!analyseAgain);
                    console.log("*2*");
                  }}
                  name="source"
                  size="small"
                  color="info"
                />
              }
            />
          </Tooltip>
          <Tooltip title="Show Mprint/Mlogic/Symbolgen/Mautocomploc Lines">
            <FormControlLabel
              sx={{
                mr: iconPadding,
                ml: iconPadding,
              }}
              control={
                <Switch
                  checked={showMacroLines}
                  onChange={() => {
                    setShowMacroLines(!showMacroLines);
                    setAnalyseAgain(!analyseAgain);
                    console.log("*3*");
                  }}
                  name="mprint"
                  size="small"
                  color="info"
                  sx={{ ml: 0.5 }}
                />
              }
            />
          </Tooltip>
          <Tooltip title="Show Line numbers">
            <FormControlLabel
              sx={{
                mr: iconPadding,
                ml: iconPadding,
              }}
              control={
                <Switch
                  checked={showLineNumbers}
                  onChange={() => {
                    setShowLineNumbers(!showLineNumbers);
                  }}
                  name="mprint"
                  size="small"
                  color="info"
                  sx={{ ml: 0.5, mr: 0.5 }}
                />
              }
            />
          </Tooltip>
          <Tooltip title="Show Chart">
            <IconButton
              size="small"
              onClick={() => setOpenModal(true)}
              sx={{
                mr: iconPadding,
                ml: iconPadding,
              }}
            >
              <BarChart />
            </IconButton>
          </Tooltip>
          <Tooltip title="Choose rules used to parse logs">
            <IconButton
              size="small"
              sx={{
                mr: iconPadding,
              }}
              onClick={(e) => {
                setAnchorEl(e.currentTarget);
                setOpenRulesMenu(true);
              }}
            >
              <SquareFoot />
            </IconButton>
          </Tooltip>
          <Tooltip title="View rules">
            <IconButton
              size="small"
              sx={{
                mr: iconPadding,
              }}
              onClick={(e) => {
                setOpenRulesModal(true);
              }}
            >
              <Visibility />
            </IconButton>
          </Tooltip>
          <Tooltip title="Extract SAS code (if possible)">
            <IconButton
              size="small"
              sx={{
                mr: iconPadding,
              }}
              onClick={(e) => {
                extractSasCode();
              }}
            >
              <Colorize />
            </IconButton>
          </Tooltip>
          <Tooltip title="Paste Clipboard as new contents of Log">
            <IconButton
              size="small"
              sx={{
                mr: iconPadding,
              }}
              onClick={(e) => {
                pasteClipboard();
              }}
            >
              <ContentPaste />
            </IconButton>
          </Tooltip>
          <Tooltip title="Email">
            <IconButton
              onClick={() => {
                const email =
                  "mailto:qs_tech_prog@argenx.com?subject=Log Viewer: " +
                  selection +
                  "&body=You can open the log in the Log Viewer using this link: " +
                  encodeURIComponent(href);
                console.log("email", email);
                window.open(email, "_blank");
              }}
              size="small"
              sx={{
                mr: iconPadding,
              }}
            >
              <Email />
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh view by analysing the log again">
            <IconButton
              size="small"
              sx={{
                mr: iconPadding,
              }}
              onClick={(e) => {
                setAnalyseAgain(!analyseAgain);
                console.log("*4*");
              }}
            >
              <Refresh />
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
                  key={"k" + id}
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
              sx={{
                mr: iconPadding,
              }}
            >
              <Compress />
            </IconButton>
          </Tooltip>
          <Tooltip title={`Expand by ${increment}`}>
            <IconButton
              size="small"
              onClick={() => {
                setVerticalSplit(verticalSplit - increment);
              }}
              sx={{
                mr: iconPadding,
              }}
            >
              <Expand />
            </IconButton>
          </Tooltip>
          <Tooltip title="Page Down">
            <IconButton
              size="small"
              sx={{
                mr: iconPadding,
              }}
              onClick={() => {
                const clientHeight = logRef.current.clientHeight;
                logRef.current.scrollBy(0, clientHeight - 20);
              }}
            >
              <ArrowDownward />
            </IconButton>
          </Tooltip>
          <Tooltip title="Page Up">
            <IconButton
              size="small"
              sx={{
                mr: iconPadding,
              }}
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
              size="small"
              onClick={() => {
                const interesting = links.filter(
                  (link) => link.interesting && link.lineNumber > currentLine
                );
                if (interesting.length > 0) {
                  jumpTo(interesting[0].id);
                  setCurrentLine(interesting[0].lineNumber);
                }
              }}
              sx={{
                color: "blue",
                mr: iconPadding,
              }}
            >
              <ArrowDownward />
            </IconButton>
          </Tooltip>
          <Tooltip title="Previous Interesting thing">
            <IconButton
              size="small"
              sx={{
                color: "blue",
                mr: iconPadding,
              }}
              onClick={() => {
                const interesting = links.filter(
                  (link) => link.interesting && link.lineNumber < currentLine
                );
                if (interesting.length > 0) {
                  const last = interesting.pop();
                  jumpTo(last.id);
                  setCurrentLine(last.lineNumber);
                }
              }}
            >
              <ArrowUpward />
            </IconButton>
          </Tooltip>
          <Tooltip title="Next Error">
            <IconButton
              size="small"
              sx={{
                color: "red",
                mr: iconPadding,
              }}
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
              <ArrowDownward />
            </IconButton>
          </Tooltip>
          <Tooltip title="Previous Error">
            <IconButton
              size="small"
              sx={{
                color: "red",
                mr: iconPadding,
              }}
              onClick={() => {
                const errors = links.filter(
                  (link) =>
                    link.type === "ERROR" && link.lineNumber < currentLine
                );
                if (errors.length > 0) {
                  const last = errors.pop();
                  jumpTo(last.id);
                  setCurrentLine(last.lineNumber);
                }
              }}
            >
              <ArrowUpward />
            </IconButton>
          </Tooltip>
          <Tooltip title="Next Warning">
            <IconButton
              size="small"
              sx={{
                color: "green",
                mr: iconPadding,
              }}
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
              <ArrowDownward />
            </IconButton>
          </Tooltip>
          <Tooltip title="Previous Warning">
            <IconButton
              size="small"
              sx={{
                color: "green",
                mr: iconPadding,
              }}
              onClick={() => {
                const warnings = links.filter(
                  (link) =>
                    link.type === "WARN" && link.lineNumber < currentLine
                );
                if (warnings.length > 0) {
                  const last = warnings.pop();
                  jumpTo(last.id);
                  setCurrentLine(last.lineNumber);
                }
              }}
            >
              <ArrowUpward />
            </IconButton>
          </Tooltip>
          <TextField
            label="Search"
            value={search ?? ""}
            size={"small"}
            inputProps={{ style: { fontSize: 10, height: "1.1em" } }}
            onChange={(event) => {
              setSearch(event.target.value);
            }}
            inputRef={(input) => input && setSearchField(input)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                nextSearchItem();
                setTimeout(() => {
                  searchField.focus();
                }, 100);
              }
            }}
            color="secondary"
            sx={{
              flexGrow: 1,
              mt: 0.6,
              mr: 1,
              ml: 1,
            }}
          />
          <Tooltip title="Next search term">
            <IconButton
              size="small"
              sx={{
                color: "purple",
                mr: iconPadding,
              }}
              onClick={nextSearchItem}
            >
              <ArrowDownward />
            </IconButton>
          </Tooltip>
          <Tooltip title="Previous search term">
            <IconButton
              size="small"
              sx={{
                color: "purple",
                mr: iconPadding,
              }}
              onClick={previousSearchTerm}
            >
              <ArrowUpward />
            </IconButton>
          </Tooltip>{" "}
          <Tooltip title="Information about this screen">
            <IconButton
              size="small"
              onClick={() => {
                setOpenInfo(true);
              }}
              sx={{
                mr: iconPadding,
              }}
            >
              <Info />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Grid container spacing={1}>
        <Grid item xs={leftPanelWidth} sx={{ mt: 0.5 }}>
          {logDirectory ? (
            <TextField
              id="logDirectory"
              label="Directory containing logs"
              value={logDirectory ?? ""}
              size={"small"}
              onChange={(e) => setLogDirectory(e.target.value)}
              inputProps={{ style: { fontSize: 14 } }}
              sx={{
                width: (windowDimension.winWidth * leftPanelWidth) / 12 - 200,
                mt: 1,
                ml: 1,
              }}
            />
          ) : null}
          {!waitGetDir ? (
            <Tooltip title="Go up to parent directory">
              <IconButton
                size="small"
                onClick={() => {
                  const parentDir = logDirectory
                    .split("/")
                    .slice(0, -1)
                    .join("/");
                  if (mode === "local") {
                    readLocalFiles(parentDir);
                    setLogText("");
                    setLogDirectory(parentDir);
                  } else {
                    setWaitGetDir(true);
                    setLogDirectory(parentDir);
                    getLogWebDav(parentDir);
                  }
                }}
                sx={{ mt: 1, color: "green" }}
              >
                <Publish fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : null}
          {!waitGetDir ? (
            <Tooltip title="Read directory and show a list of logs to select from">
              <Button
                id="readDirectory"
                onClick={() => {
                  processDirectory();
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
              placeholder={
                listOfLogs.length > 0
                  ? "Choose a log (" + listOfLogs.length + " found)"
                  : "No logs found"
              }
              options={listOfLogs}
              value={selectedLog}
              onChange={selectLog}
              styles={selectStyles}
            />
          ) : null}
          {waitSelectLog ? <CircularProgress sx={{ ml: 9, mt: 2 }} /> : null}
        </Grid>
        <Grid item xs={rightPanelWidth} sx={{ mt: 0.5 }}>
          <Box
            variant={"dense"}
            sx={{
              bgcolor: "background.paper",
              color: "text.secondary",
            }}
          >
            <TextField
              label="Log Name"
              value={selection ?? ""}
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
                  getLogVersions(logDirectory);
                }}
                sx={{ mt: 1, color: "green" }}
              >
                <Download fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          {program && <b>Program:</b>} {program} &nbsp;{" "}
          {submitted && <b>Submitted:</b>} {submitted} &nbsp;{" "}
          {submitEnd && <b>Ended:</b>} {submitEnd} &nbsp;{" "}
          {nLines && <b>Lines:</b>} {nLines} &nbsp;{" "}
          {processingTime && <b>Analysed:</b>} {processingTime}
          {progress && <LinearProgressWithLabel value={progress} />}
        </Grid>
        <Grid item xs={leftPanelWidth}>
          {uniqueTypes &&
            // uniqueTypes.length === badgeCount.length &&
            uniqueTypes.map((t) => {
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
              border: 0.5,
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
                    <React.Fragment key={"frag" + id}>
                      {showLineNumbers ? zeroPad(link.lineNumber, 7) + " " : ""}
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
              setTabValue(newValue);
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
          {dirListing}
          {logText && (
            <Box
              placeholder="Empty"
              sx={{
                border: 2,
                fontSize: fontSize,
                fontFamily: "courier",
                maxHeight: windowDimension.winHeight - 42 * verticalSplit,
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
          {!logText && listOfDirs ? (
            listOfDirs.map((dir, id) => {
              return (
                <Box
                  key={"dir" + id}
                  onClick={() => {
                    setLogDirectory(logDirectory + "/" + dir);
                    processDirectory(logDirectory + "/" + dir);
                  }}
                  sx={{ color: "blue", cursor: "pointer" }}
                >
                  {dir}
                </Box>
              );
            })
          ) : !logText ? (
            <Box sx={{ m: 10, fontSize: 20, color: "red" }}>
              Log will be displayed here.
            </Box>
          ) : null}
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
              <Tooltip title={`Zoom in`}>
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
                <Tooltip title={`Copy Mermaid Code`}>
                  <Chip
                    label={mermaidInfo.lines.toLocaleString() + " lines"}
                    sx={{
                      fontSize: 12,
                      float: "right",
                    }}
                    onClick={() => {
                      navigator.clipboard.writeText(chart);
                    }}
                  />
                </Tooltip>
              )}
              {mermaidInfo.characters && (
                <Tooltip title={`Copy Mermaid Code and open a mermaid editor`}>
                  <Chip
                    label={
                      mermaidInfo.characters.toLocaleString() + " characters"
                    }
                    sx={{
                      fontSize: 12,
                      float: "right",
                    }}
                    onClick={() => {
                      navigator.clipboard.writeText(chart);
                      setTimeout(function () {
                        window.open("https://mermaid.live/");
                      }, 500);
                    }}
                  />
                </Tooltip>
              )}
            </DialogTitle>
            <DialogContent
              sx={{
                transform: `scale(${scale})`,
                transformOrigin: "0% 0% 0px;",
                width: Math.round(windowDimension.winWidth / scale) - 50,
              }}
            >
              <Mermaid chart={chart} useMaxWidth={useMaxWidth} />
            </DialogContent>
          </Dialog>
          <Dialog
            fullScreen
            open={openRulesModal}
            onClose={handleCloseRulesModal}
          >
            <DialogTitle>Rules Admin</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Table will be editable soon. New rules will be able to be added
                too.
              </DialogContentText>
              {rules && (
                <DataGridPro
                  rows={rules.map((rule, id) => {
                    return { id: id, ...rule };
                  })}
                  rowHeight={rowHeight}
                  columns={ColDefnRules}
                  density="compact"
                  hideFooter={true}
                  sx={{
                    height: windowDimension.winHeight - 100,
                    fontWeight: "fontSize=5",
                    fontSize: "0.7em",
                  }}
                  // onRowClick={(e) => {
                  //   window.location.hash = e.row.link;
                  // }}
                  // components={{ Toolbar: GridToolbar }}
                />
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseRulesModal}>Cancel</Button>
              <Button
                onClick={() => {
                  alert("coming soon");
                }}
              >
                Add a new rule
              </Button>
            </DialogActions>
          </Dialog>
        </Grid>
      </Grid>
      {/* Dialog with General info about this screen */}
      <Dialog
        fullWidth
        maxWidth="xl"
        onClose={() => setOpenInfo(false)}
        open={openInfo}
      >
        <DialogTitle>Info about this screen</DialogTitle>
        <DialogContent>
          <ul>
            <li>
              <a
                href="https://github.com/argenxQuantitativeSciences/logviewer"
                target="_blank"
                rel="noreferrer"
              >
                App source code
              </a>{" "}
              {" - "}code for this app is held on GitHub.
            </li>
            <li>
              <a
                href={`https://argenxbvba.sharepoint.com/sites/Biostatistics/_layouts/15/doc.aspx?sourcedoc={ca0a4288-847f-4f24-8829-c17c1611c347}`}
                target="_blank"
                rel="noreferrer"
              >
                Log Analysis at argenx
              </a>
              {" - "}this document gives an overview and explains what is
              available for viewing logs at argenx.
            </li>

            <li>
              <a
                href={`https://argenxbvba.sharepoint.com/sites/Biostatistics/_layouts/15/doc.aspx?sourcedoc=%7be15cda2c-7a82-4301-b1bf-8fbaec90b5b0%7d`}
                target="_blank"
                rel="noreferrer"
              >
                Log Viewer User Guide
              </a>
              {" - "}this document explains more about how to use this Log
              Viewer web application.
            </li>
            <li>
              <a
                href={`https://argenxbvba.sharepoint.com/:p:/r/sites/Biostatistics/Shared%20Documents/STAR%20processes/Checking%20your%20SAS%20log.pptx?d=w234104b39bfb408caaef918708059768&csf=1&web=1&e=xAb0I9`}
                target="_blank"
                rel="noreferrer"
              >
                Checking your SAS log
              </a>
              {" - "}take a look at this presentation that explains how log
              checking works with the log viewer or SAS macro which both use
              JSON files with rules defined.
            </li>
          </ul>
          Direction of Chart -
          <Tooltip title="Toggle diagram direction">
            <FormControlLabel
              sx={{
                borderRadius: 7,
                backgroundColor: "#cccccc",
                mr: iconPadding,
                ml: iconPadding,
              }}
              control={
                <Switch
                  checked={direction}
                  onChange={() => {
                    setDirection(!direction);
                  }}
                  name="direction"
                  size="small"
                  color="warning"
                  sx={{ ml: 0.5, mr: 0.5 }}
                />
              }
              label={direction ? "Left to Right." : "Top to Bottom."}
            />
          </Tooltip>
          <Autocomplete
            value={lineVar}
            onChange={(event, newValue) => {
              setLineVar(newValue);
            }}
            // inputValue={inputValue}
            // onInputChange={(event, newInputValue) => {
            //   setInputValue(newInputValue);
            // }}
            size="small"
            id="lineVarId"
            options={lineVarOptions}
            sx={{ width: 300, mt: 2 }}
            renderInput={(params) => (
              <TextField {...params} label="Choose measurement for lines" />
            )}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default App;
