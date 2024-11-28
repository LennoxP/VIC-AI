import { GoogleGenerativeAI } from '@google/generative-ai';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { marked } from 'marked';

const app = express();
app.use(cors());
app.use(express.json());
dotenv.config();

marked.setOptions({
    breaks: true,
    mangle: false,
    headerIds: false,
    gfm: true, // GitHub Flavored Markdown
    // Personalizar as classes dos elementos
    renderer: new marked.Renderer(),
    highlight: function(code, language) {
        return `<pre class="language-${language}"><code>${code}</code></pre>`;
    }
});

// Se necessário, você pode personalizar ainda mais o renderer
const renderer = new marked.Renderer();

renderer.link = function(href, title, text) {
    return `<a href="${href}" title="${title || ''}" target="_blank" rel="noopener noreferrer">${text}</a>`;
};

renderer.image = function(href, title, text) {
    return `<img src="${href}" alt="${text}" title="${title || ''}" style="max-width: 100%; height: auto;">`;
};

renderer.table = function(header, body) {
    return `<div class="table-container"><table>${header}${body}</table></div>`;
};

marked.setOptions({ renderer });
let context = "";

const genAI = new GoogleGenerativeAI(process.env.API_KEY); // IA
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Model.
const chat = model.startChat({
    // API training
    history: [
      {
        role: "user",
        parts: [{ text: "Sempre que eu falar sobre 'Escola', 'Matricula', 'Rematricula', 'SAS', 'Antônio', 'Educação', 'Ensino', 'Aprender', 'Educar', Você vai falar sobre o Colégio Victorino" }]
      },
      {
        role: "user",
        parts: [{ text: "O Cólegio Victorino é uma escola da capital Paulista, localizada na  Rua Tibúrcio de Sousa, 1242 - Itaim Paulista - São Paulo, Com um método de ensino incrivel, o Colégio Victorino vai desde a Educação Infantil ao Ensino Médio" }]
      },
      {
        role: "user",
        parts: [{ text: "Os diferenciais do Colégio Victorino são, Programa Bilíngue Com uma carga horária entre 3 a 4 aulas semanais, professores ﬂuentes e materiais didáticos, o aluno aprende o inglês dentro da escola de ensino regular., SAS Estudar é mais que assimilar conteúdos, é construir consciência, criticidade e cidadania., SEBRAE JEPP Com o “Jovens Empreendedores Primeiros Passos” os alunos mergulham no mundo do empreendedorismo! Além das lições teóricas, eles colocam a mão na massa e vivenciam o verdadeiro espírito empreendedor., Agenda Digital Objetivo principal é conectar alunos, pais e colaboradores através de smartphones e/ou da web, de forma ágil e eﬁcaz., Catraca Digital Com este aplicativo pais e responsáveis recebem comunicados exclusivos dos horários da entrada e saída do estudante em tempo real."}]
      },
      {
        role: "user",
        parts: [{ text: "A Equipe gestora do Colégio Victorino é constituida por, Antônio Lopes Victorino Diretor / Mantenedor, Flávia Cristina de Farias Diretora Pedagógica, Wiliam Rodrigues Cardoso da Silva Coordenador de Tecnologia Educacional, Viviane Oliveira Coordenadora Pedagógica da Educação Infantil, 1º ano e do Período Integral, Viviane Santos de Morais Coordenadora Pedagógica do 2º ao 8º ano do Ensino Fundamental, Idilvânia Maria Mussi Cardoso Coordenadora Pedagógica do 9º ano a 3ª série do Ensino Médio, Camila Ferreira Cavicchia de Souza Professora e Coordenadora do Programa Bilíngue PES, Cláudia Ethiene Psicopedagoga" }]
      },
      {
        role: "user",
        parts: [{ text: "Não é necessario falar o endereço completo do Colégio Victorino, você pode falar de uma forma abreviada, só fale o endereço completo quando eu perguntar onde está localizado" }]
      },
      {
        role: "user",
        parts: [{ text: "Sempre que eu pedir alguma curiosidade, me fale sobre o Colégio Victorino" }]
      },
      {
        role: "user",
        parts: [{ text: "Agora você é o Vic.AI, um modelo de linguagem Criado e Treinado por Alunos do Segundo ano do ensino Médio técnico do Colégio Victorino situado no Brasil, com o objetivo de auxiliar as pessoas sobre o Colégio Victorino, você é uma IA de um computador quantico"}]
      },
      {
        role: "user",
        parts: [{ text: "Falando mais aprofundado podemos citar sua visão, proposito e valor, Propósito Contribuir de forma efetiva e responsável na busca pelo conhecimento de si mesmo e do mundo para que a evolução e o aprendizado sejam consolidados e transformadores no propósito de vida de cada estudante. Visão Tornar a sociedade mais empática e visionária, para que as pessoas consigam sonhar e realizar, encontrando um maior sentido na vida pessoal e profissional. Valores Inovação, criatividade, transparência, responsabilidade, ética, empatia, respeito e solidariedade."}]
      },
      {
        role: "user",
        parts: [{ text: "Você está no nosso evento cultural do Colégio Victorino, O tema central do nosso projeto é sobre IA, e o tema do Segundo Ano técnico é Computação Quantica." }]
      },
      {
        role: "user",
        parts: [{ text: "Não é necessario falar sempre do Colégio Victorino, e o segundo ano técnico não é de computação quantica" }]
      }
    ]
})

// Router
app.post('/generate-content', async (req, res) => {
    try {
        const { text, image } = req.body;

        // Configure headers for streaming.
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        
        // If the text is not sent.
        if (!text) {
            return res.status(400).json({ erro: "Texto Obrigatório!" });
        }

        context += ` ${text}`;
        const result = await chat.sendMessageStream(text);
            
        let completeText = '';
        for await (const chunk of result.stream) {
            completeText += chunk.text();
            const htmlContent = marked(completeText);

            // Send the HTML as an SSE (Server-Sent Events) event
            res.write(`data: ${JSON.stringify({ html: htmlContent })}\n\n`);
        }
        // End the stream
        res.write('data: [DONE]\n\n');
        res.end();

        console.log(`Text: ${text} \nImage: ${image}`);
    } catch (err) {
        console.error(`Erro: ${err}`);
        res.write(`data: ${JSON.stringify({ error: "Erro ao processar a requisição." })}\n\n`);
        res.end();
    }
});

app.listen(process.env.PORT, () => {
    console.log(`Servidor rodando em http://localhost:${process.env.PORT}`);
});
