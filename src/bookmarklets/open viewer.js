/*-- Open a viewer web app using selected item --*/
const iframe=document.getElementById('sasLSAF_iframe'),
    iWindow = iframe.contentWindow,
    iDocument = iWindow.document,
    repo=iDocument.querySelector('[aria-label="Selected, Workspace"]') ? 'work' : 'repo',
    full=repo==='work'?'WORKSPACE':'REPOSITORY',
    qs=iDocument.getElementById('HLS_LSAF_'+full+'--navLinkInput-inner'),
    v = qs ? qs.value : null,
    lastPart = v.split('/').pop(),
    type=lastPart.split('.').pop(),
    { protocol, host } = window.location,
    urlPrefix = protocol + '//' + host,
    filelink=urlPrefix+'/lsaf/webdav/'+repo+v;
    if (lastPart==='documents') open(urlPrefix+'/lsaf/webdav/repo/general/biostat/tools/dashstudy/index.html?file='+v+'/meta/dashstudy.json');
    else if (lastPart.split('.').length===1) open(urlPrefix+'/lsaf/webdav/repo/general/biostat/tools/fileviewer/index.html?file='+v);
    else if (type==='log') open(urlPrefix+'/lsaf/webdav/repo/general/biostat/tools/logviewer/index.html?log='+filelink);
    else if (type==='json') open(urlPrefix+'/lsaf/webdav/repo/general/biostat/tools/view/index.html?lsaf='+v);
    else open(urlPrefix+'/lsaf/webdav/repo/general/biostat/tools/fileviewer/index.html?file='+filelink);