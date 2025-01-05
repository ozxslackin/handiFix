# HandiFix

## 简介

HandiFix 是一个用于批量创建 X 定时推文功能的脚本，模拟输入推文内容和时间。

守护每位书局人的双手，远离腱鞘炎。

## 使用方法

1. 安装 Tampermonkey 或类似的浏览器扩展。
2. 将 `scheduled.js` 和 `auto_interact.js` 文件的内容复制到 Tampermonkey 中。
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
  - `auto_interact.js` 是顺序互动，保存的评论文本按顺序执行，并且仅使用一次

## Tampermonkey 的安装与使用

- [安装和使用的教程](https://www.bilibili.com/video/BV1ok4y1x7QH)
- [Tampermonkey 官网](https://www.tampermonkey.net/?locale=zh)
