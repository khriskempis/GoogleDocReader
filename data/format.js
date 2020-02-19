const { HEADERS } = require("./constants")

  function extractCityAndState(section) {
    let cityStateString = section.elements[0].textRun.content;
    let index = cityStateString.indexOf("for");
    cityStateString = cityStateString.slice(index + 4);
    cityStateTrimmed = cityStateString.replace(/(\r\n|\n|\r)/gm, "");
    return cityStateTrimmed.split(", ");
  }

  function checkNextElement(nextElement){
    let isHeader = nextElement.hasOwnProperty("paragraph")
      ? nextElement.paragraph.paragraphStyle.namedStyleType
      : "";
    let isTable = nextElement.table;
    if (HEADERS.includes(isHeader) || isTable) {
      return false;
    } else {
      return true; 
    }
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
            var trimmedContent = content.replace(/(\r\n|\n|\r)/gm, "");
            content = trimmedContent;
        }
        if (isBold && content.length > 1) {
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

  module.exports = { extractCityAndState, checkNextElement, formatContent}