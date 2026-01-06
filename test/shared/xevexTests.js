
function createXevexTests(should, Xevex, moduleType) {
  return function() {
    it("should exist and be cool", function(){
      should.exist(Xevex)
    })
  }
}


// Export for both CJS and ESM
if (typeof module !== 'undefined' && module.exports) {
  module.exports = createXevexTests
} else {
  globalThis.createXevexTests = createXevexTests
}