const db = require('../database/connect')

class ControllerBooks{

    constructor(){}

    async listBook(req, res){
        try{
            let sql = 'SELECT livro.livro_ID, livro.titulo, livro.ISBN, livro.quantidade_total, livro.quantidade_disponivel, autor.nome '
            sql += 'FROM livro '
            sql += 'INNER JOIN autor_livro ON livro.livro_ID = autor_livro.livro_ID '
            sql += 'INNER JOIN autor ON autor_livro.autor_ID = autor.autor_ID'
            const [livros] = await db.query(sql)
            res.status(200).json(livros)
        }catch(error){
            console.log(error)
            res.status(422).json({ message: "erro ao tentar listar livros"})
        }
    }

    async addBook(req, res) {
        try {
            const { titulo, autor, ISBN, qtd_total} = req.body;

            async function procurarLivro(ISBN) {
                const [livro] = await db.query("SELECT * FROM livro WHERE ISBN = ?", [ISBN]);
                return livro.length;
            }

            async function procurarAutor(nome){
                const [autor] = await db.query("SELECT * FROM autor WHERE nome = ?", [nome])
                return autor.length
            }

            async function conectarLivroAutor(ISBN, autor_nome){
                const [livro] = await db.query("SELECT * FROM livro WHERE ISBN = ?", [ISBN]);
                const livro_ID = livro[0].livro_ID;
                const [autor] = await db.query("SELECT * FROM autor WHERE nome = ?", [autor_nome]);
                const autor_ID = autor[0].autor_ID;
                const conectar = await db.query("INSERT INTO autor_livro (livro_ID, autor_ID) VALUES (?, ?)", [livro_ID, autor_ID]);
                console.log("Ligação livro-autor concluída");
            }
    
            if (!titulo || !autor || !ISBN || !qtd_total ) {
                return res.status(422).json({ message: "Dados para cadastro de livro incompletos" });
            }

            if ((await procurarLivro(ISBN)) === 1) {
                console.log((await procurarLivro(ISBN)).length)
                return res.status(422).json({ message: "Livro já cadastrado na base de dados" });
            }
    
            if ((await procurarAutor(autor)) === 0) {
                const cadastroAutor = await db.query("INSERT INTO autor (nome) VALUES (?)", [autor]);
                console.log("Autor cadastrado no banco de dados")
            }
    
            const cadastro = await db.query(
                "INSERT INTO livro (titulo, ISBN, quantidade_total, quantidade_disponivel) VALUES (?, ?, ?, ?)",
                [titulo, ISBN, qtd_total, qtd_total]
            );

            console.log("Livro cadastrado no banco")
    
            conectarLivroAutor(ISBN, autor);
    
            res.status(201).json({ message: `Livro '${titulo}' adicionado com sucesso!` });
        } catch (error) {
            console.error("Erro ao tentar cadastrar livro:", error.message);
            res.status(422).json({ message: "Erro ao tentar cadastrar livro" });
        }
    }
}

module.exports = new ControllerBooks()