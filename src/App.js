import logo from "./logo.svg";
import "./App.css";

function App() {
  let storedText;
  const getLog = (url) => {
    fetch(url).then(function (response) {
      response.text().then(function (text) {
        storedText = text;
        console.log(storedText);
      });
    });
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
        <a href="https://xarprod.ondemand.sas.com/lsaf/filedownload/sdd%3A///clinical/argx-113/cidp/argx-113-1802/biostat/staging/testrun1/qc_adam/documents/meta/dashboard.log">
          log
        </a>
        <button
          onClick={() =>
            getLog(
              "https://xarprod.ondemand.sas.com/lsaf/filedownload/sdd%3A///clinical/argx-113/cidp/argx-113-1802/biostat/staging/testrun1/qc_adam/documents/meta/dashboard.log"
            )
          }
        >
          get text from log
        </button>
      </header>
    </div>
  );
}

export default App;
