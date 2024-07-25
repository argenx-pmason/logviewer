/*-- Jump to LSAF path defined in localStorage --*/
const iframe=document.getElementById('sasLSAF_iframe'),
    iWindow = iframe.contentWindow,
    iDocument = iWindow.document,
    repo=iDocument.querySelector('[aria-label="Selected, Workspace"]') ? 'work' : 'repo',
    full=repo==='work'?'WORKSPACE':'REPOSITORY',
    qs=iDocument.getElementById('HLS_LSAF_'+full+'--navLinkInput-inner'),
    w = window.open('','','width=800,height=200'),
    links=JSON.parse(localStorage.getItem("lsafLinks")),
    keys=Object.keys(links),
    text=keys.map(k=>k+' = '+links[k]).join('<br/>');
w.document.write(text);
w.focus();
setTimeout(function() {w.close();}, 2000);
w.document.addEventListener("keydown", (event) => {
  if (links[event.key]) {
    qs.value=links[event.key];
    qs.dispatchEvent(
      keyboardEvent = new KeyboardEvent('keydown', {
        code: 'Enter',
        key: 'Enter',
        charCode: 13,
        keyCode: 13,
        view: window,
        bubbles: true
      })
    );
  }
});
/* scroll to selected item */
setTimeout(() => {const sel=iDocument.querySelectorAll('[aria-selected="true"]'),
  len=sel.length-1;
  sel[len].scrollIntoViewIfNeeded(); }, 2000);



localStorage.setItem("lsafLinks",JSON.stringify({a:"/general/biostat/jobs/gadam_ongoing_studies/dev/output",b:"/general/biostat/tools/sdtm-last"}))
