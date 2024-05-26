const iframe=document.getElementsByClassName('sasLog'),
node=iframe[0],
logHTML=node.innerHTML
const logHTML2=logHTML.replaceAll('</div>', '\n</div>');
console.log(logHTML2)
const tempElement = document.createElement("templog");
tempElement.innerHTML = logHTML2;
const log=tempElement.innerText
console.log(log)
navigator.clipboard.writeText(log).then(function() {
  console.log('Async: Copying to clipboard was successful!');
  const url='http://localhost:3000/sites/Biostatistics/Shared%2520Documents/Log%2520Viewer?paste=1'
 window.open(url, '_blank').focus();
}, function(err) {
  console.error('Async: Could not copy text: ', err);
});