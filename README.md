# ModLoader-WS-For-MCBE

基于 WebSocket 的 Minecraft: Bedrock Edition Mod 加载器。服务器拦截 MCBE 的 WebSocket 协议，提供事件驱动接口，用于接收游戏事件并向客户端执行命令。

## 环境要求

- Node.js
- npm 包：`ws`、`uuid`

## 安装与运行

```bash
git clone https://github.com/StarAwA117/ModLoader-WS-For-MCBE.git
cd ModLoader-WS-For-MCBE
npm install ws uuid
node ws.js
```

服务器启动后监听 19132 端口，MCBE 客户端在本地世界可通过如下命令连接。

```
/connect 127.0.0.1:19132
```

## 配置

编辑 `config.js`：

| 选项 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `track` | `boolean` | `false` | 调试日志开关 |
| `commandPrefix` | `string` | `"!"` | 聊天中触发命令的前缀字符 |
| `mods.client` | `object` | `{}` | 客户端 Mod 注册表 `{ 名称: require路径 }` |
| `mods.server` | `object` | `{}` | 服务端 Mod 注册表 `{ 名称: require路径 }` |

## 权限系统

权限数据存储于 `permission.json`，共三个层级：

- **Blocker** — 黑名单玩家，连接时拒绝
- **User** — 普通注册用户，可执行 `user` 和 `normal` 级别命令
- **OP** — 管理员，可执行所有命令

权限大小排序：`OP > User > Normal > Blocker`

## Mod 机制

### 客户端 Mod

每个连接实例化一次。在 `config.js` 中注册：

```js
mods: {
  client: { myMod: "../mod/myMod.js" },
  server: {}
}
```

导出对象需包含 构造函数、`commands` 方法（返回 `Command` 实例数组）、`destroy` 方法。

### 服务端 Mod

全局单例，启动时加载。在 `config.js` 中注册：

```js
mods: {
  client: {},
  server: { myMod: "../mod/myMod.js" }
}
```

导出对象需包含 `start` 静态方法与 `destroy` 静态方法。

### Command API

`Command` 类提供链式构建：

```js
const { Command } = require("../lib/command");

const greet = new Command("greet")
  .addString("target")
  .setFunc((commander, target) => {
    utils.tell(`你好, ${target || "世界"}!`, commander);
  });
```

支持参数类型：`String`、`Integer`、`Float`、`Boolean`、`Enum`。

### Utils API

`Utils` 为 WebSocket 连接封装了 Minecraft 协议方法：

| 方法 | 说明 |
|---|---|
| `runCommand(command, callback?)` | 在客户端执行指令 |
| `subscribe(event, callback?)` | 订阅游戏事件 |
| `unsubscribe(event)` | 取消订阅 |
| `tell(msg, target?)` | 发送 `tellraw` 消息 |
| `tellAll(msg)` | 广播 `/me` 消息 |

## 项目结构

```
ModLoader-WS-For-MCBE/
├── ws.js              入口，WebSocket 服务与连接处理
├── config.js          运行时配置
├── permission.json    权限数据
├── lib/
│   ├── command.js     命令定义与参数解析
│   ├── current.js     全局连接状态单例
│   ├── logger.js      日志（控制台 + 文件）
│   ├── mods.js        Mod 管理器
│   ├── permission.js  权限读写与查询
│   ├── shared.js      共享日志实例
│   └── utils.js       WebSocket 工具类（协议封装）
└── mod/               Mod 存放目录
```

## 备注
- 该 README.md 文档由** AI **辅助生成
- 本仓库是一个分支
