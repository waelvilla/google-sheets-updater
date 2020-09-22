
const { google } = require('googleapis');
const dotenv = require('dotenv')
const { auth } = require("./auth");
const data = require('./user.json')
dotenv.config()

const { spreadsheetId, DEFAULT_SHEET, titles } = process.env

const makeRow = (json = {}) => {
  const result = []
  const sheetTitles =  titles.split(',')
  for(const key of sheetTitles){
    if(json[key]){
      result.push(json[key])
    } else {
      result.push('')
    }
  }
  return result
}

const makeRows = (json) => {
  const result = []
  result.push(Object.values(json))
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
    return item
  })
  return [result]
}

let sheets = google.sheets({version: 'v4'});
/* RUN */
function run() {
  auth((client) => {
    sheets = google.sheets({ version: 'v4', auth: client });
    
    runUpdate(DEFAULT_SHEET)
    runUpdate(data.category)
  })
}

run()

function runUpdate(sheetName){

  getRowById(data.id, sheetName)
  .then(({row, rowId}) => {
    console.log('got id: ', rowId);
    const rows = makeUpdateRows(data, row)
      updateRowById({ rowId: `A${rowId}`, rows, sheetName })
    }).catch(err =>{
      console.log('error ', err)
      if(err=='row does not exist'){
        //THEN insert row
        const rows = makeRows(data)
        addRow({rows, sheetName })
      }
    }).catch(err => console.log('error inserting', err))
}

function getRowById(id, sheetName) {
  const column = 'A'
  return new Promise((resolve, reject) => {
    sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!${column}1:J`,
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

function updateRowById({ rowId, rows, sheetName }) {
  sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!${rowId}:J`,
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

function addRow({rows, sheetName }){
  sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A1:J`,
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
