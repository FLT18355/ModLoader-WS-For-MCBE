// 配置文档
// 系统配置
// 调试

const track = false;

// 服务端名称
const wsName = "FLTLoader";

// 命令
const commandPrefix = "!";
// Mod
const mods = {
	client: { 
    mcfunc: "../mod/mcfunc.js",
    music: "../mod/music.js",
    cmd: "../mod/cmd.js",
    permission: "../mod/permission.js"
    // morews: "../mod/morews.js"
  },
	server: {
    read: "../mod/read.js"
  }
};

const basePath = {
	mcfunc: "../Function/"
};

module.exports = { track, commandPrefix, mods, basePath };
