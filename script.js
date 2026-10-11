async function renderXML() {
    try {
        const response = await fetch('visual.xml');
        if (!response.ok) throw new Error("Не удалось загрузить visual.xml");
        
        const str = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(str, "text/xml");

        const parseError = xmlDoc.querySelector("parsererror");
        if (parseError) throw new Error("Ошибка синтаксиса XML: " + parseError.textContent);

        const appNode = xmlDoc.getElementsByTagName("app")[0];
        document.title = appNode.getAttribute("title") || "AI Generator";

        function buildElement(xmlNode) {
            const tag = xmlNode.tagName;
            let el;

            switch(tag) {
                case 'container': el = document.createElement('div'); break;
                case 'heading': 
                    el = document.createElement(`h${xmlNode.getAttribute('level') || '2'}`); 
                    el.textContent = xmlNode.getAttribute('text'); 
                    return el;
                case 'badge': 
                case 'statusText': 
                    el = document.createElement('div'); 
                    el.textContent = xmlNode.getAttribute('text') || ''; 
                    break;
                case 'formGroup': el = document.createElement('div'); el.className = 'form-group'; break;
                case 'label': 
                    el = document.createElement('label'); 
                    el.textContent = xmlNode.getAttribute('text'); 
                    return el;
                case 'input': 
                    el = document.createElement('input'); 
                    el.type = xmlNode.getAttribute('type') || 'text'; 
                    break;
                case 'select': el = document.createElement('select'); break;
                case 'option': 
                    el = document.createElement('option'); 
                    el.value = xmlNode.getAttribute('value'); 
                    el.textContent = xmlNode.textContent; 
                    return el;
                case 'textarea': el = document.createElement('textarea'); break;
                case 'button': 
                    el = document.createElement('button'); 
                    el.textContent = xmlNode.getAttribute('text'); 
                    break;
                case 'resultBox': el = document.createElement('div'); break;
                case 'codeBlock': 
                    el = document.createElement('pre'); 
                    el.id = 'codePreview'; 
                    return el;
                default: el = document.createElement('div');
            }

            if (xmlNode.getAttribute('id')) el.id = xmlNode.getAttribute('id');
            if (xmlNode.getAttribute('class')) el.className = xmlNode.getAttribute('class');
            if (xmlNode.getAttribute('placeholder')) el.placeholder = xmlNode.getAttribute('placeholder');
            if (xmlNode.getAttribute('visible') === 'false') el.style.display = 'none';

            Array.from(xmlNode.children).forEach(child => {
                el.appendChild(buildElement(child));
            });

            return el;
        }

        const rootContainer = xmlDoc.getElementsByTagName("container")[0];
        const htmlRoot = buildElement(rootContainer);
        
        const root = document.getElementById('app-root');
        if (root) {
            root.innerHTML = '';
            root.appendChild(htmlRoot);
        } else {
            document.body.appendChild(htmlRoot);
        }

        // Навешиваем обработчики после рендера
        document.getElementById('generateBtn').addEventListener('click', generateCode);
        document.getElementById('downloadBtn').addEventListener('click', downloadResult);

        // Инициализируем лимиты после сборки интерфейса
        checkLimits();

    } catch (err) {
        document.body.innerHTML = `<div style="color:red; padding:20px;">❌ Ошибка загрузки visual.xml:<br>${err.message}</div>`;
    }
}

document.addEventListener('DOMContentLoaded', renderXML);