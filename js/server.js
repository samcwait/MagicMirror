/* MagicMirror²
 * Server
 *
 * By Michael Teeuw https://michaelteeuw.nl
 * MIT Licensed.
 */
const express = require("express");
const path = require("path");
const ipfilter = require("express-ipfilter").IpFilter;
const fs = require("fs");
const helmet = require("helmet");

const Log = require("logger");
const Utils = require("./utils.js");
const { cors, getConfig, getHtml, getVersion } = require("./server_functions.js");

/**
 * Server
 *
 * @param {object} config The MM config
 * @class
 */
function Server(config) {
	const app = express();
	const port = process.env.MM_PORT || config.port;
	const serverSockets = new Set();
	let server = null;

	this.open = function () {
		if (config.useHttps) {
			const options = {
				key: fs.readFileSync(config.httpsPrivateKey),
				cert: fs.readFileSync(config.httpsCertificate)
			};
			server = require("https").Server(options, app);
		} else {
			server = require("http").Server(app);
		}
		const io = require("socket.io")(server, {
			cors: {
				origin: /.*$/,
				credentials: true
			},
			allowEIO3: true
		});

		server.on("connection", (socket) => {
			serverSockets.add(socket);
			socket.on("close", () => {
				serverSockets.delete(socket);
			});
		});

		Log.log(`Starting server on port ${port} ... `);
		server.listen(port, config.address || "localhost");

		if (config.ipWhitelist instanceof Array && config.ipWhitelist.length === 0) {
			Log.warn(Utils.colors.warn("You're using a full whitelist configuration to allow for all IPs"));
		}

		app.use(function (req, res, next) {
			ipfilter(config.ipWhitelist, { mode: config.ipWhitelist.length === 0 ? "deny" : "allow", log: false })(req, res, function (err) {
				if (err === undefined) {
					res.header("Access-Control-Allow-Origin", "*");
					return next();
				}
				Log.log(err.message);
				res.status(403).send("This device is not allowed to access your mirror. <br> Please check your config.js or config.js.sample to change this.");
			});
		});

		app.use(helmet(config.httpHeaders));
		app.use("/js", express.static(__dirname));

		// TODO add tests directory only when running tests?
		const directories = ["/config", "/css", "/fonts", "/modules", "/vendor", "/translations", "/tests/configs", "/tests/mocks"];
		for (const directory of directories) {
			app.use(directory, express.static(path.resolve(global.root_path + directory)));
		}

		app.get("/cors", async (req, res) => await cors(req, res));

		app.get("/version", (req, res) => getVersion(req, res));

		app.get("/config", (req, res) => getConfig(req, res));

		app.get("/", (req, res) => getHtml(req, res));

		return {
			app,
			io
		};
	};

	this.close = function () {
		for (const socket of serverSockets.values()) {
			socket.destroy();
		}
		server.close();
	};
}

module.exports = Server;
