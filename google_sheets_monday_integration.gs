// API key (for illustration only, you should store production key in an environment variable)
var mondayAPIkey = "YOUR_API_KEY_HERE";

// ID of destination board
var boardID = 392204356; // change this :)

// list that stores the column IDs of the monday.com columns to be updated (ordered left to right)
var colMappings = ["name", "text", "text0", "status9", "date3"]; // change this :)

function makeAPICall(key, query, variables) {
  var url = "https://api.monday.com/v2";
  var options = {
    "method" : "post",
    "headers" : {
      "Authorization" : key,
    },
    "payload" : JSON.stringify({
      "query" : query,
      "variables" : variables
    }),
    "contentType" : "application/json"
  };
  var response = UrlFetchApp.fetch(url, options);
  Logger.log("API results: " + response.getContentText());
  return response;
}

function getPulseID(key, pulseName) {
  var query = "query($board:Int!, $name:String!){items_by_column_values(board_id:$board, column_id:\"name\", column_value:$name){id}}";
  var variables = {
    "board" : boardID,
    "name" : pulseName
  };
  var data = makeAPICall(key, query, variables);
  Logger.log(data.getContentText());
  return data;
}


function updateCell(e) {
  
  // declare pulse ID based on column 6
  var rowNumber = e.range.getRow();
  var name = e.range.getSheet().getSheetValues(rowNumber,1,1,1)[0][0];
  var pulseID = e.range.getSheet().getSheetValues(rowNumber,6,1,1);
  
  // get pulse ID if column 6 is empty
  if (pulseID == 0) {
    Logger.log("No pulse ID given.");
    pulseID = JSON.parse(getPulseID(mondayAPIkey, name)).data.items_by_column_values[0];
    // if item doesn't exist, create it
    if (typeof pulseID == "undefined") {
      var query = "mutation($board:Int!, $name:String!){create_item(board_id:$board, item_name:$name){id}}";
      var variables = {
        "board" : boardID,
        "name" : name
      };
      pulseID = JSON.parse(makeAPICall(mondayAPIkey, query, variables)).data.create_item.id;
    }
    else {
      pulseID = pulseID.id;
    }
    Logger.log("Pulse ID returned was " + pulseID);
    e.range.getSheet().getRange(rowNumber, 6).setValue(pulseID);
  }
  
  // update columns
  
  for (var i = 0; i < colMappings.length; i++) {
    var cellValue = String(e.range.getSheet().getSheetValues(rowNumber,(i+1),1,1)[0][0]);
    query = "mutation($item:Int!, $board:Int!, $val:JSON!, $col:String!){change_column_value(item_id:$item, board_id:$board, column_id:$col, value:$val){id}}";
    variables = {
      "item" : parseInt(pulseID),
      "board" : boardID,
      "col" : colMappings[i],
      "val" : JSON.stringify(cellValue)
    };
    var res = JSON.parse(makeAPICall(mondayAPIkey, query, variables));
  }
  
  
  Logger.log(res.getContentText());
}
