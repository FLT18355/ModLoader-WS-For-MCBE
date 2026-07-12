// 配置文档
// 系统配置
// 调试
const track = false;
// 命令
const commandPrefix = "!";
// Mod
const mods = {
	client: { 
    mcfunc: "../mod/mcfunc.js",
    music: "../mod/music.js",
    cmd: "../mod/cmd.js",
    permission: "../mod/permission.js"
  },
	server: {}
};

const basePath = {
	mcfunc: "../Function/"
};

module.exports = { track, commandPrefix, mods, basePath };
