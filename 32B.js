const API_URL = "https://api-inference.huggingface.co/models/Qwen/Qwen2.5-Coder-32B-Instruct";
const DAILY_LIMIT = 10;

function checkLimits() {
    const today = new Date().toDateString();
    let storedDate = localStorage.getItem('gen_date');
    let count = parseInt(localStorage.getItem('gen_count') || '0');

    if (storedDate !== today) {
        count = 0;
        localStorage.setItem('gen_date', today);
        localStorage.setItem('gen_count', '0');
    }

    const remaining = DAILY_LIMIT - count;
    const badge = document.getElementById('limitBadge');
    const btn = document.getElementById('generateBtn');

    if(badge) badge.innerHTML = `🔥 Осталось запросов: <b>${remaining}</b> / ${DAILY_LIMIT}`;

    if (remaining <= 0 && btn) {
        if(badge) badge.innerHTML = `<span style="color:#ef4444">⛔ Лимит исчерпан. Жди завтра!</span>`;
        btn.disabled = true;
        btn.textContent = "Лимит исчерпан";
        return false;
    }
    return true;
}

async function generateCode() {
    if (!checkLimits()) return;

    const btn = document.getElementById('generateBtn');
    const status = document.getElementById('statusMsg');
    const resultBox = document.getElementById('resultBox');
    
    const prompt = document.getElementById('promptInput').value;
    const lang = document.getElementById('langSelect').value;

    if (!prompt.trim()) { alert("Введите задачу!"); return; }

    btn.disabled = true;
    status.style.color = "#8b5cf6";
    status.textContent = "⏳ 32B модель думает... (до 60 сек)";
    resultBox.style.display = 'none';

    try {
        const messages = `<|im_start|>system\nТы эксперт по коду. Пиши ТОЛЬКО код на ${lang}. Без объяснений.<|im_end|>\n<|im_start|>user\n${prompt}<|im_end|>\n<|im_start|>assistant\n`;

        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                inputs: messages,
                parameters: { max_new_tokens: 1024, temperature: 0.2, return_full_text: false }
            })
        });

        const data = await response.json();

        if (data.error) {
            if (data.error.includes("loading")) throw new Error("⏳ Модель загружается. Подожди 30 сек и повтори!");
            if (data.error.includes("rate")) throw new Error("🚫 Слишком много запросов. Подожди минуту.");
            throw new Error(data.error);
        }

        let code = data[0]?.generated_text || "";
        code = code.replace(/<\|im_end\|>/g, '').trim();

        let current = parseInt(localStorage.getItem('gen_count') || '0');
        localStorage.setItem('gen_count', (current + 1).toString());
        checkLimits();

        document.getElementById('codePreview').textContent = code;
        resultBox.style.display = 'block';
        status.style.color = "#10b981";
        status.textContent = "✅ Код готов!";

    } catch (err) {
        status.style.color = "#ef4444";
        status.textContent = "❌ " + err.message;
    } finally {
        const today = new Date().toDateString();
        const count = parseInt(localStorage.getItem('gen_count') || '0');
        if (localStorage.getItem('gen_date') === today && count < DAILY_LIMIT) {
            btn.disabled = false;
        }
    }
}

function downloadResult() {
    const code = document.getElementById('codePreview').textContent;
    const name = document.getElementById('fileName').value || 'code';
    const lang = document.getElementById('langSelect').value;
    const exts = { python:'.py', javascript:'.js', html:'.html', css:'.css', cpp:'.cpp' };
    
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name + (exts[lang] || '.txt');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}