# 🔐 Assinador Digital Web

Aplicação web para criação e verificação de assinaturas digitais utilizando criptografia assimétrica (RSA + SHA-256).

---

# 📌 Funcionalidades

## 👤 Cadastro / Login

* Cadastro de usuários com email e senha
* Geração automática de par de chaves:

  * 🔑 Chave pública
  * 🔒 Chave privada

---

## ✍️ Assinatura de Texto

* Usuário autenticado pode:

  * Digitar um texto
  * Gerar hash SHA-256
  * Assinar digitalmente
* Retorna:

  * ID da assinatura
  * Assinatura gerada

---

## 🔍 Verificação Pública

* Qualquer pessoa pode:

  * Informar o ID da assinatura
* O sistema retorna:

  * ✅ VÁLIDA ou ❌ INVÁLIDA
  * Texto original
  * Signatário
  * Email
  * Algoritmo
  * Data/Hora

---

## 🗄️ Persistência

Banco de dados (Supabase) com:

* users
* signatures
* verify_logs

---

# 🧪 Tecnologias utilizadas

* Node.js
* Express
* Supabase
* Crypto (RSA + SHA-256)
* Bcrypt

---

# ⚙️ Como rodar o projeto

## 1. Clonar repositório

```bash
git clone <repo>
cd assinatura
```

---

## 2. Instalar dependências

```bash
npm install
```

---

## 3. Configurar .env

Crie um arquivo `.env`:

```env
SUPABASE_URL=...
SUPABASE_KEY=...
PORT=3000
```

---

## 4. Rodar servidor

```bash
node server.js
```

Servidor disponível em:

```
http://localhost:3000
```

---

## 🌐 Acesso externo (opcional)

Usando ngrok:

```bash
ngrok http 3000
```

---

# 🔁 Fluxo da aplicação

1. Usuário se cadastra → gera chaves RSA
2. Usuário faz login
3. Usuário assina um texto
4. Sistema salva assinatura
5. Outro usuário verifica usando ID

---

# 🔌 Endpoints

## 🔐 POST /auth

Login ou cadastro

### Request

```json
{
  "nome": "Eduardo",
  "email": "edu@email.com",
  "password": "123456"
}
```

---

## ✍️ POST /sign

### Request

```json
{
  "user_id": "uuid",
  "texto": "mensagem"
}
```

---

## 🔍 POST /verify

### Request

```json
{
  "assinatura_id": "uuid"
}
```

### Response

```json
{
  "valido": true,
  "texto": "mensagem",
  "signatario": "Eduardo",
  "email": "edu@email.com",
  "algoritmo": "RSA-SHA256",
  "data": "2026-03-17"
}
```

---

# 🧪 Casos de teste

## ✅ Teste positivo

* Assinar texto original
* Verificar com ID correto
* Resultado: **VÁLIDA**

---

## ❌ Teste negativo

* Alterar texto no banco
* Verificar novamente
* Resultado: **INVÁLIDA**

---

# 🗃️ Estrutura do banco

## users

* id
* nome
* email
* password_hash
* public_key
* private_key

## signatures

* id
* user_id
* texto
* hash
* assinatura
* algoritmo
* created_at

## verify_logs

* id
* signature_id
* resultado
* created_at

---

# ✅ Requisitos atendidos

✔️ Geração de chaves
✔️ Assinatura digital
✔️ Verificação pública
✔️ Persistência em banco
✔️ Logs de verificação

---

# Considerações

Sistema implementa um fluxo completo de assinatura digital utilizando criptografia assimétrica, garantindo:

* Integridade dos dados
* Autenticidade do signatário
* Não repúdio

---

# 👨‍💻 Autores

* Eduardo Sahaidak
* Lucas Eduardo
