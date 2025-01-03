# HandiFix

## 简介

HandiFix 是一个用于批量创建 X 定时推文功能的脚本，模拟输入推文内容和时间。

守护每位书局人的双手，远离腱鞘炎。

## 使用方法

1. 安装 Tampermonkey 或类似的浏览器扩展。
2. 将 `main.js` 和 `auto_interact_sequential.js` 文件的内容复制到 Tampermonkey 中。
3. 打开 X 网站，点击 Tampermonkey 扩展中 **守护书局人之定时文本** 和 **守护书局人之一键互动** 的脚本。
4. 按照提示输入推文内容和时间，点击确认按钮即可。
5. 不用的时候可以在 Tampermonkey 中关掉脚本，或者关掉 Tampermonkey 扩展。

## 使用说明

<img src="https://github.com/ozxslackin/handiFix/blob/main/form_description.png" alt="定时文本表单填写说明" style="width: 210px;">

- 定时文本：
  - 文本内容会按照顺序依次发送
  - 先填写定时文本的表单，点击生成后让脚本自己跑
  - 图片是可选的，可以多选，一帖至多一张
  - 当文本数量大于图片，图片再次循环被使用
  - 当图片数量大于文本，靠后的图片不会被使用

- 一键互动：
  - 评论模式（💬，蓝色）：会按照顺序依次点赞、转发、评论
  - 引用模式（✍️，紫色）：会按照顺序依次点赞、转发、引用
  - 转发模式（🔄，绿色）：会按照顺序依次点赞、转发
  - 先填写一键互动的表单
  - 然后鼠标hover到需要互动的帖子，点击出现的闪电按钮即可
  - 需要切换模式点击紫色的模式按钮
  - `auto_interact_sequential.js` 是顺序互动，保存的评论文本按顺序执行，并且仅使用一次

- 补充说明：
  - 安全性：手动打字>handiFix>复制粘贴。handiFix 是模拟手动打字，每输入一个字符，都会模拟键盘按下和抬起的信号，并且字符输入速度是随机的，所以安全性高于复制粘贴。
  - 文本内容可以利用grok生成，然后复制到文本框中
  - 一键互动的随机版不再更新

- **定时文本**的常见问题解决方案
  1. 检查扩展程序是否开启开发者模式
  2. 当前页面是否为Home页，记得刷新页面
  3. 复制脚本需要通过Github的复制按钮而不是手动复制
  4. 油猴管理面板中，脚本是否开启
  5. 重启游览器

## Tampermonkey 的安装与使用

- [安装和使用的教程](https://www.bilibili.com/video/BV1ok4y1x7QH)
- [Tampermonkey 官网](https://www.tampermonkey.net/?locale=zh)

## 问题反馈

- [X：ozxslackin](https://x.com/ozxslackin)
- [邮箱：ozxslackin[at]outlook.com](mailto:ozxslackin@outlook.com)

## 感谢

- 感谢 [@逸夫](https://x.com/wangxiao459251)老师 提供的修改思路和大量的测试。
- 感谢 [@决明子](https://x.com/ss12jeoo)老师 提供的大量的测试。
