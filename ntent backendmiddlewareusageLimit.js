[35mbackend/middleware/usageLimit.js[m[36m:[m[32m1[m[36m:[m// backend/middleware/[1;31musageLimit[m.js
[35mbackend/middleware/usageLimit.js[m[36m:[m[32m39[m[36m:[mfunction [1;31musageLimit[m(kind) {
[35mbackend/middleware/usageLimit.js[m[36m:[m[32m90[m[36m:[m      console.error(`[1;31musageLimit[m(${kind}) error:`, err.message);
[35mbackend/middleware/usageLimit.js[m[36m:[m[32m97[m[36m:[mmodule.exports = { [1;31musageLimit[m };
[35mbackend/routes/chat.routes.js[m[36m:[m[32m15[m[36m:[mconst { [1;31musageLimit[m } = require("../middleware/[1;31musageLimit[m");
[35mbackend/routes/chat.routes.js[m[36m:[m[32m18[m[36m:[mrouter.post("/chat", requireAuth, [1;31musageLimit[m("messages"), async (req, res) => {
[35mbackend/routes/chat.routes.js[m[36m:[m[32m33[m[36m:[mrouter.post("/chat-json", requireAuth, [1;31musageLimit[m("messages"), async (req, res) => {
[35mbackend/routes/chat.routes.js[m[36m:[m[32m57[m[36m:[mrouter.post("/vision", requireAuth, [1;31musageLimit[m("photos"), async (req, res) => {
[35mbackend/routes/file.routes.js[m[36m:[m[32m21[m[36m:[mconst { [1;31musageLimit[m } = require("../middleware/[1;31musageLimit[m");
[35mbackend/routes/file.routes.js[m[36m:[m[32m53[m[36m:[mrouter.post("/file", requireAuth, [1;31musageLimit[m("files"), async (req, res) => {
[35mbackend/routes/tools.routes.js[m[36m:[m[32m5[m[36m:[mconst {[1;31musageLimit[m}=require("../middleware/[1;31musageLimit[m");
[35mbackend/routes/tools.routes.js[m[36m:[m[32m42[m[36m:[mrouter.post("/generate",requireAuth,[1;31musageLimit[m("messages"),async(req,res)=>{
[35mbackend/sql/001_foundation.sql[m[36m:[m[32m5[m[36m:[m-- function used by middleware/[1;31musageLimit[m.js.
