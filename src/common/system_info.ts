// Copyright (C) 2022 MCSManager <mcsmanager-dev@outlook.com>

import os from "os";
import osUtils from "os-utils";
import fs from "fs";
// import systeminformation from "systeminformation";

interface IInfoTable {
  [key: string]: number;
}

interface ISystemInfo {
  cpuUsage: number;
  memUsage: number;
  totalmem: number;
  freemem: number;
  type: string;
  hostname: string;
  platform: string;
  release: string;
  uptime: number;
  cwd: string;
  processCpu: number;
  processMem: number;
  loadavg: number[];
}

// 系统详细信息每一段时间更新一次
const info: ISystemInfo = {
  type: os.type(),
  hostname: os.hostname(),
  platform: os.platform(),
  release: os.release(),
  uptime: os.uptime(),
  cwd: process.cwd(),
  loadavg: os.loadavg(),
  freemem: 0,
  cpuUsage: 0,
  memUsage: 0,
  totalmem: 0,
  processCpu: 0,
  processMem: 0
};

// 定时刷新缓存
setInterval(() => {
  if (os.platform() === "linux") {
    return setLinuxSystemInfo();
  }
  if (os.platform() === "win32") {
    return setWindowsSystemInfo();
  }
  return otherSystemInfo();
}, 3000);

function otherSystemInfo() {
  info.freemem = os.freemem();
  info.totalmem = os.totalmem();
  info.memUsage = (os.totalmem() - os.freemem()) / os.totalmem();
  osUtils.cpuUsage((p) => (info.cpuUsage = p));
}

function setWindowsSystemInfo() {
  info.freemem = os.freemem();
  info.totalmem = os.totalmem();
  info.memUsage = (os.totalmem() - os.freemem()) / os.totalmem();
  osUtils.cpuUsage((p) => (info.cpuUsage = p));
}

function setLinuxSystemInfo() {
  try {
    // 基于 /proc/meminfo 的内存数据读取
    const data = fs.readFileSync("/proc/meminfo", { encoding: "utf-8" });
    const list = data.split("\n");
    const infoTable: IInfoTable = {};
    list.forEach((line) => {
      const kv = line.split(":");
      if (kv.length === 2) {
        const k = kv[0].replace(/ /gim, "").replace(/\t/gim, "").trim().toLowerCase();
        let v = kv[1].replace(/ /gim, "").replace(/\t/gim, "").trim().toLowerCase();
        v = v.replace(/kb/gim, "").replace(/mb/gim, "").replace(/gb/gim, "");
        let vNumber = parseInt(v);
        if (isNaN(vNumber)) vNumber = 0;
        infoTable[k] = vNumber;
      }
    });
    const memAvailable = infoTable["memavailable"] ?? infoTable["memfree"];
    const memTotal = infoTable["memtotal"];
    info.freemem = memAvailable * 1024;
    info.totalmem = memTotal * 1024;
    info.memUsage = (info.totalmem - info.freemem) / info.totalmem;
    osUtils.cpuUsage((p) => (info.cpuUsage = p));
  } catch (error) {
    // 若读取错误，则自动采用默认通用读取法
    otherSystemInfo();
  }
}

export function systemInfo() {
  return info;
}
