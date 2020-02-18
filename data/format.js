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

  module.exports = { addHeaderElements, extractCityAndState, trimContent, formatContent}