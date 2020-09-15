
const { google } = require('googleapis');
const dotenv = require('dotenv')
const { auth } = require("./auth");
const data = require('./user.json')
dotenv.config()

const { spreadsheetId } = process.env

const makeRow = (json = {}) => {
  const result = []
  const titles = [ 'id', 'patientName', 'phone', 'category', 'selectedRole', 'selectedDisease', 'clickedTopic', 'clickedService', 'paid' ]
  for(const key of titles){
    if(json[key]){
      result.push(json[key])
    } else {
      result.push('')
    }
  }
  return result
}

const makeUpdateRows = (json, old=[]) => {
  const values = makeRow(json)
  const result = values.map((item, index) => {
    if(old[index] == item){
      return item
    } else if(item && !old[index]){
      return item
    } else if(!item && old[index]){
      return old[index]
    }
    return old[index]
  })
  return result
}


/* RUN */
function run() {
  auth((client) => {
    const sheets = google.sheets({ version: 'v4', auth: client });

    getRowById(sheets, data.id)
    .then(({row, rowId}) => {
      console.log('got id: ', rowId);
      const rows = makeUpdateRows(data, row)
        updateRowById({ sheets, rowId: `A${rowId}`, rows })
      }).catch(err => console.log('error ', err))
  })
}

run()

function getRowById(sheets, id) {
  const column = 'A'
  return new Promise((resolve, reject) => {
    sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `Sheet1!${column}1:D`,
    })
      .then(res => {
        const rows = res.data.values;
        if (rows.length) {
          let rowId = 0
          for (const row of rows) {
            rowId += 1
            if (row[0] == id) {
              console.log('found rowId', rowId);
              resolve({row, rowId})
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

function updateRowById({ sheets, rowId, rows }) {
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