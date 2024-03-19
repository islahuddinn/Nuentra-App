const mongoose = require("mongoose");

const businessInformationSchema = new mongoose.Schema({
  businessInformation: {
    type: Object,
    required: true,
  },
});

const BusinessInformation = mongoose.model(
  "BusinessInformation",
  businessInformationSchema
);

module.exports = BusinessInformation;
