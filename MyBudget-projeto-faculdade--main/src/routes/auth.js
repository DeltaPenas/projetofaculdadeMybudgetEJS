const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Rota para exibir a página de login
router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

// POSTs
router.post('/register', authController.cadastrar);
router.post('/confirm', authController.confirmar);
router.post('/login', authController.login);

module.exports = router;
