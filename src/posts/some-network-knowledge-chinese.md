---
layout: "../layouts/BlogPost.astro"
title: "Some network knowledge (in Chinese)"
slug: some-network-knowledge-chinese
description: ""
added: "May 21 2022"
tags: [other]
updatedDate: "Apr 03 2023"
---

### 光纤入户  
光纤 - 光猫 - 网线 - 路由器 - 网络设备

![光猫举例](https://raw.githubusercontent.com/kexiZeroing/blog-images/main/e6c9d24ely1h2g95qm9ixj20dw0afmyb.jpg)

连接到光纤线的设备就是光猫。路由器是自己买的设备，一般有一个 WAN 口，数个 LAN 口，一般应使用 WAN 口连接光猫。

光猫原本只是一个光电信号转换器，不需要多少性能。现在光猫大多附带了路由和 WiFi 功能，拨号设置好后就可以上网了。运营商免费租用给用户的光猫显然要求成本尽可能的低，启用路由和无线功能之后，光猫负荷较大。虽然短时间工作或者数据吞吐量比较小的时候，光猫还能够应付，一旦长时间连续工作、带机数量比较多、或者进行大数据量下载传输操作的时候，就有可能出现网速不稳定、带宽不达标、网络延迟升高、丢包率高等现象。

一般带路由功能的光猫只有两根天线，连接设备数有限制且容易掉线，WiFi 信号覆盖范围小，固件功能缺失，缺少常用的管理功能。解决方法就是外接路由器进行扩展，关闭光猫自带的路由功能，上网直接连接外接的路由器，减轻光猫负担。通常会让配置比较好的一方来路由，比如光猫配置比路由器好，就让光猫拨号，如果光猫配置很烂，就把光猫设置成桥接，然后用路由器拨号。比如移动宽带默认是移动光猫拨号，使用的路由模式。将光猫改为桥接模式，让光猫只做光转换，其他的事情交给路由器来做。如果家里的宽带是 100 兆及以下，选择端口百兆的路由器就够用了，如果宽带升级到 200 兆以上，要选择千兆的路由器。

光猫桥接，关闭光猫原有 WiFi 功能，使用自己的路由器进行拨号。如果网络需求不高，可以不关闭光猫的路由功能，保持光猫拨号，这是绝大部分人的做法。因为光猫桥接并不好做，需要运营商的配合，还要有一定的动手能力。光猫桥接后，必须记住的就是自己的宽带账号和密码，以后更换路由器，都需要手工输入这个账号和密码，让路由器进行拨号。

### 智能家居
大部分的智能家居设备都只支持 2.4G 的无线网络。2.4G 无线的覆盖范围更大，随距离衰减小，对于智能家居设备来说，连接到网络就可以，对于网络速度要求不高，对延迟等要求也不高。

> 5G 通信和 5Ghz WiFi 不是一回事，5G 通信是 5th Generation mobile networks，第五代移动网络的简称，是指蜂窝移动通信技术（户外移动通信）。而 5G 无线网络指的是 WiFi 标准中的 5GHz，是指采用了 5GHz 频段传输数据的 WiFi 信号（室内无线终端上网）。同时支持 2.4 GHz 和 5GHz 的宽带路由器称为双频无线路由器。

![WiFi标准](https://raw.githubusercontent.com/kexiZeroing/blog-images/main/e6c9d24ely1h2g9m6o073j20o104hdgw.jpg)

将路由器的无线信号，改为 2.4G 和 5G 的分离信号，不要使用融合信号。比如一个名字是 ABC，一个是 ABC_5G，其中 ABC 是 2.4G 无线。ABC_2.4G 给智能设备使用（可以设置一个独立的密码），让这些设备连接 2.4G 的无线，用来获得更大的覆盖距离。而 ABC_5G 给手机电脑使用，可以获得更好的无线速度，更低的延迟。

APP 管理智能设备，只需要 APP 的手机可以联网，智能设备联网即可。当智能家居设备用 2.4G 频段，而手机电脑平板用 5G 频段时，它们依然在同一个路由器下，处在同一网段，完全可以直接设置，不需要切换到 2.4G 频段去设置。

在移动光猫的设置里，开启 2.4G 的无线网络叫做 “SSID 使能”（应该是 enable 翻译过来的），SSID 名称就是你给自己无线网络所取的名字。开启 SSID 后会在无线列表中看到路由器设置的无线名称，关闭后则看不到。

### 为什么上不去 Google
GFW 实现网络封锁的手段主要包括 dns 劫持和 ip 封锁。IP 是网络上各主机的地址，dns 将域名和 IP 关联起来，形成映射。而 GFW 所做的就是站在用户和 dns 服务器之间，破坏它们的正常通讯，并向用户回传一个假 ip，也就访问不到本想访问的网站了。dns 劫持是 GFW 早期的技术手段，用户通过修改 Hosts 文件就可以突破封锁。dns 劫持之后，GFW 引入了 IP 封锁，直接锁住了访问目标网站的去路，用户发往被封锁 IP 的任何数据都会被墙截断。这个时候只能依靠在第三方架设服务器，代理与目标服务器间的来往，目前几乎所有的过墙手段都是基于这个原理。

假设我们有一台国外 A 中转服务器，可以通过 SSH 被国内 B 机器连接，那么理论上，A 能做的事情，B 也能做到，因为有一条网络通路，即所谓的隧道技术。用户和境外服务器基于 SSH 建立起一条加密的通道，SSH 客户端侦听本地的端口并转发请求到服务端处理，通过 SSH Server 向真实的服务发起请求，服务最后通过创建好的隧道返回给用户。由于 SSH 本身基于 RSA 加密，所以 GFW 无法从数据传输过程中的加密数据内容进行关键词分析，请求被放行。但由于创建隧道和数据传输的过程中，VPN 代理的特征是明显的或者说过墙的数据都遵循特定的套路（先发送一个建立加密通道的数据包，然后紧跟着一个代理请求），所以 GFW 一度通过分析连接的特征进行干扰，导致 SSH 存在被定向进行干扰的问题。

Shadowsocks 的出现是一个拐点，它把代理服务器拆分成 server 端和 client 端，经过 GFW 的流量全部加密，从而消除明显的流量特征。在服务器端部署完成后，按照指定的密码、加密方式和端口，使用客户端软件与其连接。在成功连接到服务器后，客户端会在用户的电脑上构建一个本地 Socks5 代理。浏览网络时，网络流量会被分到本地 Socks5 代理，客户端将其在本地加密之后发送到服务器，服务器以同样的加密方式将流量回传给客户端，以此实现代理上网。ss-local 一般是本机或局域网的其他机器，不经过 GFW，所以不会被 GFW 通过特征分析进行干扰。ss-local 和 ss-server 两端通过多种加密方法进行通讯，经过 GFW 的时候是常规的 TCP 包，没有明显的特征码而且 GFW 也无法对通讯数据进行解密。

收费的是什么？当使用 ss 代理访问网站的时候，请求会被转发到 Shadowsocks 服务端上，再由它请求我们的目标网站。其原理就是在国外的服务器上装了 Shadowsocks 的服务，再开出一些端口和密码供客户端连接，那么这些端口和密码可能是别人免费提供的，或者收费的，或者自己买 VPS 服务器搭建的。

- VPS (virtual private server)，可以把它简单地理解为一台在远端的强劲电脑。当你租用了它以后，可以给它安装操作系统、软件，并通过一些工具连接和远程操控它（[一键完成 VPS 裸机的代理程序安装](https://github.com/barretlee/proxyer)），比如 Vultr、搬瓦工都是 VPS 服务器提供商。
- Shadowsocks 是一个 project，是一种传输协议（ShadowsocksR, V2Ray, Trojan 也都是协议），分为 client 端和 server 端，实现了两端之间的加密数据传输，它不是一个具体的软件或工具。
- 相比服务器端的安装需要配置和部署等，客户端的安装就简单许多，大多数用户只需要这一步。比如 ClashX，Trojan-QT5，TrojanX 均为 Mac 客户端，不同客户端主要是界面区别，选择一个使用即可。可以在订阅服务网站的帮助中心找到『Trojan 服务客户端设置教程索引』或者参考文档：https://github.com/Shadowsocks-Wiki/shadowsocks
- 浏览器、邮件、文件传输都是在应用层；Shadowsocks、V2Ray 等 Socks5 类型的代理都是在会话层，所以可以代理应用层的数据；游戏数据是直接通过传输层协议 TCP 和 UDP 进行通讯的，不经过会话层，所以正常情况下 Socks5 是不能代理游戏通讯数据的（即使开了全局代理）；PING、TRACE 这些 ICMP 指令都是在网络层，也不通过 Socks5 代理转发；而主流的 VPN 协议都是在数据链路层，近乎所有的流量都可以被 VPN 代理。

> 可能遇到的服务调整：*由于防火墙升级，当前默认的节点端口已更改至 xxx，请更新订阅或手动修改节点端口至 xxx。* 在 Config 里找到 yaml 配置文件，将里面所有订阅项的端口改为 xxx，然后点击 Reload config 即可。

### 带宽 时延 丢包
People think more bandwidth will make your Internet connection seem faster, but that isn't even close to the whole story. There are three interrelated things you need to care about:
- bandwidth
- latency
- packet loss

Bandwidth means, once things get going, how fast you can download. But "once things get going" can take a really long time. In fact, it can take longer than the whole download! This is especially true for simple web pages, or web pages made up of a bunch of tiny pieces, which is very common on today's web.

That's where latency comes in. Latency is the time it takes to make a round trip to the server. Really good web designers know how to minimize the number of round trips, or at least do more round trips at the same time - which makes their pages load faster on everyone's connection. But every web page, whether optimized or not, automatically benefits pretty much proportionally to your network latency. Cut latency in half, and most pages will load about twice as fast.

Packet loss is the third component, and it's often forgotten. If you run the 'ping' program, which most people don't do and which is hard or impossible to do from many modern Internet devices (phones, tablets, etc), it will show you how many packets are dropped, and how many got through. And it's not that useful anyway, since real web pages don't see "packet loss." On the web (and any TCP-based protocol), packet loss translates into packet retransmissions, which means latency in some cases is 2, 3, or more times higher than usual.

### JS 网络测速
The `Navigator.connection` read-only property returns a [NetworkInformation](https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation) object containing information about the system's connection, such as the current bandwidth of the user's device or whether the connection is metered. *(experimental technology)* 

- `navigator.connection.type`: The type of connection a device is using to communicate with the network. 
- `navigator.connection.effectiveType`: Effective connection type meaning one of 'slow-2g', '2g', '3g', or '4g'.
- `navigator.connection.saveData`: Data-saver enabled/disabled

If you have large assets that are critical for initial rendering, you can use different variations of the same resource depending on the user's connection. For example, you can display an image instead of a video for any connection speeds lower than 4G:

```js
if (navigator.connection && navigator.connection.effectiveType) {
  if (navigator.connection.effectiveType === '4g') {
    // Load video
  } else {
    // Load image
  }
}
```

`ping` 表示给目标 IP 地址发送一个 ICMP 报文，再要求对方返回一个大小相同的数据包来确定两台网络机器是否能正常通信以及有多少时延。JS 无法真正原生地测量 ping 值，但可以通过请求一个尽量小的资源来模拟发送报文，记录发起请求到收到返回值的时间差。请求的内容可以是网站的 `favicon.ico`，一个空文件或者一个空接口。然后多次测量 ping 值就可以得出网络波动情况。

```js
const Dashboard = React.memo(() => {
  const [ping, setPing] = useState<number>(0);
  const [count, setCount] = useState<number>(0);
  const [pingList, setPingList] = useState<number[]>([]);
  const [jitter, setJitter] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      const img = new Image();
      const startTime = new Date().getTime();
      // 此处选择加载 github 的 favicon
      img.src = `https://github.com/favicon.ico?d=${startTime}`;
      img.onload = () => {
        const endTime = new Date().getTime();
        const delta = endTime - startTime;
        
        if ((count + 1) % 5 === 0) {
          // 抖动: 取五次测量结果的最大最小值求差，可以看出网络的波动情况，差值越小代表网络越稳定
          const maxPing = Math.max(delta, ...pingList);
          const minPing = Math.min(delta, ...pingList);
          setJitter(maxPing - minPing);
          setPingList([]);
        } else {
          setPingList(lastList => [...lastList, delta]);
        }
        setCount(count + 1);
        setPing(delta);
      };
      img.onerror = err => {
        console.log('error', err);
      };
    }, 3000);
    return () => clearInterval(timer);
  }, [count, pingList]);

  return (
    <div>
      <h1>PING: {ping}ms</h1>
      <h1>抖动: {jitter}ms</h1>
    </div>
  );
});
```
