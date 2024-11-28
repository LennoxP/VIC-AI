const promptInput = document.querySelector("#prompt");
const output = document.querySelector("#output");
const welcome = document.querySelector("#welcome");
const chatBot = document.querySelector(".chat-bot");
const form = document.querySelector("#gemini-ai");

// Function to toggle the visibility of the mobile menu and change the icon
function menuShow() {
    let menuMobile = document.querySelector('.mobile-menu')
    if(menuMobile.classList.contains('open')){
        menuMobile.classList.remove('open')
        document.querySelector('.icon-mobile').src = "assets/img/hamburguinho-img/hamburguinho.png"
    } else{
        menuMobile.classList.add('open')
        document.querySelector('.icon-mobile').src = "assets/img/hamburguinho-img/exit-hamburguinho.png"
    }
}

// Function to toggle the expansion of the chat container
function fullScream() {
    let partBotSection = document.getElementById('partBot');
    partBotSection.classList.toggle('expanded');
}

// Function to show an image in a modal overlay
function mostrarImagem(imagemSrc) {
    const overlay = document.getElementById("overlayImagemContainer");
    const overlayImg = document.getElementById("overlayImage");
    
    overlayImg.src = imagemSrc;

    overlay.style.display = 'flex';

    document.querySelector("main").classList.add("blur");

    overlay.onclick = function() {
        overlay.style.display = 'none';

        document.querySelector("main").classList.remove("blur");
    };
}

// Function to show a video in a modal overlay
function mostrarVideo(videoSrc) {
    const overlay = document.getElementById("overlayVideoContainer");
    const overlayVideo = document.getElementById("overlayVideo");
    
    overlayVideo.src = videoSrc;
    overlay.style.display = 'flex';

    document.querySelector("main").classList.add("blur");

    overlay.onclick = function() {
        overlayVideo.pause();
        overlay.style.display = 'none';
        document.querySelector("main").classList.remove("blur");
    };
}

// Function to show a specific div by class name
function showDiv(className) {
    const divToShow = document.getElementById(className);
    const bodyContent = document.body; 
    
    if (divToShow) {
        divToShow.style.display = 'flex'; 
    }
}

// Function to close a specific overlay or div by class name
function closeOverlay(className) {
    const divToClose = document.getElementById(className);
    const bodyContent = document.body;
    
    if (divToClose) {
        divToClose.style.display = 'none'; 
    }
}

// Function to simulate typing effect for a welcome message
document.addEventListener("DOMContentLoaded", () => {
    const element = document.getElementById("reveal-title"); // Title
    const text = "Olá, bem vindo ao VIC AI. Como posso te ajudar hoje?"; // Text to title
    let index = 0;
  
    const typeEffect = () => {
      if (index < text.length) {
        element.textContent += text.charAt(index);
        index++;
        setTimeout(typeEffect, 35);
      }
    };
  
    typeEffect();
});

form.addEventListener('submit', (e) => {
    e.preventDefault();
    onSubmit();
})
// On pressing the Enter key
promptInput.addEventListener('keypress', (e) => {
    if (e.key === "Enter") {
        e.preventDefault(); // Prevent line breaks
        onSubmit();
    }
});

function onSubmit() {
    document.querySelector("#suggestions-bot").style.display = "none"; // Hide the suggestions
    output.style.height = "90%";
    welcome.style.display = "none";
    chatBot.style.justifyContent = "space-between";
    document.querySelector(".input-message").style.marginBottom = "0";
    genereteContext();
}

// Function to generate the user's text in the output
function addMessageUser(prompt) {
    const userMessage = document.createElement('div');
    userMessage.className = "role-user";
    userMessage.innerHTML = `
        <div class="text">
            <p>${prompt}</p>
        </div>
    `;
    output.appendChild(userMessage);
}

// Function to generate the bot text in the output
function addMessageBot() {
    const botMessage = document.createElement('div');
    botMessage.className = "role-bot";
    botMessage.innerHTML = `
        <div class="text">
            Processando...
        </div>
    `;
    output.appendChild(botMessage);
    return botMessage.querySelector('.text');
}

// Make the request to the back-end
async function genereteContext() {
    try {
        const prompt = promptInput.value;
        let media = null;
        
        promptInput.value = ""; // Clear the input value

        addMessageUser(prompt); // Add the user's message
        const botMessageElement = addMessageBot(); // Add the bot's message

        // Make a request to the server.
        const response = await fetch("http://localhost:5554/generate-content", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: prompt,
                image: media
            })
        });
        
        // If the server does not send a response
        if (!response.ok) {
            botMessageElement.innerHTML = "Erro no processamento";
            return;
        }


        const reader = response.body.getReader(); // Create a reader to read the data.
        const decoder = new TextDecoder(); // Convert binary data to text.

        botMessageElement.innerHTML = ""; // Clear the "Processing..." message
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(5); // Remove "data: "
                    if (data === '[DONE]') {
                        break; // Finish the process if the server returns [DONE]
                    }
                    
                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.html) {
                            botMessageElement.innerHTML = parsed.html; // Update the bot's HTML
                        }
                    } catch (err) {
                        console.error(`Erro: ${err}`);
                    }
                }
            }
        }
    } catch (err) {
        console.error(`Erro: ${err}`);
        const botMessageElement = document.querySelector('.role-bot .text');
        if (botMessageElement) {
            botMessageElement.innerHTML = "Erro ao gerar resposta.";
        }
    }
}

// Função para rolar até o fundo automaticamente
function scrollToBottom() {
    const chatContainer = document.querySelector('.chat-container');
    if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}

// Configuração do MutationObserver para observar mudanças no conteúdo do chat
const chatContainer = document.querySelector('.chat-container');


if (chatContainer) {
    const observer = new MutationObserver(() => {
        scrollToBottom(); // Quando houver mudanças, rola automaticamente para baixo
    });

    // Inicia a observação de alterações no conteúdo dentro do .chat-container
    observer.observe(chatContainer, {
        childList: true,    // Observa a adição ou remoção de elementos filhos
        subtree: true       // Observa os elementos dentro do contêiner (subárvores)
    });
}

// Certifique-se de que o chat rola para o final quando a página é carregada
document.addEventListener('DOMContentLoaded', () => {
    scrollToBottom();
});

// Função para adicionar a mensagem do bot
function addMessageBot() {
    const botMessage = document.createElement('div');
    
    // Corrigindo a sintaxe do innerHTML com a string correta
    botMessage.innerHTML = `
    <div class="Logobot-text">
        <span class="area-logo-bot">
            <img src="assets/images/logo-img/logo-colegio.png" alt="logo bot" />
        </span>
        <div class="text">
            Processando...
        </div>
    </div>
    `;
    
    // Adicionando a mensagem criada ao elemento de saída
    output.appendChild(botMessage);

    // Retornando a área de texto onde a mensagem será inserida
    return botMessage.querySelector('.text');
}


// Function that fills the input with the message and submits the form
function setMessage(message) {
    // Fills the input field with the provided message
    document.getElementById('prompt').value = message;

    // Prevent the form from being submitted the default way (reloading the page)
    event.preventDefault();

    // Manually trigger the form submission by calling a custom submit handler
    document.getElementById('gemini-ai').dispatchEvent(new Event('submit'));
}