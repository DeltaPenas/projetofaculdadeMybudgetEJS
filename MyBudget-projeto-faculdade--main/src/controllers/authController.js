const crypto = require('crypto');
const prisma = require('../lib/prisma');
const bcrypt = require('bcrypt');
const transporter = require('../lib/mailer');
const jwt = require('jsonwebtoken'); 

exports.cadastrar = async (req, res) => {
  const { login, email, senha, confirmarSenha } = req.body;
  if (senha !== confirmarSenha) return res.status(400).send("Senhas diferentes");

  const hash = crypto.randomBytes(20).toString('hex');
  const senhaCriptografada = await bcrypt.hash(senha, 10);

  try {
    await prisma.usuario.create({
      data: { login, email, senha: senhaCriptografada, status: false, hash }
    });

    await transporter.sendMail({
      to: email,
      subject: 'Confirmação de Cadastro no MyBudget',
      html: `<p>Olá ${login},</p><p>Use o código abaixo para ativar seu cadastro em <a href="http://localhost:3000/confirm.html">http://localhost:3000/confirm.html</a>:</p><b>${hash}</b>`
    });

    res.send("Cadastro criado. Verifique seu e-mail.");
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.confirmar = async (req, res) => {
  const { hash } = req.body;

  try {
    const user = await prisma.usuario.findFirst({ where: { hash } });
    if (!user) return res.status(400).send("Código inválido");

    await prisma.usuario.update({
      where: { id: user.id },
      data: { status: true, hash: null }
    });

    res.send("Cadastro confirmado!");
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.login = async (req, res) => {
  const { email, senha } = req.body;

  try {
    const user = await prisma.usuario.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).render('login', { error: 'Usuário não encontrado' });
    }

    if (!user.status) {
      return res.status(403).render('login', { error: 'Confirme seu cadastro primeiro' });
    }

    const senhaValida = await bcrypt.compare(senha, user.senha);
    if (!senhaValida) {
      return res.status(401).render('login', { error: 'Senha incorreta' });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Aqui você pode salvar o token em cookie, sessão, ou localStorage via front.
    res.redirect('/gastos.html'); // Ou alguma rota protegida
  } catch (err) {
    res.status(500).render('login', { error: 'Erro no servidor' });
  }
};
