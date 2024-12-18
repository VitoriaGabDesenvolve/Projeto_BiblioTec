const db = require("../database/connect");
const { parse, addDays } = require("date-fns");
const nodemailer = require('nodemailer');

class BookLoad{
  async listBookLoad(req, res){
    try{
      const [emprestimos] = await db.query("SELECT emprestimo.emprestimo_ID, usuario.nome AS nome_usuario, usuario.email, livro.titulo AS titulo_livro, emprestimo.data_emprestimo, emprestimo.data_devolucao, emprestimo.status_emprestimo, emprestimo.notificacao, emprestimo.livro_ID FROM emprestimo JOIN usuario ON emprestimo.usuario_ID = usuario.usuario_ID JOIN livro ON emprestimo.livro_ID = livro.livro_ID")
      res.status(200).json(emprestimos)
    } catch(error){
      console.log(error)
      res.status(422).json({ message: "erro ao tentar listar os emprestimos"})
    }
  }

  

  async verificarAtrasos(req, res){
    try{
        const [emprestimos] = await db.query(`SELECT emprestimo.emprestimo_ID, usuario.nome AS nome_usuario, usuario.email, livro.titulo AS titulo_livro, emprestimo.livro_ID, emprestimo.data_emprestimo, emprestimo.data_devolucao, emprestimo.status_emprestimo, emprestimo.notificacao FROM emprestimo
        JOIN usuario ON emprestimo.usuario_ID = usuario.usuario_ID
        JOIN livro ON emprestimo.livro_ID = livro.livro_ID`)

        async function atualizarStatusEmprestimo(emprestimoID, novoStatus) {
            try {
                const query = ` UPDATE emprestimo SET status_emprestimo = ? WHERE emprestimo_ID = ?;`;
                const values = [novoStatus, emprestimoID];
                await db.query(query, values);
                console.log('Status atualizado com sucesso!');
            } catch (error) {
                console.error('Erro ao atualizar status:', error);
            }
        }

        async function atualizarStatusNotificacao(emprestimo_ID) {
            try{
                const query = ` UPDATE emprestimo SET notificacao = 1 WHERE emprestimo_ID = ?;`;
                const values = [emprestimo_ID];
                await db.query(query, values);
                console.log('Status de notificacao atualizado com sucesso!');

            }catch(error){
                console.error('Erro ao atualizar status de notificacao:', error)
            }
            
        }

        for (let index = 0; index < emprestimos.length; index++){
            let data_devolucao = new Date(emprestimos[index].data_devolucao);

            async function formatardata(date){
                const dia = date.getDate().toString().padStart(2, '0'); // Garante 2 dígitos
                const mes = (date.getMonth() + 1).toString().padStart(2, '0'); // Mês começa em 0
                const ano = date.getFullYear();

                return `${dia}/${mes}/${ano}`;

            }

            const emprestimo_ID = emprestimos[index].emprestimo_ID
            const email_cliente = emprestimos[index].email
            const nome_cliente = emprestimos[index].nome_usuario
            const nome_livro = emprestimos[index].titulo_livro
            

            if (data_devolucao < new Date()){
                await atualizarStatusEmprestimo(emprestimo_ID, 'ATRASADO')

                console.log('esta estrasado')
            } else {
                console.log("não está atrasado")
            }

            if (emprestimos[index].status === 'ATRASADO' || emprestimos[index].notificacao === 0){
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: "bibliotecinformes@gmail.com",
                        pass: "nzdhtnvhnqkoslsp"
                    },
                });

                const mailOptions = {
                    from: "BiblioTecInformes@gmail.com",
                    to: email_cliente,
                    subject: 'Lembrete de Empréstimo Atrasado',
                    text: `Olá, ${nome_cliente}!\n \nGostaríamos de lembrar que o prazo de devolução do livro "${nome_livro}" venceu no dia ${await formatardata(data_devolucao)}. Pedimos que regularize a situação o mais breve possível.\n \nCaso já tenha devolvido, desconsidere este aviso.\n \nAtenciosamente, \nEquipe BiblioTec
                    `
                }

                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.log('Erro ao enviar', error)
                    } else {
                        console.log('E-mail enviado')
                        atualizarStatusNotificacao(emprestimo_ID)
                        console.log('status de notificacao alterado')
                        
                    }
                })
            }
            else {
                console.log("cliente já notificado")
            } 
        }
    }catch(error){
        return console.log(error)

    }
  }

  async addBookLoad(req, res){
    try{
      const {livro_ID, usuario_ID, data_emprestimo, data_devolucao} = req.body;
      console.log(livro_ID, usuario_ID, data_emprestimo, data_devolucao)
      const status_padrao = "EMPRESTADO"
      const notificado_padrao = 0

    async function VerificarDisponibilidade(livro){
        const [livros] = await db.query('SELECT * FROM livro WHERE livro_ID = ?', [livro_ID])
        const numero_disponivel = livros[0].quantidade_disponivel
        console.log(`quantidade disponivel do livro ${numero_disponivel}`)
        return numero_disponivel
      }

      async function VerificarUsuario(id){
        const [usuarios] = await db.query("SELECT * FROM usuario WHERE usuario_ID = ?", [id])
        if (usuarios.length === 0){
          res.status(422).json({ message: "usuario inexistente"})
        } else if (usuarios.length === 1){
          console.log("entrou 2")
          const [emprestimos_atrasados] = await db.query("SELECT * FROM emprestimo WHERE usuario_ID = ? AND status_emprestimo = 'ATRASADO'", [id])
          
          if(emprestimos_atrasados.length >= 1){
            res.status(422).json({ message: "usuario impossibilitado de pegar livro pois tem livro atrasado"})
          }
        }
      }

      if (await VerificarDisponibilidade(livro_ID) === 0){
        return res.json({ message: "quantidade de livros insuficientes"})
      } 

      await VerificarUsuario(usuario_ID)

      await db.query(
        "INSERT INTO emprestimo (usuario_ID, livro_ID, data_emprestimo, data_devolucao, status_emprestimo, notificacao) VALUES (?, ?, ?, ?, ?, ?)",
        [usuario_ID, livro_ID, data_emprestimo, data_devolucao, status_padrao, notificado_padrao]
      );

      async function AlterarDisponibilidade(valorAtual) {
        let novoValor = valorAtual - 1

        const alterar = await db.query("UPDATE livro SET quantidade_disponivel = ? WHERE livro_ID = ?", [novoValor, livro_ID])
        
      }

      await AlterarDisponibilidade(Number(await VerificarDisponibilidade(livro_ID)))

      res.status(201).json({ message: `emprestimo adicionado com sucesso!` });



    }catch(error){
      console.log(error)
      res.status(422).json({ message: "error ao tentar cadastrar emprestimo"})
    }
  }

  async returnBookLoad(req, res){
    try{
        const {emprestimo_ID, livro_ID} = req.body
        console.log(livro_ID)

        async function VerificarDisponibilidade(livro){
            const [livros] = await db.query('SELECT * FROM livro WHERE livro_ID = ?', [livro_ID])
            const numero_disponivel = livros[0].quantidade_disponivel
            console.log(`quantidade disponivel do livro ${numero_disponivel}`)
            return numero_disponivel
        }
        
        const returnBook = await db.query("UPDATE emprestimo SET status_emprestimo = 'ENTREGUE' WHERE emprestimo_ID = ?", [emprestimo_ID])

        
        async function AlterarDisponibilidade(valorAtual) {
            let novoValor = valorAtual + 1

            const alterar = await db.query("UPDATE livro SET quantidade_disponivel = ? WHERE livro_ID = ?", [novoValor, livro_ID])
        }

        await AlterarDisponibilidade(await VerificarDisponibilidade(livro_ID))

        res.status(200).json({message: "livro devolvido com sucesso"})

    }catch(error){
        console.log(error)
    }
  }
}

module.exports = new BookLoad()
