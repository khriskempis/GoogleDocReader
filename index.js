// const {CLIENT_ID, CLIENT_SECRET } = require("./config");

const fs = require("fs");
const readline = require("readline");
const { google } = require("googleapis");

// If modifying these scopes, delete token.json.
const SCOPES = ["https://www.googleapis.com/auth/documents.readonly"];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = "token.json";

// Load client secrets from a local file.
fs.readFile("credentials.json", (err, content) => {
  if (err) return console.log("Error loading client secret file:", err);
  // Authorize a client with credentials, then call the Google Docs API.
  authorize(JSON.parse(content), printDocmentContents);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES
  });
  console.log("Authorize this app by visiting this url:", authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question("Enter the code from that page here: ", code => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error("Error retrieving access token", err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), err => {
        if (err) console.error(err);
        console.log("Token stored to", TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}
/**
 * Prints the title of a sample doc:
 * https://docs.google.com/document/d/195j9eDD3ccgjQRttHhJPymLJUCOUjs-jmwTrekvdjFE/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth 2.0 client.
 */
function printDocmentContents(auth) {
  const docs = google.docs({ version: "v1", auth });
  docs.documents.get(
    {
      documentId: "1lgyT2G1ftGpQ6uWd0O2Dx3kQyOL1xZ60Tk7L-gczZ20"
    },
    (err, res) => {
      if (err) return console.log("The API returned an error: " + err);
      var doc = res.data;
      var data = doc.body.content;
      var jsonObject = FormatDocument(data);

      // console.log(`The title of the document is: ${res.data.title}`);
      console.log(jsonObject);
    }
  );
}

const headerArray = [
  "HEADING_1",
  "HEADING_2",
  "HEADING_3",
  "HEADING_4",
  "HEADING_5"
];

const BNdashboardFields = [
  "city",
  "state",
  "intro",
  "cheapestInternet",
  "typesOfInternet",
  "internetSpeed",
  "fastestInternet",
  "bundles",
  "compareProviders",
  "movingToCity",
  "installationFees",
  "howMuchData",
  "mostConnected",
  "internetStats",
  "faqCheapestInternet",
  "faqFastestInternet",
  "faqNumberOfInternetProviders",
  "faqNumberofResProviders",
  "faqBundle",
  "faqNumberOfBusProviders",
  "Enabled"
];

function addHeaderElements(content) {
  let textStyle = content.paragraphStyle;
  let headerType = textStyle.namedStyleType;
  let headerNumber = headerArray.indexOf(headerType) + 1;
  let headerHTMLopen = `<h${headerNumber}>`;
  let headerHTMLclose = `</h${headerNumber}>`;
  if (headerArray.includes(headerType)) {
    let headerTag = "";
    let headerElements = content.elements;
    for (let i = 0; i < headerElements.length; i++) {
      headerTag += headerElements[i].textRun.content;
    }
    return `${headerHTMLopen}${headerTag}${headerHTMLclose}`;
  } else {
    return "";
  }
}

function extractCityAndState(section) {
  let cityStateString = section.elements[0].textRun.content;
  let index = cityStateString.indexOf("for");
  cityStateString = cityStateString.slice(index + 4);
  cityStateTrimmed = trimContent(cityStateString);
  return cityStateTrimmed.split(", ");
}

function trimContent(content) {
  var stringArray = content.split(" ");
  var trimmedContent = stringArray
    .map(word => {
      if (word.includes("\n")) {
        return word.slice(0, word.length - 1);
      } else {
        return word;
      }
    })
    .join(" ");
  return trimmedContent;
}

function formatContent(data) {
  let textStyle = data.paragraphStyle;
  if (textStyle.namedStyleType == "NORMAL_TEXT") {
    let formatedString = "";
    let elements = data.elements;
    elements.forEach(item => {
      let content = item.textRun.content;
      let isBold = item.textRun.textStyle.bold;
      if (content.includes("\n")) {
        var trimmedContent = trimContent(content);
        content = trimmedContent;
      }
      if (isBold && content.length > 0) {
        formatedString += `<strong>${content}</strong>`;
      } else {
        formatedString += content;
      }
    });
    return formatedString;
  } else {
    return "";
  }
}

function FormatDocument(content) {
  let BNobject = {};
  let text = "";
  let isSection = false;
  let ulCounter = 0;
  let index = 0;
  content.forEach((item, i, arr) => {
    let section = item.paragraph;
    if (section) {
      let textStyle = section.paragraphStyle.namedStyleType;
      //format headings
      if (headerArray.includes(textStyle)) {
        isSection = true;
        // check if it's the main header with City and State,
        if (index < 1) {
          var cityState = extractCityAndState(section);
          BNobject[BNdashboardFields[index]] = cityState[0];
          BNobject[BNdashboardFields[index + 1]] = cityState[1];
          index += 2;
        }
      }
      let nextElement = arr[i + 1];
      if (nextElement) {
        // if next element is header, end of a section.
        let nextHeader = nextElement.hasOwnProperty("paragraph")
          ? nextElement.paragraph.paragraphStyle.namedStyleType
          : "";
        let isTable = nextElement.table;
        if (headerArray.includes(nextHeader) || isTable) {
          isSection = false;
        }
      } else {
        // we've reached the end so there is no next header
        // set isSection to false to add last element to BNobject
        isSection = false;
      }
      //format paragraph
      if (textStyle == "NORMAL_TEXT") {
        let list = section.bullet;
        // check if it's a list
        if (list) {
          // create ul
          if (ulCounter == 0) {
            text += "<ul>";
          }
          var formatedList = formatContent(section);
          text += `<li> ${formatedList} </li>`;

          ulCounter += 1;
          if (ulCounter == 4) {
            text += "</ul>";
            ulCounter = 0;
          }
        } else {
          var formattedParagraph = formatContent(section);
          if (formattedParagraph.length > 0) {
            text += `<p>${formattedParagraph}</p>`;
          }
        }
      }
    }
    // at the end of a section, add text to BNobject with the correct field name
    if (!isSection && text.length > 0) {
      BNobject[BNdashboardFields[index]] = text;
      text = "";
      // increment the index to grab the next value in BNdashboardFields array
      index += 1;
    }
  });
  return JSON.stringify(BNobject);
}
