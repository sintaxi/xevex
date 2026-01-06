
const should = require("should")
const Xevex  = require("../").default
const createXevexTests = require("./shared/xevexTests")

describe("Xevex CJS", createXevexTests(should, Xevex, "CommonJS"))