// ==UserScript==
// @name         守护书局人之定时文本
// @namespace    https://github.com/ozxslackin/handiFix
// @version      0.1.7
// @description  批量创建X定时文本
// @author       ozxslackin
// @match        https://x.com/home
// @match        https://x.com
// @updateURL    https://github.com/ozxslackin/handiFix/raw/main/main.js
// @downloadURL  https://github.com/ozxslackin/handiFix/raw/main/main.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 创建样式
    const style = document.createElement('style');
    style.textContent = `
        .scheduler-btn {
            position: fixed;
            right: 20px;
            top: 20px;
            z-index: 9999;
            padding: 8px 16px;
            background: #1d9bf0;
            color: white;
            border: none;
            border-radius: 9999px;
            cursor: pointer;
            font-weight: bold;
            font-size: 14px;
        }

        .scheduler-form {
            position: fixed;
            right: 20px;
            top: 70px;
            background: #ffffff;
            padding: 16px;
            border-radius: 16px;
            box-shadow: rgb(101 119 134 / 20%) 0px 0px 15px, rgb(101 119 134 / 15%) 0px 0px 3px 1px;
            z-index: 9999;
            width: 300px;
            display: none;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }

        .scheduler-form input {
            width: 100%;
            margin-bottom: 12px;
            padding: 8px;
            border: 1px solid rgb(207, 217, 222);
            border-radius: 4px;
            font-size: 14px;
            box-sizing: border-box;
        }

        .scheduler-form textarea {
            width: 100%;
            margin-bottom: 12px;
            padding: 8px;
            border: 1px solid rgb(207, 217, 222);
            border-radius: 4px;
            font-size: 14px;
            resize: vertical;
            min-height: 80px;
            box-sizing: border-box;
        }

        .scheduler-form label {
            display: block;
            margin-bottom: 6px;
            color: rgb(83, 100, 113);
            font-size: 13px;
            font-weight: 500;
        }

        .scheduler-form button {
            background: #1d9bf0;
            color: white;
            border: none;
            border-radius: 9999px;
            padding: 8px 16px;
            font-weight: bold;
            cursor: pointer;
            font-size: 14px;
            margin-top: 8px;
        }

        .scheduler-form button:hover {
            background: #1a8cd8;
        }

        .scheduler-form #content {
            min-height: 120px;
            font-family: inherit;
            line-height: 1.5;
        }

        .scheduler-form #suffix {
            min-height: 80px;
            font-family: inherit;
            line-height: 1.5;
        }

        .scheduler-form .image-upload {
            margin-bottom: 12px;
        }

        .scheduler-form .image-count {
            color: rgb(83, 100, 113);
            font-size: 13px;
            margin-top: 4px;
        }

        .scheduler-form button.stop-btn {
            background: #ff7a00;
        }

        .scheduler-form button.stop-btn:hover {
            background: #ff6b00;
        }
    `;
    document.head.appendChild(style);

    // 创建按钮
    const btn = document.createElement('button');
    btn.className = 'scheduler-btn';
    btn.textContent = '定时发文';
    document.body.appendChild(btn);

    // 创建表单
    const form = document.createElement('div');
    form.className = 'scheduler-form';
    form.innerHTML = `
        <label>起始时间（注意你在推特的时区）</label>
        <input type="datetime-local" id="scheduler-startTime">

        <label>发布间隔（分钟）</label>
        <input type="number" id="scheduler-interval" value="5">

        <label>推文内容（两个换行分隔不同推文）</label>
        <textarea id="scheduler-content" placeholder="输入推文内容...
每个推文之间用两个换行分隔

保持单个换行会在推文中显示为换行"></textarea>

        <label>推文后缀（每行一个话题or关键词）</label>
        <textarea id="scheduler-suffix" placeholder="#话题1
#话题2
#话题3"></textarea>

        <label>选择图片（可多选，一帖至多一张）</label>
        <input type="file" id="scheduler-images" multiple accept="image/*" class="image-upload">
        <div id="image-count" class="image-count"></div>

        <button id="scheduler-generateBtn">生成定时推文</button>
    `;
    document.body.appendChild(form);

    // 修改 getNextSaturday 函数
    function getNextSaturday() {
        // 获取当前时间
        const now = new Date();

        // 获取用户时区偏移（分钟）
        const userOffset = -now.getTimezoneOffset();
        // 东八区偏移（分钟）
        const targetOffset = 8 * 60;
        // 计算时差（分钟）
        const diffMinutes = targetOffset - userOffset;

        // 计算到下个周六的天数
        const daysToSaturday = (6 - now.getDay() + 7) % 7;
        const nextSaturday = new Date(now.getTime() + daysToSaturday * 24 * 60 * 60 * 1000);

        // 设置为晚上8点，并根据时区调整
        nextSaturday.setHours(20, 0, 0, 0);
        nextSaturday.setMinutes(nextSaturday.getMinutes() - diffMinutes);

        return nextSaturday;
    }

    // 显示/隐藏表单并设置默认时间
    btn.addEventListener('click', () => {
        const isVisible = form.style.display === 'block';
        form.style.display = isVisible ? 'none' : 'block';
        if (!isVisible) {
            // 设置默认时间，使用本地时区格式
            const defaultTime = getNextSaturday().toLocaleString('sv').replace(' ', 'T').slice(0, 16);
            document.getElementById('scheduler-startTime').value = defaultTime;

            // 显示对应的东八区时间（用于参考）
            const chinaTime = new Date(getNextSaturday().getTime());
            const chinaTimeString = chinaTime.toLocaleString('zh-CN', {
                timeZone: 'Asia/Shanghai',
                hour12: false
            });
            console.log('对应的北京时间：', chinaTimeString);
        }
    });

    // 添加状态追踪变量
    let isGenerating = false;
    let shouldStop = false;

    // 修改生成按钮的处理逻辑
    const generateBtn = form.querySelector('#scheduler-generateBtn');
    if (generateBtn) {
        generateBtn.addEventListener('click', async () => {
            if (isGenerating) {
                // 如果正在生成，点击按钮则停止
                shouldStop = true;
                generateBtn.disabled = true;
                generateBtn.textContent = '正在停止...';
                return;
            }

            try {
                // 设置生成状态
                isGenerating = true;
                shouldStop = false;
                generateBtn.classList.add('stop-btn');
                generateBtn.textContent = '点击停止';

                const startTimeInput = document.getElementById('scheduler-startTime').value;
                const startTime = new Date(startTimeInput);
                const interval = parseInt(document.getElementById('scheduler-interval').value);

                // 处理后缀，确保每行后面有空格
                const suffix = document.getElementById('scheduler-suffix').value;
                const suffixLines = suffix.split('\n')
                    .map(line => line.trim())
                    .filter(line => line)
                    .map(line => line + ' ')  // 在每行末尾添加空格
                    .join('\n');

                // 处理推文内容
                let content = document.getElementById('scheduler-content').value;
                console.log('原始内容:', content); // 调试日志

                // 确保内容不为空
                if (!content || content.trim() === '') {
                    alert('请输入推文内容');
                    return;
                }

                // 规范化换行符
                content = content.replace(/\r\n/g, '\n');

                // 分割推文，保持每条推文原有的格式
                const tweets = content.split(/\n\s*\n+/)
                    .map(tweet => tweet.trim())
                    .filter(tweet => tweet.length > 0);

                console.log('处理后的推文数组:', tweets); // 调试日志

                if (tweets.length === 0) {
                    alert('未能正确分割推文内容');
                    return;
                }

                // 检查发推前的编辑框状态
                const initialTweetButton = document.querySelector('[data-testid="tweetButtonInline"]');
                if (initialTweetButton && !initialTweetButton.disabled) {
                    throw new Error('请先清空编辑框内的内容再继续操作');
                }

                // 添加 tweetIndex 用于追踪当前是第几条推文
                let tweetIndex = 0;

                // 生成定时推文
                for (let i = 0; i < tweets.length; i++) {
                    const tweetTime = new Date(startTime.getTime() + i * interval * 60000);
                    const tweetContent = tweets[i] + '\n\n' + suffixLines;

                    tweetIndex = i; // 更新当前推文索引

                    try {
                        await simulateScheduleTweet(tweetContent, tweetTime, tweetIndex);
                        await sleep(Math.floor(Math.random() * 301) + 1800);
                    } catch (error) {
                        if (error.message === '用户手动停止了操作') {
                            break;
                        }
                        console.error(`第 ${i + 1} 条推文发送失败:`, error);
                        const continuePosting = confirm(`第 ${i + 1} 条推文发送失败。是否继续发送剩余推文？`);
                        if (!continuePosting) {
                            break;
                        }
                    }
                }

                // 重置按钮状态
                generateBtn.classList.remove('stop-btn');
                generateBtn.textContent = '生成定时推文';
                generateBtn.disabled = false;

                // 如果不是因为手动停止而结束，则隐藏表单
                if (!shouldStop) {
                    form.style.display = 'none';
                }

            } catch (error) {
                console.error('处理推文时出错:', error);
                alert('处理推文时出错: ' + error.message);
            } finally {
                // 重置状态
                isGenerating = false;
                shouldStop = false;
                generateBtn.classList.remove('stop-btn');
                generateBtn.textContent = '生成定时推文';
                generateBtn.disabled = false;
            }
        });
    }

    // 添加图片上传处理逻辑
    let selectedImages = [];

    const imageInput = document.getElementById('scheduler-images');
    const imageCount = document.getElementById('image-count');

    if (imageInput) {
        imageInput.addEventListener('change', (e) => {
            selectedImages = Array.from(e.target.files);
            imageCount.textContent = `已选择 ${selectedImages.length} 张图片`;
        });
    }

    // 添加一个等待元素出现的函数
    async function waitForElement(selector, timeout = 10000) {
        const startTime = Date.now();

        while (Date.now() - startTime < timeout) {
            const element = document.querySelector(selector);
            await sleep(100); // 等待100ms
            if (element) {
                return element;
            }
        }
        throw new Error(`等待元素 ${selector} 超时`);
    }

    // 修改 simulateScheduleTweet 函数中的相关等待部分
    async function simulateScheduleTweet(content, time, tweetIndex) {
        try {
            if (shouldStop) throw new Error('用户手动停止了操作');

            // 1. 检查是否在编辑页面，如果不在则等待并点击浮动按钮
            let editorDiv = document.querySelector('[data-testid="tweetTextarea_0"]');
            if (!editorDiv) {
                // 等待浮动按钮出现（最多等待10秒）
                const floatingButton = await waitForElement('a[data-testid="FloatingActionButtons_Tweet_Button"]');
                floatingButton.click();

                // 等待编辑框出现
                editorDiv = await waitForElement('[data-testid="tweetTextarea_0"]');
            }

            if (shouldStop) throw new Error('用户手动停止了操作');

            // 2. 处理图片上传
            if (selectedImages.length > 0) {
                const imageInput = await waitForElement('input[type="file"][accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime"]', 60000);
                const imageIndex = tweetIndex % selectedImages.length;

                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(selectedImages[imageIndex]);
                imageInput.files = dataTransfer.files;
                await imageInput.dispatchEvent(new Event('change', { bubbles: true }));
                await waitForElement('[data-testid="attachments"]');
            }

            // 3. 填写推文内容
            editorDiv = await waitForElement('[data-testid="tweetTextarea_0"]');
            await simulateTyping(editorDiv, content);

            // 4. 点击定时图标
            const scheduleIcon = await waitForElement('[data-testid="scheduleOption"]');
            scheduleIcon.click();
            await sleep(500);

            // 5. 设置时间
            // 检测是移动端还是桌面端
            const isMobile = await checkIfMobile();
            if (isMobile) {
                await setMobileScheduleTime(time);
            } else {
                await setDesktopScheduleTime(time);
            }

            // 6. 点击确认和发送
            const confirmButton = await waitForElement('[data-testid="scheduledConfirmationPrimaryAction"]');
            confirmButton.click();
            await sleep(500);

            // 根据平台选择不同的发送按钮
            const tweetButton = isMobile ?
                await waitForElement('[data-testid="tweetButton"]') :
                await waitForElement('[data-testid="tweetButtonInline"]');
            tweetButton.click();

            await waitForElementToDisappear('[data-testid="toolBar"] [role="progressbar"]');

            // 记录成功信息
            logScheduleSuccess(time);

            // 确保回到主页面
            await ensureReturnToHome();

        } catch (error) {
            handleScheduleError(error);
        }
    }

    // 新增：确保返回主页面的函数
    async function ensureReturnToHome() {
        try {
            // 检查是否已经在主页
            const homeButton = await waitForElement('a[data-testid="AppTabBar_Home_Link"]');
            if (homeButton) {
                // 如果不在主页（通过检查URL或其他标志），则点击主页按钮
                const currentPath = window.location.pathname;
                if (currentPath !== '/home' && currentPath !== '/') {
                    homeButton.click();
                    await sleep(1000);
                }
            }

            // 等待浮动按钮重新出现（为下一次发送做准备）
            await waitForElement('a[data-testid="FloatingActionButtons_Tweet_Button"]');
        } catch (error) {
            console.warn('返回主页面时出现问题:', error);
            // 不抛出错误，让脚本继续运行
        }
    }

    // 新增：检查是否为移动端
    async function checkIfMobile() {
        try {
            // 通过检查日期输入框来判断是否为移动端
            const dateInput = await waitForElement('input[type="date"]');
            return !!dateInput;
        } catch {
            return false;
        }
    }

    // 新增：移动端时间设置
    async function setMobileScheduleTime(time) {
        // 格式化日期和时间
        const dateStr = time.toISOString().split('T')[0];
        const timeStr = time.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit'
        });

        // 设置日期
        const dateInput = await waitForElement('input[type="date"]');
        dateInput.value = dateStr;
        dateInput.dispatchEvent(new Event('change', { bubbles: true }));
        await sleep(200);

        // 设置时间
        const timeInput = await waitForElement('input[type="time"]');
        timeInput.value = timeStr;
        timeInput.dispatchEvent(new Event('change', { bubbles: true }));
        await sleep(200);
    }

    // 新增：桌面端时间设置
    async function setDesktopScheduleTime(time) {
        const selectors = Array.from(document.querySelectorAll('select[id^="SELECTOR_"]'))
            .sort((a, b) => parseInt(a.id.split('_')[1]) - parseInt(b.id.split('_')[1]));

        if (selectors.length < 5) {
            throw new Error('未找到完整的时间选择器');
        }

        const [monthSelect, daySelect, yearSelect, hourSelect, minuteSelect] = selectors;

        // 设置各个选择器的值
        await setSelectValue(monthSelect, (time.getMonth() + 1).toString());
        await setSelectValue(daySelect, time.getDate().toString());
        await setSelectValue(yearSelect, time.getFullYear().toString());
        await setSelectValue(hourSelect, time.getHours());
        await setSelectValue(minuteSelect, time.getMinutes());
    }

    // 辅助函数：设置选择器值
    async function setSelectValue(select, value) {
        select.value = value.toString();
        select.dispatchEvent(new Event('change', { bubbles: true }));
        await sleep(Math.floor(Math.random() * 50) + 10);
    }

    // 辅助函数：模拟打字
    async function simulateTyping(element, text) {
        const chars = Array.from(text);
        for (const char of chars) {
            if (char === '\n') {
                await simulateEnterKey(element);
            } else {
                await simulateCharacterInput(element, char);
            }
            await sleep(5);
        }
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 添加新的辅助函数：等待元素消失
    async function waitForElementToDisappear(selector, timeout = 60000) {
        if (shouldStop) throw new Error('用户手动停止了操作');
        const startTime = Date.now();

        while (Date.now() - startTime < timeout) {
            const element = document.querySelector(selector);
            if (!element) {
                return true;
            }
            await sleep(300);
        }
        throw new Error(`等待元素 ${selector} 消失超时`);
    }

    // 辅助函数：模拟回车键
    async function simulateEnterKey(element) {
        element.focus();

        const enterEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            bubbles: true,
            cancelable: true
        });
        element.dispatchEvent(enterEvent);

        document.execCommand('insertLineBreak');

        element.dispatchEvent(new KeyboardEvent('keyup', {
            key: 'Enter',
            code: 'Enter',
            bubbles: true,
            cancelable: true
        }));
    }

    // 辅助函数：模拟单个字符输入
    async function simulateCharacterInput(element, char) {
        element.focus();

        // 按键按下事件
        const keydownEvent = new KeyboardEvent('keydown', {
            key: char,
            code: `Key${char.toUpperCase()}`,
            bubbles: true,
            cancelable: true
        });
        element.dispatchEvent(keydownEvent);

        // 输入事件
        const inputEvent = new InputEvent('input', {
            bubbles: true,
            cancelable: true,
            data: char,
            inputType: 'insertText'
        });
        element.dispatchEvent(inputEvent);

        // 执行插入文本命令
        document.execCommand('insertText', false, char);

        // 按键抬起事件
        const keyupEvent = new KeyboardEvent('keyup', {
            key: char,
            code: `Key${char.toUpperCase()}`,
            bubbles: true,
            cancelable: true
        });
        element.dispatchEvent(keyupEvent);
    }

    // 还需要添加成功记录和错误处理函数
    function logScheduleSuccess(time) {
        const options = {
            timeZone: 'Asia/Shanghai',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        };
        const chinaTimeString = time.toLocaleString('zh-CN', options);
        console.log(`成功设置定时推文：${chinaTimeString}`);
    }

    function handleScheduleError(error) {
        if (error.message === '用户手动停止了操作') {
            console.log('操作被用户终止');
        } else {
            console.error('设置定时推文失败:', error.message);
            alert(`设置定时推文失败: ${error.message}`);
        }
        throw error;
    }
})();
