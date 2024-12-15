// ==UserScript==
// @name         守护书局人之一键互动
// @namespace    https://github.com/ozxslackin/handiFix
// @version      0.1.1
// @description  X站帖子自动化互动（点赞->转发->评论）
// @author       ozxslackin
// @match        https://x.com/*
// @updateURL    https://github.com/ozxslackin/handiFix/raw/main/auto_interact.js
// @downloadURL  https://github.com/ozxslackin/handiFix/raw/main/auto_interact.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 修改样式，添加特定前缀
    const style = document.createElement('style');
    style.textContent = `
        .ozx-interact-btn {
            position: fixed;
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
            opacity: 0;
            transition: opacity 0.2s;
            z-index: 1000;
        }

        .ozx-interact-btn:hover {
            opacity: 1 !important;
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
    `;
    document.head.appendChild(style);

    // 存储评论配置
    let commentConfig = {
        comments: [],
        suffixes: [],
        emojis: []
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

        <label>随机Emoji（直接输入多个emoji，留空不添加）</label>
        <textarea id="emoji-list" class="ozx-emoji-input">😊🥰😍🤗🥳😎🌟✨💫⭐️🌈🎉🎊💝💖💗💓💞💕❤️💜🧡💚💛💙🤍❤️‍🩹🎯🎪🎨🎭🎪🎡🎢🌅🌄☀️🌤️⛅️🌥️🌊🏖️🌿☘️🍀🌸🌺🌼🌻💐🌹🥀🦋🕊️🐣🐥🦄🦁🐯🦊🐨🐼🐷🐝🍎🍓🍒🍑🍊🍋🍍🥝🍇🥭🧁🍰🎂🍮🍪🍨🍧🍦🥤🧃🎈🎆🎇🏆🎖️🏅🥇👑💎💫🌠⚡️💪👊✌️🤝🙌👐🤲🫂🎵🎶🎹🎸🪕🎺📚💡💭💫🌈🎨🎯</textarea>
        <div class="ozx-note">每条评论开头和结尾都会随机选择一个emoji（如果有的话）</div>

        <label>评论后缀（每行一个话题or关键词）</label>
        <textarea id="comment-suffix" placeholder="#话题1
#话题2
#话题3"></textarea>

        <button id="save-comment-btn">保存配置</button>
    `;
    document.body.appendChild(form);

    // 从本地存储加载配置
    function loadConfig() {
        const savedConfig = localStorage.getItem('commentConfig');
        if (savedConfig) {
            try {
                commentConfig = JSON.parse(savedConfig);

                // 填充表单
                document.getElementById('comment-content').value = commentConfig.comments.join('\n\n');
                document.getElementById('comment-suffix').value = commentConfig.suffixes.join('\n');
                document.getElementById('emoji-list').value = commentConfig.emojis.join('');
            } catch (error) {
                console.error('加载配置失败:', error);
            }
        }
    }

    // 在创建表单后立即加载配置
    document.body.appendChild(form);
    loadConfig();

    // 配置按钮点击事件
    configBtn.addEventListener('click', () => {
        const isVisible = form.style.display === 'block';
        form.style.display = isVisible ? 'none' : 'block';
    });

    // 保存配置
    document.getElementById('save-comment-btn')?.addEventListener('click', () => {
        const content = document.getElementById('comment-content').value;
        const suffix = document.getElementById('comment-suffix').value;
        const emojisText = document.getElementById('emoji-list').value.trim();

        // 处理评论内容
        commentConfig.comments = content.split(/\n\s*\n+/)
            .map(comment => comment.trim())
            .filter(comment => comment.length > 0);

        // 处理后缀
        commentConfig.suffixes = suffix.split('\n')
            .map(line => line.trim())
            .filter(line => line);

        // 处理emoji - 将输入的文本分割成单个emoji
        commentConfig.emojis = Array.from(emojisText).filter(char => {
            // 检查是否是emoji（简单判断）
            return char.length > 1 || /\p{Emoji}/u.test(char);
        });

        // 保存到本地存储
        localStorage.setItem('commentConfig', JSON.stringify(commentConfig));

        form.style.display = 'none';
        alert('配置已保存！');
    });

    // 添加互动按钮到帖子
    function addInteractButton(article) {
        if (article.dataset.ozxProcessed) return;
        if (!isValidArticle(article)) return;
        if (article.querySelector('.ozx-interact-btn')) return;

        const container = article.closest('[data-testid="cellInnerDiv"]');
        if (!container) return;

        const btn = document.createElement('button');
        btn.className = 'ozx-interact-btn';
        btn.innerHTML = '⚡';
        btn.title = '一键互动';

        // 使用事件监听器动态更新按钮位置
        const updateButtonPosition = () => {
            const rect = article.getBoundingClientRect();
            btn.style.top = `${rect.top + rect.height/2 - 17}px`; // 17 是按钮高度的一半
            btn.style.left = `${rect.right + 10}px`;
            btn.style.opacity = article.matches(':hover') ? '1' : '0';
        };

        // 初始定位
        updateButtonPosition();

        // 监听滚动和调整大小事件
        window.addEventListener('scroll', updateButtonPosition, { passive: true });
        window.addEventListener('resize', updateButtonPosition, { passive: true });

        // 监听鼠标进入离开事件
        article.addEventListener('mouseenter', () => {
            btn.style.opacity = '1';
        });
        article.addEventListener('mouseleave', () => {
            btn.style.opacity = '0';
        });

        document.body.appendChild(btn);
        btn.addEventListener('click', () => handleInteraction(article));
        article.dataset.ozxProcessed = 'true';

        // 清理函数
        const cleanup = () => {
            window.removeEventListener('scroll', updateButtonPosition);
            window.removeEventListener('resize', updateButtonPosition);
            btn.remove();
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
        if (commentConfig.comments.length === 0) {
            alert('请先设置评论文本！');
            return;
        }

        try {
            // 1. 点赞
            const likeBtn = article.querySelector('[data-testid="like"]');
            if (likeBtn && !likeBtn.querySelector('[data-testid="liked"]')) {
                await clickButton(likeBtn);
                await sleep(Math.floor(Math.random() * 401) + 300);
            }

            // 2. 转发
            const retweetBtn = article.querySelector('[data-testid="retweet"]');
            if (retweetBtn && !retweetBtn.querySelector('[data-testid="retweeted"]')) {
                // 点击转发按钮打开菜单
                await clickButton(retweetBtn);
                await sleep(Math.floor(Math.random() * 1201) + 800);

                // 点击"转帖"选项
                const retweetOption = document.querySelector('[data-testid="retweetConfirm"]');
                if (retweetOption) {
                    await clickButton(retweetOption);
                    await sleep(Math.floor(Math.random() * 1201) + 800);
                } else {
                    console.warn('未找到转帖选项');
                }
            }

            // 3. 评论
            await addComment(article);

        } catch (error) {
            console.error('互动过程出错:', error);
            alert('互动过程出错: ' + error.message);
        }
    }

    // 添加评论
    async function addComment(article) {
        // 随机选择一条评论
        const randomComment = commentConfig.comments[Math.floor(Math.random() * commentConfig.comments.length)];

        // 处理后缀，保持换行并在每行末尾添加空格
        const suffixes = commentConfig.suffixes
            .map(line => line.trim() + ' ')
            .join('\n');

        // 随机选择开头和结尾的emoji
        let startEmoji = '';
        let endEmoji = '';
        if (commentConfig.emojis.length > 0) {
            startEmoji = commentConfig.emojis[Math.floor(Math.random() * commentConfig.emojis.length)] + ' ';
            endEmoji = ' ' + commentConfig.emojis[Math.floor(Math.random() * commentConfig.emojis.length)];
        }

        const fullComment = `${startEmoji}${randomComment}${endEmoji}\n\n${suffixes}`;

        // 点击回复按钮
        const replyBtn = article.querySelector('[data-testid="reply"]');
        await clickButton(replyBtn);
        await sleep(Math.floor(Math.random() * 1201) + 800);

        // 找到评论输入框
        const editor = document.querySelector('[data-testid="tweetTextarea_0"]');
        if (!editor) throw new Error('未找到评论输入框');

        // 输入评论内容
        editor.focus();
        await simulateTyping(editor, fullComment);
        await sleep(Math.floor(Math.random() * 401) + 300);

        // 点击发送按钮
        const sendBtn = document.querySelector('[data-testid="tweetButton"]');
        if (!sendBtn) throw new Error('未找到发送按钮');
        await clickButton(sendBtn);
    }

    // 模拟打字
    async function simulateTyping(element, text) {
        const chars = Array.from(text);
        for (const char of chars) {
            if (char === '\n') {
                element.dispatchEvent(new KeyboardEvent('keydown', {
                    key: 'Enter',
                    code: 'Enter',
                    bubbles: true
                }));
                document.execCommand('insertLineBreak');
            } else {
                document.execCommand('insertText', false, char);
            }
            await sleep(Math.floor(Math.random() * 81) + 10);
        }
    }

    // 模拟点击
    async function clickButton(button) {
        if (!button) throw new Error('按钮未找到');
        button.click();
        await sleep(Math.floor(Math.random() * 401) + 300);
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
})();