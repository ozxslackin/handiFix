// ==UserScript==
// @name         守护书局人之一键互动
// @namespace    https://github.com/ozxslackin/handiFix
// @version      0.1.3
// @description  X站帖子自动化互动（点赞->转发->评论），按顺序执行评论并在使用后删除
// @author       ozxslackin
// @match        https://x.com/*
// @updateURL    https://github.com/ozxslackin/handiFix/raw/main/auto_interact.js
// @downloadURL  https://github.com/ozxslackin/handiFix/raw/main/auto_interact.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let interactionMode = localStorage.getItem('ozxInteractionMode') || 'comment'; // 'comment', 'quote' 或 'retweet'

    // 保存模式设置的函数
    function saveInteractionMode(mode) {
        interactionMode = mode;
        localStorage.setItem('ozxInteractionMode', mode);
    }

    // 修改样式，添加特定前缀
    const style = document.createElement('style');
    style.textContent = `
        .ozx-interact-btn {
            position: relative;
            width: 34px;
            height: 34px;
            background: #1d9bf0;
            color: white;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .ozx-comment-config-btn {
            position: fixed;
            right: 20px;
            top: 70px;
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

        .ozx-comment-form {
            position: fixed;
            right: 20px;
            top: 130px;
            background: #ffffff;
            padding: 16px;
            border-radius: 16px;
            box-shadow: rgb(101 119 134 / 20%) 0px 0px 15px;
            z-index: 9999;
            width: 300px;
            display: none;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto;
        }

        .ozx-comment-form textarea {
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

        .ozx-comment-form label {
            display: block;
            margin-bottom: 6px;
            color: rgb(83, 100, 113);
            font-size: 13px;
            font-weight: 500;
        }

        .ozx-comment-form button {
            background: #1d9bf0;
            color: white;
            border: none;
            border-radius: 9999px;
            padding: 8px 16px;
            font-weight: bold;
            cursor: pointer;
            font-size: 14px;
        }

        .ozx-comment-form .ozx-emoji-input {
            min-height: 60px;
        }

        .ozx-comment-form .ozx-note {
            font-size: 12px;
            color: #536471;
            margin-top: -8px;
            margin-bottom: 12px;
        }

        .ozx-button-group {
            position: fixed;
            display: flex;
            flex-direction: column;
            gap: 8px;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.2s;
        }

        .ozx-button-group:hover {
            opacity: 1 !important;
        }

        .ozx-mode-toggle-btn {
            position: fixed;
            right: 120px;  /* 位置在评论文本按钮左边 */
            top: 70px;
            z-index: 9999;
            padding: 8px 16px;
            color: white;
            border: none;
            border-radius: 9999px;
            cursor: pointer;
            font-weight: bold;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .ozx-mode-toggle-btn[data-mode="comment"] { background: #1d9bf0; }
        .ozx-mode-toggle-btn[data-mode="quote"] { background: #794bc4; }
        .ozx-mode-toggle-btn[data-mode="retweet"] { background: #00ba7c; }
    `;
    document.head.appendChild(style);

    // 存储评论配置
    let commentConfig = {
        comments: [],
        suffixes: []
    };

    // 创建评论配置按钮和表单
    const configBtn = document.createElement('button');
    configBtn.className = 'ozx-comment-config-btn';
    configBtn.textContent = '评论文本';
    document.body.appendChild(configBtn);

    const form = document.createElement('div');
    form.className = 'ozx-comment-form';
    form.innerHTML = `
        <label>评论文本（两个换行分隔不同评论）</label>
        <textarea id="comment-content" placeholder="输入评论内容...
每个评论之间用两个换行分隔

保持单个换行会在评论中显示为换行"></textarea>

        <label>评论后缀（每行一个话题or关键词）</label>
        <textarea id="comment-suffix" placeholder="#话题1
#话题2
#话题3"></textarea>

        <button id="save-comment-btn">保存配置</button>
    `;
    document.body.appendChild(form);

    // 修改 loadConfig 函数，添加评论索引的加载
    function loadConfig() {
        const savedConfig = localStorage.getItem('commentConfig');
        if (savedConfig) {
            try {
                commentConfig = JSON.parse(savedConfig);

                // 如果没有currentIndex，初始化为0
                if (!commentConfig.currentIndex) {
                    commentConfig.currentIndex = 0;
                }

                // 填充表单
                document.getElementById('comment-content').value = commentConfig.comments.join('\n\n');
                document.getElementById('comment-suffix').value = commentConfig.suffixes.join('\n');
            } catch (error) {
                console.error('加载配置失败:', error);
            }
        }
    }

    // 修改保存配置的事件处理函数
    document.getElementById('save-comment-btn')?.addEventListener('click', () => {
        const content = document.getElementById('comment-content').value;
        const suffix = document.getElementById('comment-suffix').value;

        // 处理评论内容
        commentConfig.comments = content.split(/\n\s*\n+/)
            .map(comment => comment.trim())
            .filter(comment => comment.length > 0);

        // 重置当前索引
        commentConfig.currentIndex = 0;

        // 处理后缀
        commentConfig.suffixes = suffix.split('\n')
            .map(line => line.trim())
            .filter(line => line);

        // 保存到本地存储
        localStorage.setItem('commentConfig', JSON.stringify(commentConfig));

        form.style.display = 'none';
        alert('配置已保存！评论将从第一条开始执行');
    });

    // 在创建表单后立即加载配置
    document.body.appendChild(form);
    loadConfig();

    // 配置按钮点击事件
    configBtn.addEventListener('click', () => {
        const isVisible = form.style.display === 'block';
        form.style.display = isVisible ? 'none' : 'block';
    });

    // 添加互动按钮到帖子
    function addInteractButton(article) {
        if (article.dataset.ozxProcessed) return;
        if (!isValidArticle(article)) return;
        if (article.querySelector('.ozx-button-group')) return;

        const container = article.closest('[data-testid="cellInnerDiv"]');
        if (!container) return;

        // 创建按钮组容器
        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'ozx-button-group';

        // 创建一键互动按钮
        const interactBtn = document.createElement('button');
        interactBtn.className = 'ozx-interact-btn';
        interactBtn.innerHTML = '⚡';
        interactBtn.title = '一键互动';

        // 添加按钮到按钮组
        buttonGroup.appendChild(interactBtn);

        // 更新按钮组位置的函数
        const updateButtonPosition = () => {
            const rect = article.getBoundingClientRect();
            buttonGroup.style.top = `${rect.top + rect.height/2 - 17}px`; // 调整位置以适应一个按钮
            buttonGroup.style.left = `${rect.right + 10}px`;
            buttonGroup.style.opacity = article.matches(':hover') ? '1' : '0';
        };

        // 初始定位
        updateButtonPosition();

        // 事件监听
        window.addEventListener('scroll', updateButtonPosition, { passive: true });
        window.addEventListener('resize', updateButtonPosition, { passive: true });

        article.addEventListener('mouseenter', () => {
            buttonGroup.style.opacity = '1';
        });
        article.addEventListener('mouseleave', () => {
            buttonGroup.style.opacity = '0';
        });

        // 一键互动按钮点击事件
        interactBtn.addEventListener('click', () => handleInteraction(article));

        document.body.appendChild(buttonGroup);
        article.dataset.ozxProcessed = 'true';

        // 清理函数
        const cleanup = () => {
            window.removeEventListener('scroll', updateButtonPosition);
            window.removeEventListener('resize', updateButtonPosition);
            buttonGroup.remove();
        };

        // 创建 MutationObserver 监听文章元素是否被移除
        const articleObserver = new MutationObserver((mutations) => {
            if (!document.contains(article)) {
                cleanup();
                articleObserver.disconnect();
            }
        });

        articleObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // 检查是否为有效的帖子元素
    function isValidArticle(element) {
        // 检查是否包含必要的互动按钮
        return element.querySelector('[data-testid="reply"], [data-testid="like"]') !== null;
    }

    // 修改 MutationObserver 的处理逻辑，只处理新增的帖子
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    // 只处理未处理过的帖子
                    const articles = Array.from(node.querySelectorAll('[data-testid="tweet"]'))
                        .filter(article => !article.dataset.ozxProcessed);
                    articles.forEach(addInteractButton);

                    // 如果节点本身是未处理的帖子
                    if (node.matches('[data-testid="tweet"]') && !node.dataset.ozxProcessed) {
                        addInteractButton(node);
                    }
                }
            });
        });
    });

    // 开始观察，扩大观察范围
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false
    });

    // 初始化现有帖子的按钮，只处理未理的帖子
    function initializeExistingPosts() {
        const articles = Array.from(document.querySelectorAll('[data-testid="tweet"]'))
            .filter(article => !article.dataset.ozxProcessed);
        articles.forEach(addInteractButton);
    }

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeExistingPosts);
    } else {
        initializeExistingPosts();
    }

    // 减少检查频率
    setInterval(initializeExistingPosts, 5000);

    // 处理互动逻辑
    async function handleInteraction(article) {
        try {
            // 1. 点赞
            const likeBtn = article.querySelector('[data-testid="like"]');
            if (likeBtn && !likeBtn.querySelector('[data-testid="liked"]')) {
                await clickButton(likeBtn);
                await sleep(Math.floor(Math.random() * 201) + 100);
            }

            // 2. 转发
            await handleRepost(article);

            // 3. 根据模式执行不同操作
            switch (interactionMode) {
                case 'comment':
                    // 转发后评论
                    await addComment(article);
                    break;

                case 'quote':
                    // 执行引用
                    await addQuote(article);
                    break;
            }
        } catch (error) {
            console.error('互动过程出错:', error);
            alert('互动过程出错: ' + error.message);
        }
    }

    // 添加一个处理转发的辅助函数
    async function handleRepost(article) {
        const retweetBtn = article.querySelector('[data-testid="retweet"]');
        if (retweetBtn && !retweetBtn.querySelector('[data-testid="retweeted"]')) {
            await clickButton(retweetBtn);

            const retweetOption = await waitForElement(document, '[data-testid="retweetConfirm"]');
            if (retweetOption) {
                await clickButton(retweetOption);
            }
        }
    }

    // 修改评论函数
    async function addComment(article) {
        if (commentConfig.comments.length === 0) {
            alert('没有可用的评论文本了，请添加新的评论！');
            form.style.display = 'block';
            return;
        }

        // 点击回复按钮
        const replyBtn = await waitForElement(article, '[data-testid="reply"]');
        await clickButton(replyBtn);

        // 等待并找到评论输入框
        const editor = await waitForElement(document, '[data-testid="tweetTextarea_0"]');

        // 获取要发送的文本
        const fullComment = getFormattedText();

        // 使用通用函数处理输入和发送
        await inputAndSendText(editor, fullComment);

        // 更新评论配置
        updateCommentConfig();
    }

    // 修改引用函数
    async function addQuote(article) {
        if (commentConfig.comments.length === 0) {
            alert('没有可用的评论文本了，请添加新的评论！');
            form.style.display = 'block';
            return;
        }

        const retweetBtn = await waitForElement(article, '[data-testid="unretweet"]');
        if (retweetBtn) {
            await clickButton(retweetBtn);

            const quoteOption = await waitForElement(document, 'a[role="menuitem"]');
            if (quoteOption) {
                await clickButton(quoteOption);

                // 等待并找到引用输入框
                const editor = await waitForElement(document, '[data-testid="tweetTextarea_0"]');

                // 获取要发送的文本
                const fullQuote = getFormattedText();

                // 使用通用函数处理输入和发送
                await inputAndSendText(editor, fullQuote);

                // 更新评论配置
                updateCommentConfig();
            }
        }
    }

    // 添加新的通用输入发送函数
    async function inputAndSendText(editor, text) {
        if (!editor) throw new Error('未找到输入框');

        // 输入评论内容
        editor.focus();
        await simulateTyping(editor, text);

        // 点击发送按钮
        const sendBtn = await waitForElement(document, '[data-testid="tweetButton"]');
        if (!sendBtn) throw new Error('未找到发送按钮');
        await clickButton(sendBtn);
    }

    // 添加获取格式化文本的辅助函数
    function getFormattedText() {
        const currentComment = commentConfig.comments[commentConfig.currentIndex];
        const suffixes = commentConfig.suffixes
            .map(line => line.trim() + ' ')
            .join('\n');

        return `${currentComment}\n\n${suffixes}`;
    }

    // 添加更新评论配置的辅助函数
    function updateCommentConfig() {
        // 更新评论配置
        commentConfig.comments.splice(commentConfig.currentIndex, 1);

        if (commentConfig.comments.length === 0) {
            commentConfig.currentIndex = 0;
            alert('所有评论已用完，请添加新的评论！');
            form.style.display = 'block';
        } else {
            if (commentConfig.currentIndex >= commentConfig.comments.length) {
                commentConfig.currentIndex = 0;
            }
        }

        localStorage.setItem('commentConfig', JSON.stringify(commentConfig));
    }

    // 模拟打字
    async function simulateTyping(element, text) {
        const chars = Array.from(text);
        // 模拟键盘输入
        for (const char of chars) {
            // 特殊处理换行符
            if (char === '\n') {
                element.dispatchEvent(new KeyboardEvent('keydown', {
                    key: 'Enter',
                    code: 'Enter',
                    bubbles: true,
                    cancelable: true
                }));
                document.execCommand('insertLineBreak');
                element.dispatchEvent(new KeyboardEvent('keyup', {
                    key: 'Enter',
                    code: 'Enter',
                    bubbles: true,
                    cancelable: true
                }));
            } else {
                // 普通字符的处理
                element.dispatchEvent(new KeyboardEvent('keydown', {
                    key: char,
                    code: `Key${char.toUpperCase()}`,
                    bubbles: true,
                    cancelable: true
                }));

                element.dispatchEvent(new InputEvent('input', {
                    bubbles: true,
                    cancelable: true,
                    data: char,
                    inputType: 'insertText'
                }));

                document.execCommand('insertText', false, char);

                element.dispatchEvent(new KeyboardEvent('keyup', {
                    key: char,
                    code: `Key${char.toUpperCase()}`,
                    bubbles: true,
                    cancelable: true
                }));
            }
            await sleep(Math.floor(Math.random() * 51) + 10);
        }
    }

    // 模拟点击
    async function clickButton(button) {
        if (!button) throw new Error('按钮未找到');
        button.click();
        await sleep(Math.floor(Math.random() * 201) + 300);
    }

    // 添加一个等待元素出现的函数
    async function waitForElement(parent, selector, timeout = 3000) {
        const startTime = Date.now();

        while (Date.now() - startTime < timeout) {
            const cur = parent.querySelector(selector);
            await sleep(120); // 等待120ms
            if (cur) {
                return cur;
            }
        }
        throw new Error(`等待元素 ${selector} 超时`);
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 在创建评论配置按钮的部分后添加模式切换按钮
    const modeToggleBtn = document.createElement('button');
    modeToggleBtn.className = 'ozx-mode-toggle-btn';
    modeToggleBtn.dataset.mode = interactionMode;
    modeToggleBtn.innerHTML = `${getModeBtnIcon(interactionMode)}`;
    document.body.appendChild(modeToggleBtn);

    // 添加模式切换按钮的点击事件
    modeToggleBtn.addEventListener('click', () => {
        const modes = ['comment', 'quote', 'retweet'];
        const currentIndex = modes.indexOf(interactionMode);
        const newMode = modes[(currentIndex + 1) % modes.length];

        saveInteractionMode(newMode);
        modeToggleBtn.dataset.mode = newMode;
        modeToggleBtn.innerHTML = getModeBtnIcon(newMode);
    });

    function getModeBtnIcon(mode) {
        switch (mode) {
            case 'comment': return '💬';
            case 'quote': return '✍️';
            case 'retweet': return '🔄';
            default: return '💬';
        }
    }
})();