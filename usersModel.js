const mongoose = require("mongoose");

const Users = mongoose.Schema({
  userName: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  createdBy: {
    type: String,
  },
});

module.exports = mongoose.model("users", Users);
