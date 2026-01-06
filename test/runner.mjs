
import should from "should"
import Xevex from "../dist/esm/index.js"
import createXevexTests from "./shared/xevexTests.js"

describe("Xevex ESM", createXevexTests(should, Xevex, "ES Modules"))