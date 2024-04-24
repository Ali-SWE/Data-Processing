import { insertData, initDB, getTableRecordCounts } from "./utils";


// Create server and routes
const server = Bun.serve({
    port: 3000,
    async fetch(req) {
        const url = new URL(req.url);
        
        // main route
        if (url.pathname === "/")
            return new Response(Bun.file("../client/index.html"), {
                headers: {
                    "Content-Type": "text/html",
                },
            });
  
        // api route
        if (url.pathname === '/api') {
            const formdata = await req.formData();
            const file = formdata.get('file');
            if (!file) throw new Error('Must upload a csv file.');
            
            const filename = formdata.get("filename")
            await Bun.write('uploads/' + filename, file);
            initDB()
            const totalTime = await insertData("uploads/" + filename, "mydb.sqlite");
            
            console.log(totalTime + "ms")

            return new Response(Bun.file("../client/index.html"), {
                headers: {
                    "Content-Type": "text/html",
                },
            });
        }

        if(url.pathname === "/summary"){ // this endpoint to get the summary of the database
            const summary = await getTableRecordCounts("mydb.sqlite")

            return new Response(JSON.stringify(summary))
        }
  
        return new Response("Not Found", { status: 404 });
    },
  });
