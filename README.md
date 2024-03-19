# Log Viewer

This is a React web app used to load SAS logs from a WebDAV location and then analyse the text.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

## Deploying the web app to LSAF

- Build the app using **npm run build**
- Go to the build directory and zip the contents
- Navigate to /general/biostat/tools/logviewer
- Use the **Upload and expand** tool from the LSAF toolbar to upload the build zip file and expand the contents. This will overwrite the previous app with the uploaded one.
- Click on **index.html** to open the application.
-

## Building for use on SharePoint

- To build app for SharePoint we need to use this as the homepage in package.json
  "homepage": "<https://argenxbvba.sharepoint.com/sites/Biostatistics/Shared%20Documents/Log%20Viewer>",

## Building for use on LSAF

- To build app for LSAF we need to use this as the homepage in package.json
  "homepage": "/lsaf/webdav/repo/general/biostat/tools/logviewer2",

## Setup tools in PC SAS to use Log Viewer

- You can define a tool in PC SAS using the following command
  - submit 'filename clipper clipbrd;'; LOG ; FILE clipper REPLACE ;wbrowse "<https://argenxbvba.sharepoint.com/sites/Biostatistics/Shared%20Documents/Log%20Viewer/index.aspx?paste=1>"

- This will do the following:
  - defines a fileref using the clipboard
  - switches to LOG window
  - copies the contents of log window to clipboard
  - starts the log viewer web app on SharePoint with a parameter that causes it to paste the clipboard in
