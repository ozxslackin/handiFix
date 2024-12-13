// ==UserScript==
// @name         爱护每位书局人的双手
// @namespace    https://github.com/ozxslackin/handiFix
// @version      0.1
// @description  批量创建Twitter定时文本
// @author       ozxslackin
// @match        https://x.com/*
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

        <button id="scheduler-generateBtn">生成定时推文</button>
    `;
    document.body.appendChild(form);

    // 设置默认时间（本周六下午8点）
    function getNextSaturday() {
        const now = new Date();
        const nextSaturday = new Date(now);
        nextSaturday.setDate(now.getDate() + (6 - now.getDay() + 7) % 7);
        nextSaturday.setHours(20, 0, 0, 0);
        return nextSaturday;
    }

    // 显示/隐藏表单并设置默认时间
    btn.addEventListener('click', () => {
        const isVisible = form.style.display === 'block';
        form.style.display = isVisible ? 'none' : 'block';
        if (!isVisible) {
            // 设置默认时间
            const defaultTime = getNextSaturday().toISOString().slice(0, 16);
            document.getElementById('scheduler-startTime').value = defaultTime;
        }
    });

    // 修改事件处理部分，使用新的ID
    const generateBtn = form.querySelector('#scheduler-generateBtn');
    if (generateBtn) {
        generateBtn.addEventListener('click', async () => {
            try {
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

                // 生成定时推文
                for (let i = 0; i < tweets.length; i++) {
                    const tweetTime = new Date(startTime.getTime() + i * interval * 60000);

                    // 组合推文内容时保持后缀的格式
                    const tweetContent = tweets[i] + '\n\n' + suffixLines;

                    console.log('-------------------');
                    console.log(`第 ${i + 1} 条推文:`);
                    console.log('时间:', tweetTime.toLocaleString('zh-CN', {
                        timeZone: 'Asia/Shanghai',
                        hour12: false
                    }));
                    console.log('内容:\n', tweetContent);
                    console.log('-------------------');

                    try {
                        await simulateScheduleTweet(tweetContent, tweetTime);
                        await sleep(2000);
                    } catch (error) {
                        console.error(`第 ${i + 1} 条推文发送失败:`, error);
                        const continuePosting = confirm(`第 ${i + 1} 条推文发送失败。是否继续发送剩余推文？`);
                        if (!continuePosting) {
                            break;
                        }
                    }
                }

                // 所有推文处理完后，隐藏表单
                form.style.display = 'none';

            } catch (error) {
                console.error('处理推文时出错:', error);
                alert('处理推文时出错: ' + error.message);
            }
        });
    }

    // 模拟人工操作发布推文
    async function simulateScheduleTweet(content, time) {
        try {
            // 1. 点击发推按钮
            const tweetButton = document.querySelector('[data-testid="tweetButtonInline"]');
            if (!tweetButton) throw new Error('未找到发推按钮');
            tweetButton.click();
            await sleep(1000);

            // 2. 填写内容
            const editorDiv = document.querySelector('[data-testid="tweetTextarea_0"]');
            if (!editorDiv) throw new Error('未找到推文输入框');

            // 聚焦编辑器
            editorDiv.focus();
            await sleep(100);

            // 将内容分割成字符数组，特殊处理换行符
            const chars = Array.from(content);

            // 模拟键盘输入
            for (const char of chars) {
                // 特殊处理换行符
                if (char === '\n') {
                    const enterEvent = new KeyboardEvent('keydown', {
                        key: 'Enter',
                        code: 'Enter',
                        bubbles: true,
                        cancelable: true
                    });
                    editorDiv.dispatchEvent(enterEvent);
                    document.execCommand('insertLineBreak');
                    editorDiv.dispatchEvent(new KeyboardEvent('keyup', {
                        key: 'Enter',
                        code: 'Enter',
                        bubbles: true,
                        cancelable: true
                    }));
                } else {
                    // 普通字符的处理
                    const keydownEvent = new KeyboardEvent('keydown', {
                        key: char,
                        code: `Key${char.toUpperCase()}`,
                        bubbles: true,
                        cancelable: true
                    });
                    editorDiv.dispatchEvent(keydownEvent);

                    const inputEvent = new InputEvent('input', {
                        bubbles: true,
                        cancelable: true,
                        data: char,
                        inputType: 'insertText'
                    });
                    editorDiv.dispatchEvent(inputEvent);

                    document.execCommand('insertText', false, char);

                    const keyupEvent = new KeyboardEvent('keyup', {
                        key: char,
                        code: `Key${char.toUpperCase()}`,
                        bubbles: true,
                        cancelable: true
                    });
                    editorDiv.dispatchEvent(keyupEvent);
                }

                await sleep(10);
            }

            await sleep(500);

            // 3. 点击定时图标
            const scheduleIcon = document.querySelector('[data-testid="scheduleOption"]');
            if (!scheduleIcon) throw new Error('未找到定时图标');
            scheduleIcon.click();
            await sleep(1000);

            // 4. 设置日期和时间
            // 获取所有选择器并按ID排序
            const selectors = Array.from(document.querySelectorAll('select[id^="SELECTOR_"]'))
                .sort((a, b) => {
                    const numA = parseInt(a.id.split('_')[1]);
                    const numB = parseInt(b.id.split('_')[1]);
                    return numA - numB;
                });

            if (selectors.length < 5) {
                throw new Error('未找到完整的时间选择器');
            }

            // 按顺序分配选择器（月、日、年、时、分）
            const [monthSelect, daySelect, yearSelect, hourSelect, minuteSelect] = selectors;

            // 设置择器的值
            const month = (time.getMonth() + 1).toString();
            const day = time.getDate().toString();
            const year = time.getFullYear().toString();
            const hour = time.getHours().toString().padStart(2, '0');
            const minute = time.getMinutes();

            // 模拟选择操作
            const setSelectValue = async (select, value) => {
                if (select === minuteSelect) {
                    select.value = value;
                } else {
                    select.value = value.toString();
                }
                select.dispatchEvent(new Event('change', { bubbles: true }));
                await sleep(200);
            };

            await setSelectValue(monthSelect, month);
            await setSelectValue(daySelect, day);
            await setSelectValue(yearSelect, year);
            await setSelectValue(hourSelect, hour);
            await setSelectValue(minuteSelect, minute);

            await sleep(1000);

            // 5. 点击确认按钮
            const confirmButton = document.querySelector('[data-testid="scheduledConfirmationPrimaryAction"]');
            if (!confirmButton) throw new Error('未找到确认按钮');
            confirmButton.click();
            await sleep(1000);

            // 6. 点击发送推文按钮
            const sendTweetButton = document.querySelector('[data-testid="tweetButtonInline"]');
            if (!sendTweetButton) throw new Error('未找到发送按钮');
            sendTweetButton.click();
            await sleep(1000);

            // 显示成功消息
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

        } catch (error) {
            console.error('设置定时推文失败:', error.message);
            alert(`设置定时推文失败: ${error.message}`);
            throw error;
        }
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
})();
