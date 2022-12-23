import React, { useState, useEffect } from "react";
import "./App.css";
import {
  Box,
  Grid,
  Typography,
  Tooltip,
  IconButton,
  FormControlLabel,
  Checkbox,
  Paper,
  Switch,
} from "@mui/material";
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
// import listOfLogs from "./logs.json";
import rules from "./rules.json";
// import { Routes, Route, useNavigate } from "react-router-dom";

function App() {
  const [logText, setLogText] = useState(null),
    getLog = (url) => {
      fetch(url).then(function (response) {
        response.text().then(function (text) {
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
    analyse = (text) => {
      let id = 0;
      const lines = text.split("\n"),
        tempLinks = [],
        html = lines.map((element) => {
          // if (/^\W(\d+)\s+The SAS System\s+/.test(element)) return null;
          // TODO: fix next line
          if (/The SAS System/.test(element)) return null;
          if (!showSource && /^(\d+ )/.test(element)) return null;
          if (!showMprint && element.startsWith("MPRINT(")) return null;
          let preparedToReturn = element;
          rules.forEach((rule) => {
            // console.log("rule", rule);
            if (element.startsWith(rule.startswith)) {
              id++;
              const tag = rule.prefix,
                prefix = rule.anchor
                  ? tag.substring(0, tag.length - 1) + ` id='${id}'>`
                  : tag;
              if (rule.anchor)
                tempLinks.push({
                  text: element,
                  id: id,
                  linkColor: rule.linkColor,
                  type: rule.type,
                });
              // console.log(prefix);
              preparedToReturn = prefix + preparedToReturn + rule.suffix;
            }
          });
          setLinks(tempLinks);
          return preparedToReturn;
        });
      return html.filter((element) => element != null).join("<br>");
    },
    selectLog = (index) => {
      const { value } = index;
      // eslint-disable-next-line
      getLog(value);
      setSelectedLog(index);
      setSelection(value);
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
    [checkWarn, setCheckWarn] = useState(true),
    changeCheckWarn = (event) => {
      setCheckWarn(event.target.checked);
    },
    [checkError, setCheckError] = useState(true),
    changeCheckError = (event) => {
      setCheckError(event.target.checked);
    },
    [checkNotice, setCheckNotice] = useState(true),
    changeCheckNotice = (event) => {
      setCheckNotice(event.target.checked);
    },
    { href } = window.location,
    // xmlPostRequestString = `<?xml version='1.0' encoding='UTF-8'?>  <d:propfind  xmlns:d='DAV:' xmlns:sc='http://www.sas.com/sas'>     <d:prop>        <d:displayname /> <d:getcontentlength /> <d:getcontenttype />        <d:creationdate/> <d:getlastmodified />  <d:getetag />  <d:getcontenttype />  <d:resourcetype />         <sc:checkedOut />  <sc:locked />   <sc:version />      </d:prop>  </d:propfind>`,
    // parser = new DOMParser(),
    // xmlDoc = parser.parseFromString(xmlPostRequestString, "text/xml"),
    // payload = {
    //   method: "post",
    //   headers: {
    //     Accept: "*/*",
    //     "Content-Type": " application/xml;charset=utf-8",
    //   },
    //   body: xmlDoc,
    // },
    getWebDav = () => {
      getDir(
        "https://xarprod.ondemand.sas.com/lsaf/webdav/repo/general/biostat/jobs/gadam_ongoing_studies/dev/logs/",
        1,
        processXml
      );
    },
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
          partOfLog = {
            value: "https://xarprod.ondemand.sas.com" + path,
            filetype: "log",
            label: name,
          };
        // console.log(
        //   `Path: ${path},  Name: ${name},  Created: ${created},  Last modified: ${modified}, Checked out: ${checkedOut}, Locked: ${locked}, Version: ${version}`
        // );
        return partOfLog;
      });
      setListOfLogs(logs.filter((log) => log !== null));
      console.log("logs", logs);
    };
  // console.log("xmlDoc", xmlDoc, "payload", payload);

  useEffect(() => {
    const parts = href.split("?");
    if (parts.length > 1) {
      const subparts = parts[1].split("=");
      const log = subparts[1];
      console.log("loading log from URL", log, "href", href);
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
    console.log("updating log with switch values");
    getLog(selection);
    // eslint-disable-next-line
  }, [showSource, showMprint]);
  // console.log(leftPanelWidth, rightPanelWidth);

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={leftPanelWidth}>
          <Typography variant="h3" sx={{ color: "green", m: 1 }}>
            Log Viewer
          </Typography>
          <Select
            placeholder="Choose a log"
            options={listOfLogs}
            value={selectedLog}
            onChange={selectLog}
          />
        </Grid>
        <Grid item xs={rightPanelWidth}>
          <Typography variant="h6" sx={{ color: "green", mt: 3 }}>
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
          </Paper>
        </Grid>
        <Grid item xs={leftPanelWidth}>
          <FormControlLabel
            label="Warnings"
            control={
              <Checkbox checked={checkWarn} onChange={changeCheckWarn} />
            }
          />
          <FormControlLabel
            label="Errors"
            control={
              <Checkbox checked={checkError} onChange={changeCheckError} />
            }
          />
          <FormControlLabel
            label="Notice"
            control={
              <Checkbox checked={checkNotice} onChange={changeCheckNotice} />
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
              maxHeight: windowDimension.winHeight - 400,
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
                      >
                        {link.text}
                      </a>
                      <br />
                    </React.Fragment>
                  );
                } else return null;
              })}
          </Box>

          <p />
          <button
            onClick={() => {
              getLog(
                "https://xarprod.ondemand.sas.com/lsaf/webdav/repo/general/biostat/jobs/gadam_ongoing_studies/dev/logs/job_gadam_ongoing_studies.log?version=120.0"
              );
              setSelection(
                "https://xarprod.ondemand.sas.com/lsaf/webdav/repo/general/biostat/jobs/gadam_ongoing_studies/dev/logs/job_gadam_ongoing_studies.log?version=120.0"
              );
            }}
          >
            LSAF version of a log
          </button>
          <p />
          <button
            onClick={() => {
              getLog(sample1);
              setSelection(sample1);
            }}
          >
            Log file from source directory (for testing)
          </button>
          <p />
          <button
            onClick={() => {
              getLog(sample2);
              setSelection(sample2);
            }}
          >
            Constructed sample from source directory (for testing)
          </button>
          <p />
          <button
            onClick={() => {
              getWebDav();
            }}
          >
            Get getWebDav
          </button>
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
