"use strict";

var express = require("express");
var mongo = require("mongodb");
var mongoose = require("mongoose");
var cors = require("cors");
var bodyParser = require("body-parser");
var dns = require("dns");
var sha = require("js-sha1");

var app = express();

// Basic Configuration
var port = process.env.PORT || 3000;

/** this project needs a db !! **/

// mongoose.connect(process.env.MONGOLAB_URI);

mongoose.connect(
  "mongodb+srv://lucas:lucas@cluster0-jeefk.mongodb.net/test?retryWrites=true&w=majority",
  { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true }
);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

const Schema = mongoose.Schema;

const urlDb = new Schema({
  url: {type: String, unique: true},
  shUrl: {type: String, unique: true},
});

const Url = mongoose.model("Url", urlDb);

app.use("/public", express.static(process.cwd() + "/public"));

app.get("/", function(req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// your first API endpoint...
app.get("/api/hello", function(req, res) {
  res.json({ greeting: "hello API" });
});


app.post("/api/shorturl/new", (req, res) => {
  let url = req.body.url;

  url = url.replace(/(^\w+:|^)\/\//, "");
  let address = dns.lookup(
    url,
    { family: 4, hints: dns.ADDRCONFIG | dns.V4MAPPED },
    (err, address) => {
      console.log(address);
      if (address !== undefined) {
        
        let newUrl = new Url({
          url: url,
          shUrl: sha(url).substr(0, 6)
        });
        
        newUrl.save((err) => {
          if (err) return err;
          Url.findOne({ url: url }, (err, data) => {
            if (err) return err;
            res.json({ original_url: data.url, short_url: data.shUrl})
          })
        });
      } else {
          res.json({ error: "invalid URL"});
      }
    }
  );
});

app.get("/api/shorturl/:id", (req, res) => {
  let shUrl = req.params.id;
  Url.findOne({ shUrl: shUrl }, (err, data) => {
    if (err) return err;
    res.redirect('http://'+data.url);
  });
})


app.listen(port, function() {
  console.log("Node.js listening ...");
});
