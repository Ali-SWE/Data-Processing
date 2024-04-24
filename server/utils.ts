import { Database } from "bun:sqlite";
import * as fs from "fs";
import parse from "csv-simple-parser";

// This function is only called to iniitalize the database and create its tables
export const initDB =  () => {
    // Initialize the database
    const db = new Database("mydb.sqlite");
        
    // Import the Data Defintion "Schema"
    const schema = fs.readFileSync("schema.txt", "utf-8"); 
    // Execute the schema
    db.run(schema);
    
    // Close the connection
    db.close();  
}


// This function reads a csv file and stores data in a database: return total process time in ms
export const insertData = async (csvFilename: string, dbName: string): Promise<number> => {

    // start time
    const start = Date.now(); 

    // Initialize the database
    const db = new Database(dbName); 

    // open csv file
    const file = Bun.file(csvFilename);
    
    // type of the records
    type Record = {
        RequestID: number,
        RequestType: string,
        RequestStatus: string,
        RequestData: string,
    };
    
    // read csv file and store records in an array
    const data = parse(await file.text(), { header: true }) as Record[]

    // loop over records
    for (const record of data){
        
        // store each value in a variable
        const requestId = record.RequestID;
        const requestType = record.RequestType;
        const RequestStatus = record.RequestStatus;
        const RequestData = JSON.parse(record.RequestData);
        
        // insert data in the coresponding table based on the request type
        if(requestType === "1"){
            db.run(`INSERT INTO NewLicense VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`, [
                requestId,
                RequestStatus,
                RequestData.CompanyName,
                RequestData.LicenceType,
                RequestData.IsOffice,
                RequestData.OfficeName,
                RequestData.OfficeServiceNumber,
                RequestData.RequestDate,
                RequestData.Activities
            ]);
        }else if(requestType === "2"){
            db.run(`INSERT INTO AccountRequest VALUES (?, ?, ?, ?, ?, ?, ?, ?);`, [
                requestId,
                RequestStatus,
                RequestData.CompanyName,
                RequestData.RequesterName,
                RequestData.ApplicantName,
                RequestData.UserName,
                RequestData.ContactEmail,
                JSON.stringify(RequestData.Permissions)
            ]);
        }else if(requestType === "3"){
            db.run(`INSERT INTO InspectionRequest VALUES (?, ?, ?, ?, ?, ?);`, [
                requestId,
                RequestStatus,
                RequestData.CompanyName,
                RequestData.InspectionDate,
                RequestData.InspectionTime,
                RequestData.InspectionType
            ]);
        }else if(requestType === "4"){
            db.run(`INSERT INTO AddActivity VALUES (?, ?, ?, ?, ?);`, [
                requestId,
                RequestStatus,
                RequestData.CompanyName,
                RequestData.LicenceID,
                JSON.stringify(RequestData.Activities)
            ]);
        }else if(requestType === "5"){
            db.run(`INSERT INTO StampLicense VALUES (?, ?, ?, ?, ?);`, [
                requestId,
                RequestStatus,
                RequestData.CompanyName,
                RequestData.LicenceID,
                RequestData.RequestDate
            ]);
        }else{

        }
    }
    const end = Date.now(); // end time
    return end - start // ms
}

// This function return list of object that has table name and number of records as keys
export const getTableRecordCounts = async (dbName: string) => {

    // Initialize the database
    const db = new Database(dbName);

    // query all table names in the database
    const tables = db.query("SELECT name FROM sqlite_master WHERE type='table';").all();


    // initialize the returned array
    const recordCounts: {tableName: string, count: number}[] = [];

    // loop over table names
    for (const table of tables) {
        
        // to tell typescript the table has a key called name
        if (
            typeof table === "object" &&
            table &&
            "name" in table &&
            typeof table.name === "string"
          ) {
            const tableName = table.name;
            const result = db.query(`SELECT COUNT(*) as count FROM ${tableName};`).all()[0];

            // to tell typescript the result has a key called count
            if (
                typeof result === "object" &&
                result &&
                "count" in result &&
                typeof result.count === "number"
            ){
                recordCounts.push({tableName: tableName, count: result.count});
            }
          }
    }

  
    // Close the database connection
    db.close();
  
    return recordCounts;
}

