
const { google } = require('googleapis');
const dotenv = require('dotenv')
const { auth } =  require("./auth");
const data = require('./user.json')
dotenv.config()

const { spreadsheetId } = process.env

const makeRows = (json) => {
  const result = []
  result.push(Object.values(json))
  return result
}


/* RUN */
function run () {
    auth((client) => {
      const sheets = google.sheets({version: 'v4', auth: client});

      const rows = makeRows(data)
        // getData(sheets)
        addRow({sheets, rows })
    })
}

run()


function getData(auth) {
  sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Sheet1!A1:D',
  })
  .then(res=>{
    const rows = res.data.values;
    console.log(res.data);
    if (rows.length) {
      console.log('Name, Date:');
      // Print columns A and E, which correspond to indices 0 and 4.
      rows.map((row) => {
        console.log(`${row[0]}, ${row[3]}`);
      });
    } else {
      console.log('No data found.');
    }
  }).catch((err) => console.log('The API returned an error: ' + err))

}

function getRowId(sheets, id) {
  const column = 'A'
  return new Promise((resolve, reject) => {
    sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `Sheet1!${column}1:D`,
    })
    .then(res=>{
      const rows = res.data.values;
      if (rows.length) {
        let rowId = 0
        for(const row of rows) {
          rowId+=1
          if(row[0] == id){
            console.log('found rowId', rowId);
            resolve(rowId)
            break;
          }
        }
        reject('row does not exist')
      } else {
        console.log('No data found.');
        reject('row does not exist')
      }
    }).catch((err) => console.log('The API returned an error: ' + err))
  })
}

function updateRowById({sheets, rowId, rows }){
  sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `Sheet1!${rowId}:D`,
        // How the input data should be interpreted.
  valueInputOption: 'RAW',  // TODO: Update placeholder value.

  requestBody: {
      values: rows
  }
  })
  .then(res => {
      console.log('res', res.statusText);
  }).catch((err) => console.log("Error: ", err))
}

function addRow({sheets, rows }){
    sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1!A1:D',
          // How the input data should be interpreted.
    valueInputOption: 'RAW',  // TODO: Update placeholder value.

    // How the input data should be inserted.
    insertDataOption: 'INSERT_ROWS',  // TODO: Update placeholder value.
    requestBody: {
        values: rows
    }
    })
    .then(res => {
        console.log('res', res.statusText);
    }).catch((err) => console.log("Error: ", err))
}

