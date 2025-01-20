const processworker = () => {
  onmessage = (e) => {
    console.log("*** received by web worker -", e.data);
    const { lines, showSource, showMacroLines, macrosSelected, rules } = e.data,
      start = Date.now(),
      tempLinks = [];
    let counts = {};

    console.log("start", start, "number of lines =", lines.length);

    let html = [];
    lines.forEach((element, ln) => {
      if (ln % 5000 === 0) {
        const tempProgress = Math.floor((100 * ln) / lines.length),
          elapsed = Math.floor((Date.now() - start) / 1000);
        console.log(
          `Line ${ln} of ${lines.length} - ${tempProgress}% - elapsed: ${elapsed} secs`
        );
        const data = {
          progress_pct: tempProgress,
          html: html,
          counts: counts,
          tempLinks: tempLinks,
          elapsed: elapsed,
        };
        postMessage(JSON.parse(JSON.stringify(data))); // final result
        html=[] // reset html so we just send back the new info we have processed
      }
      let matchFound = false;
      if (/The SAS System/.test(element)) return null;
      if (!showSource && /^(\d+)/.test(element)) return null;
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
        (element.startsWith("MLOGIC(") ||
          element.startsWith("SYMBOLGEN: ") ||
          element.startsWith("MAUTOCOMPLOC: "))
      )
        return null;
      let preparedToReturn = element;
      rules.forEach((rule) => {
        if (
          !matchFound &&
          ((rule.ruleType === "startswith" &&
            element.startsWith(rule.startswith)) ||
            (rule.ruleType === "regex" && rule.regularExpression.test(element)))
        ) {
          matchFound = true; // set this showing we have matched a rule for this line, so we dont want to match any other rules for this line
          const tag = rule.prefix,
            prefix = tag.substring(0, tag.length - 1) + ` id='${ln}'>`;
          if (rule.anchor)
            tempLinks.push({
              text: element,
              id: ln,
              lineNumber: ln,
              linkColor: rule.linkColor,
              type: rule.type,
              interesting: rule.interesting,
            });
          if (!counts.hasOwnProperty(rule.type)) counts[rule.type] = 0;
          counts[rule.type]++;
          preparedToReturn = prefix + preparedToReturn + rule.suffix;
          if (
            rule.ruleType === "regex" &&
            rule.substitute &&
            rule.regularExpression.test(element)
          ) {
            const matches = element.match(rule.regularExpression);
            matches.forEach((match) => {
              preparedToReturn = element;
              if (rule.prefix.includes("{{matched}}")) {
                const a = rule.prefix.replace("{{matched}}", match),
                  b = rule.suffix.replace("{{matched}}", match);
                preparedToReturn = element.replace(match, a + b);
              }
              if (rule.prefix.includes("{{line}}")) {
                const c = rule.prefix.replace("{{line}}", encodeURI(element)),
                  d = rule.suffix.replace("{{line}}", element);
                preparedToReturn = c + d;
              }
            });
          }
        }
      });
      html.push(preparedToReturn);
    }); // end of forEach loop

    const elapsed = Math.floor((Date.now() - start) / 1000),
      data = {
        progress_pct: "100",
        html: html,
        counts: counts,
        tempLinks: tempLinks,
        elapsed: elapsed,
      };
    postMessage(JSON.parse(JSON.stringify(data))); // final result
  };
};

let code = processworker.toString();
code = code.substring(code.indexOf("{") + 1, code.lastIndexOf("}"));
const blob = new Blob([code], { type: "application/javascript" });
const workerScript = URL.createObjectURL(blob);
module.exports = workerScript;
