import os from "os";
import fetch from 'node-fetch';

function getPrivateIp() {
  const interfaces = os.networkInterfaces();

  for (let devName in interfaces) {
    let iface = interfaces[devName];
    for (let i = 0; i < iface.length; i++) {
      let alias = iface[i];
      if (
        alias.family === "IPv4" &&
        alias.address !== "127.0.0.1" &&
        !alias.internal
      ) {
        return alias.address;
      }
    }
  }
  return "";
}

async function getPublicIp(useIPv6) {
  // Type `curl ifconfig.me` in Terminal will give your public IP address
  // https://www.ipify.org
  const endpoint = useIPv6 ? "https://api6.ipify.org" : "https://api.ipify.org";

  const response = await fetch(endpoint);
  return await response.text();
}

(async () => {
  console.log('private ip:', getPrivateIp());
  console.log('public ip:', await getPublicIp());
})()
