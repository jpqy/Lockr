const express = require("express");
const router = express.Router();

module.exports = (db) => {
  router.get("/:organization", (req, res) => {
    res.render("organization");
  });

  router.get("/:organization/manage", (req, res) => {
    res.render("manage");
  });

  return router;
};