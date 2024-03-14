const mongoose = require("mongoose");
const dotenv = require("dotenv");

let server;

process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION! shutting down...");
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: "./config.env" });
const app = require("./app");
const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
  })
  .then(() => console.log("DB connected succefully"));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`app is running on port ${port}`);
});
process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION! shutting down...");
  console.log(err.name, err.message);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});
