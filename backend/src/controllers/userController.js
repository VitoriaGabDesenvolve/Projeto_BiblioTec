const db = require("../database/connect")
const createUserToken = require("../helpers/CreateToken")

class ControllerUsuarios{
  async listUsers(req, res){
    try{
      const [users] = await db.query("SELECT * FROM usuario ");
      res.status(200).json(users);
    } catch (error) {
      console.log(error)
      res.status(400).json({ message: "erro ao listar usuários"})
    }
  }

  async addUser(req, res){
    try{
      const {nome, email, senha, tipo} = req.body

      if (!nome || !email || !senha || !tipo){
        return res.status(422).json({message: "dados incompletos para cadastro"})
      }
      await db.query(`INSERT INTO usuario (nome, email, senha, tipo) VALUES (?, ?, ?, ?)`, [nome, email, senha, tipo]);

      res.status(201).json({ message: "usuário criado"})
    } catch (error){
      console.log(error)
      res.status(422).json({ message: "error ao tentar criar usuário"})
    }
  }

  async AuthenticateUser(req, res){
    try{
      const {email, senha} = req.body
      const [user] = await db.query(`SELECT * FROM usuario WHERE email = '${email}'`)
      
      if (!user || user.length == 0){
        return  res.status(422).json({ message: "usuario não encontrado"})
      }

      if (user[0].senha !== senha){
        return  res.status(422).json({ message: "senha incorreta"})
      }

      if (user[0].tipo === "CLIENTE"){
        return  res.status(422).json({ message: "usuário não possui permissão de acesso"})
      }
      const token = await createUserToken(user, req, res)
      return res.status(200).json({ message: "usuario autenticado", user: user[0].nome, token: token})
    }catch(error){
      console.log(error)
      return res.status(422).json({ message: "erro ao tentar fazer login"})
    }
  }
}

module.exports = new ControllerUsuarios()