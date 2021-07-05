import { App } from "./App";
import fs from "fs-extra";
import path from "path";


export class Factory{

    static simple(config: Config): App{
        let download_path = `./storage/${config.id}/downloads`;
        fs.ensureDirSync(`./storage/${config.id}/downloads`);

        let out_file = `./storage/${config.id}/out.log`;
        let outstream = fs.createWriteStream(out_file, {
            flags: 'a',
            encoding: 'utf8'
        })
        console.log = function(){
            outstream.write(`${arguments[0]}\r\n`);
        }

        let downloadHandler: Handler = {
            topic: "_download",
            match: () => false,
            extractor: function(response: IResponse){
                //@ts-ignore
                let save_as = response.resource._extra_attributes?.save_as ?? `${path.basename(response.request.url)}`;
                save_as = `${download_path}/${save_as}`;

                return new Promise((resolve, reject) => {
                    response?.body
                    .pipe(fs.createWriteStream(save_as))
                    .on("finish", function(){
                        resolve(save_as);
                    })
                    .on("error", function(err){
                        reject(err);
                    });
                });
            }
        };
        config.extractors.push(downloadHandler);

        let app = new App(config);
        let responded_file = `./storage/${config.id}/responsed.urls`;
        let responded_writer = fs.createWriteStream(responded_file, {
            flags: "a+"
        });
        app.on("resource.responded", function(app: App, resource:Resource, response: IResponse){
            responded_writer.write(`${resource.request.url}\n`);
        });

        let faild_file = `./storage/${config.id}/faild.urls`;
        let faild_writer = fs.createWriteStream(faild_file, {
            flags: "a+"
        });
        app.on("resource.failed", function(app: App, resource:Resource, response: IResponse){
            faild_writer.write(`${resource.request.url}\n`);
        });
        return app;
    }
}