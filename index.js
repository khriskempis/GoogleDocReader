// const {CLIENT_ID, CLIENT_SECRET } = require("./config");

const fs = require("fs");
const { google } = require("googleapis");
const { HEADERS, BN_DASH_FIELDS } = require("./data/constants")
const { formatContent, extractCityAndState, checkNextElement } = require("./data/format")
const { authorize } = require("./data/googleApi")

// Load client secrets from a local file.
fs.readFile("credentials.json", (err, content) => {
  if (err) return console.log("Error loading client secret file:", err);
  // Authorize a client with credentials, then call the Google Docs API.
  authorize(JSON.parse(content), printDocmentContents);
});

/**
 * Prints the title of a sample doc:
 * https://docs.google.com/document/d/195j9eDD3ccgjQRttHhJPymLJUCOUjs-jmwTrekvdjFE/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth 2.0 client.
 */
function printDocmentContents(auth) {
  const docs = google.docs({ version: "v1", auth });
  docs.documents.get(
    {
      documentId: "1N1ox86Qzcu5YuJBlfMuPi3zJFEwtPU1Xp2tT1umBfc0"
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
      if (HEADERS.includes(textStyle)) {
        isSection = true;
        // check if it's the main header with City and State,
        if (index < 1) {
          var cityState = extractCityAndState(section);
          BNobject[BN_DASH_FIELDS[index]] = cityState[0];
          BNobject[BN_DASH_FIELDS[index + 1]] = cityState[1];
          index += 2;
        }
      }
      let nextElement = arr[i + 1];
      if (nextElement) {
        isSection = checkNextElement(nextElement);
      } else {
        // we've reached the end so there is no next header
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
      BNobject[BN_DASH_FIELDS[index]] = text;
      text = "";
      // increment the index to grab the next value in BN_DASH_FIELDS array
      index += 1;
    }
  });
  return JSON.stringify(BNobject);
}
