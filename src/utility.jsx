export const xmlToJson = (xml) => {
  // Create the return object
  var obj = {},
    i,
    j,
    attribute,
    item,
    nodeName,
    old;

  if (xml.nodeType === 1) {
    // element
    // do attributes
    if (xml.attributes.length > 0) {
      obj["@attributes"] = {};
      for (j = 0; j < xml.attributes.length; j = j + 1) {
        attribute = xml.attributes.item(j);
        obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
      }
    }
  } else if (xml.nodeType === 3) {
    // text
    obj = xml.nodeValue;
  }

  // do children
  if (xml.hasChildNodes()) {
    for (i = 0; i < xml.childNodes.length; i = i + 1) {
      item = xml.childNodes.item(i);
      nodeName = item.nodeName;
      if (obj[nodeName] === undefined) {
        obj[nodeName] = xmlToJson(item);
      } else {
        if (obj[nodeName].push === undefined) {
          old = obj[nodeName];
          obj[nodeName] = [];
          obj[nodeName].push(old);
        }
        obj[nodeName].push(xmlToJson(item));
      }
    }
  }
  return obj;
};

export const getDir = async (url, depth, callback) => {
  // Create an XMLHttpRequest object
  const xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    if (this.readyState === 4 && (this.status === 207 || this.status === 200)) {
      callback(this);
    }
  };
  // Send a request
  //xhttp.open("PROPFIND", "https://xarprod.ondemand.sas.com/lsaf/webdav/repo/", false, user, pwd);
  xhttp.open("PROPFIND", url, false);
  xhttp.setRequestHeader("Depth", "" + depth);
  let xmlData =
    "<?xml version='1.0' encoding='UTF-8'?>" +
    "  <d:propfind  xmlns:d='DAV:' xmlns:sc='http://www.sas.com/sas'>" +
    "     <d:prop>" +
    "        <d:displayname /> " +
    "        <d:creationdate/> <d:getlastmodified />  <d:getetag />  <d:getcontenttype />  <d:resourcetype />  <sc:checkedOut />  <sc:locked />   <sc:version /> " +
    "     </d:prop>" +
    "  </d:propfind>";
  xhttp.send(xmlData);
};

export const getVersions = async (url, callback) => {
  const versions = [],
    getVersionFields = (item) => {
      let href = item?.["D:href"]?.["#text"];
      let props =
        item?.["D:propstat"]?.["D:prop"] ??
        item?.["D:propstat"]?.[0]?.["D:prop"];
      console.log(props);
      let created = props?.["D:creationdate"]?.["#text"] ?? "";
      let modified = props?.["D:getlastmodified"]?.["#text"] ?? "";
      let creator = props?.["D:creator-displayname"]?.["#text"] ?? "";
      let length = props?.["D:getcontentlength"]?.["#text"] ?? "";
      let versionName = props?.["D:version-name"]?.["#text"] ?? "";
      //let comment = props?.["D:comment"]?.["#text"] ?? "";
      //let info = `Version name: ${versionName}, Creator: ${creator}, Size: ${length}, Created: ${created}` +
      //         `,  Last modified: ${modified}, Comment: ${comment},  Href: ${href}` ;
      let info =
        `Version name: ${versionName}, Creator: ${creator}, Size: ${length}, Created: ${created}` +
        `, Last modified: ${modified},  Href: ${href}`;
      versions.push(info);
      console.log(info);
    };

  // Create an XMLHttpRequest object
  console.log("Called: getVersion(" + url + ")");
  const xhttp = new XMLHttpRequest();

  // Define a callback function to deal with the reponse
  xhttp.onload = function () {
    // Here you can use the Data
    let dataXML = this.responseXML;
    let dataJSON = xmlToJson(dataXML);
    // pre.innerText += "\nVersions:";
    console.log("Versions: dataJSON:");
    console.log(dataJSON);
    let resp = dataJSON?.["D:multistatus"]?.["D:response"];
    console.log(resp);
    if (Array.isArray(resp)) {
      resp.forEach(getVersionFields);
    } else {
      getVersionFields(resp);
    }
    callback(versions);
  };

  // Send a request
  xhttp.open("REPORT", url, false);
  xhttp.setRequestHeader("Content-Type", "text/xml");
  let data =
    "<?xml version='1.0' encoding='utf-8' ?>" +
    "<D:version-tree xmlns:D='DAV:'> <D:prop> " +
    "<D:version-name/> <D:creator-displayname/> <D:successor-set/>" +
    //"<D:comment />" +
    "</D:prop></D:version-tree>";
  xhttp.send(data);
};

export const updateJsonFile = (content) => {};
