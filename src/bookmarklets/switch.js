/*-- Switch between LSAF Repository and Workspace locations --*/
const iframe=document.getElementById('sasLSAF_iframe'),
    iWindow = iframe.contentWindow,
    iDocument = iWindow.document,
    repo=iDocument.querySelector('[aria-label="Selected, Workspace"]') ? 'work' : 'repo',
    full=repo==='work'?'WORKSPACE':'REPOSITORY',
    qs=iDocument.getElementById('HLS_LSAF_'+full+'--navLinkInput-inner'),
    full2=repo==='work'?'REPOSITORY':'WORKSPACE',
    qs2=iDocument.getElementById('HLS_LSAF_'+full2+'--navLinkInput-inner'),
    wrk=iDocument.getElementById('sasLSAF--sasLSAF_appContainer_lfn_4_icn'),
    wrk2=iDocument.getElementById('sasLSAF--sasLSAF_appContainer_lfn_4').getAttribute('aria-selected')==='true',
    rp=iDocument.getElementById('sasLSAF--sasLSAF_appContainer_lfn_3_icn'),
    rp2=iDocument.getElementById('sasLSAF--sasLSAF_appContainer_lfn_3').getAttribute('aria-selected')==='true',
    current=qs.value;
    if (wrk2) rp.click();
    if (rp2) wrk.click();
    qs2.value=current;
qs2.dispatchEvent(
keyboardEvent = new KeyboardEvent('keydown', {
    code: 'Enter',
    key: 'Enter',
    charCode: 13,
    keyCode: 13,
    view: window,
    bubbles: true
})
);
setTimeout(() => {const sel=iDocument.querySelectorAll('[aria-selected="true"]');
                  console.log('sel',sel);
                  sel[2].scrollIntoViewIfNeeded(); }, 2000);
