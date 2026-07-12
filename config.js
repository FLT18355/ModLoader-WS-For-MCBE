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
    cmd: "../mod/cmd.js"
  },
	server: {}
};

// 函数目录(自行修改)
const basePath = {
	mcfunc: "../Function/"
};

module.exports = { track, commandPrefix, mods, basePath };
