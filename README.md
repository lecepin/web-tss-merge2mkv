# Web 版 ts 文件合并工具

> 基于 ffmpeg.wasm 实现。

效果同 [tss-merge-to-mkv](https://github.com/lecepin/tss-merge-to-mkv) 一样，但由于 WebAssambly 的限制，目前文件大小不能超过 2GB，速度方面和 PC 的差别也很大。

## 界面

![image](https://user-images.githubusercontent.com/11046969/159157140-80773f0e-f94c-453d-8598-2dbd7eb4bf9f.png)

![image](https://user-images.githubusercontent.com/11046969/159157174-b998828f-8be8-477f-896c-7ac19b5cef9b.png)

![image](https://user-images.githubusercontent.com/11046969/159157188-17db243b-fe41-4566-97bf-fb9a8acf1048.png)

## 测试

可以下载 [ts测试](https://gw.alipayobjects.com/os/bmw-prod/a52880bb-bdf7-4c60-b3f1-07a3fd78491b.zip) 文件，解压后，尝试合并。

## 部署

由于使用到 SharedArrayBuffer 的问题（[详情](https://developer.chrome.com/blog/enabling-shared-array-buffer/#cross-origin-isolation)），所以部署上需要额外添加一些 Http Header。

下面以比较简单的两种方式实现。

### NodeJS Express 方式

在构建好的文件目录，创建 `server.js`，内容如下：

```js
const express = require("express");

const app = express();

app.use((_, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  next();
});
app.use(express.static(__dirname));

app.listen(3000, () => {
  console.log("listening on port 3000");
});
```

安装一下 express，执行 `npm i express`。

然后执行 `node server.js` 就可以了。


### PHP 方式

把 `index.html` 重命名为 `index.php`，在文件的最上方添加如下代码即可：

```php
<?php
header('Cross-Origin-Embedder-Policy: require-corp');
header('Cross-Origin-Opener-Policy: same-origin');
?>
```
