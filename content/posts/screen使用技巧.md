---
title: "利用 Screen 保持 VSCode 连接远程任务持续运行"
date: 2026-09-28T20:00:00+08:00
draft: false
tags: [Linux, screen]
categories: [命令行]
description: "利用 Screen 保持 VSCode 连接远程任务持续运行"
showToc: true
TocOpen: true
---
在 Linux 上使用 `screen` 是一种保持进程持续运行的便捷方式，即使用户断开 SSH 连接，进程也不会中断。

我在使用 VSCode 连接 AutoDL 时，曾困惑于如何使进程保持运行，后查阅资料发现可通过 `screen` 命令满足该需求，具体操作如下：

## 一、连接远程服务器

首先使用 VSCode 或者 PyCharm 等工具，连接到目标远程服务器（如 AutoDL）。

## 二、启动一个新的 screen 会话

执行以下命令创建并启动会话：

```bash
screen -S mysession
```

- 参数说明：`-S mysession` 用于为当前会话命名为 “mysession”，便于后续识别和管理会话。

## 三、在 screen 会话中启动你的程序

成功进入 `screen` 会话后，在会话内运行需要持续执行的程序，例如启动 Python 训练脚本：

```bash
python train.py
```

## 四、分离 screen 会话（保持进程运行）

若需断开 SSH 连接但保持程序运行，可通过组合键分离会话：

1. 先按下 `Ctrl + A`（此为 `screen` 命令的固定前缀）；
2. 松开后再按下 `D`（“D” 代表 “detach”，即分离）。

执行后，会话会后台运行，当前程序不会终止。

## 五、查看当前所有 screen 会话

如需了解服务器上已创建的 `screen` 会话，执行命令：

```bash
screen -ls
```

### 输出示例

```
There is a screen on:
        7171.mysession  (11/09/2024 08:39:43 PM)        (Detached)
1 Socket in /run/screen/S-root.
```

- 说明：示例中 `7171` 是会话 ID，`mysession` 是会话名，`Detached` 表示会话当前处于“已分离”状态。

## 六、恢复（重新连接）到 screen 会话

后续需重新操作已后台运行的会话时，可通过会话名或会话 ID 恢复连接：

1. **根据会话名恢复**：
   ```bash
   screen -r mysession
   ```
2. **根据会话 ID 恢复**：
   ```bash
   screen -r 7171
   ```
3. **简化操作**：若当前仅启动了一个 `screen` 会话，直接执行以下命令即可恢复：
   ```bash
   screen -r
   ```

## 七、终止指定 screen 会话

若需停止某个 `screen` 会话及其中的进程，有两种常用方式：

### 方式 1：使用 screen 命令终止

通过会话名或会话 ID 直接终止：

1. **根据会话名**：
   ```bash
   screen -X -S mysession quit
   ```
2. **根据会话 ID**：
   ```bash
   screen -X -S 7171 quit
   ```

### 方式 2：使用 kill 命令杀掉会话进程

通过会话 ID 终止对应进程：

```bash
kill 7171
```
