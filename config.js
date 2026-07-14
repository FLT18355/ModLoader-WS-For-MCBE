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
    mcfunc: "../mod/mcfunc.flt",
    music: "../mod/music.flt",
    cmd: "../mod/cmd.flt",
    permission: "../mod/permission.flt"
    // morews: "../mod/morews.flt"
  },
	server: {
    read: "../mod/read.flt"
  }
};

const basePath = {
	mcfunc: "../Function/"
};

module.exports = { track, commandPrefix, mods, basePath, wsName };
