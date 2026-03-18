const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
require("dotenv").config();

const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// LOGIN / CADASTRO
app.post("/auth", async (req, res) => {
  const { nome, email, password } = req.body;

  const { data: users, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email);

  if (error) {
    console.error(error);
    return res.status(400).json(error);
  }

  const existingUser = users[0];

  // LOGIN
  if (existingUser) {
    const match = await bcrypt.compare(password, existingUser.password_hash);

    if (!match) {
      return res.status(401).json({ error: "Senha incorreta" });
    }

    return res.json({ user: existingUser });
  }

  // CADASTRO
  const hash = await bcrypt.hash(password, 10);

  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
  });

  const { data, error: insertError } = await supabase
    .from("users")
    .insert([
      {
        nome,
        email,
        password_hash: hash,
        public_key: publicKey.export({ type: "pkcs1", format: "pem" }),
        private_key: privateKey.export({ type: "pkcs1", format: "pem" }),
      },
    ])
    .select();

  if (insertError) {
    console.error(insertError);
    return res.status(400).json(insertError);
  }

  res.json({ user: data[0] });
});

// ASSINAR
app.post("/sign", async (req, res) => {
  const { user_id, texto } = req.body;

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("id", user_id)
    .single();

  const sign = crypto.createSign("SHA256");
  sign.update(texto);

  const assinatura = sign.sign(user.private_key, "hex");

  const hash = crypto.createHash("sha256").update(texto).digest("hex");

const { data } = await supabase
  .from("signatures")
  .insert([
    {
      user_id,
      texto,
      hash,
      assinatura,
      algoritmo: "RSA-SHA256"
    },
  ])
  .select();

  res.json({ assinatura, registro: data[0] });
});

// VERIFY
app.post("/verify", async (req, res) => {
  const { assinatura_id } = req.body;

  const { data: signature, error: errorSig } = await supabase
    .from("signatures")
    .select("*")
    .eq("id", assinatura_id)
    .single();

  if (errorSig || !signature) {
    console.error("Erro signature:", errorSig);
    return res.status(404).json({ error: "Assinatura não encontrada" });
  }

  const { data: user, error: errorUser } = await supabase
    .from("users")
    .select("*")
    .eq("id", signature.user_id)
    .single();

  if (errorUser || !user) {
    console.error("Erro user:", errorUser);
    return res.status(404).json({ error: "Usuário não encontrado" });
  }

  const verify = crypto.createVerify("SHA256");
  verify.update(signature.texto);

  const valido = verify.verify(user.public_key, signature.assinatura, "hex");

  await supabase.from("verify_logs").insert([
    {
      signature_id: assinatura_id,
      resultado: valido,
    },
  ]);

  // 👇 DEBUG IMPORTANTE
  console.log("SIGNATURE:", signature);
  console.log("USER:", user);

  res.json({
    valido,
    texto: signature.texto,
    algoritmo: signature.algoritmo,
    data: signature.created_at,
    signatario: user.nome,
    email: user.email
  });
});
app.listen(process.env.PORT || 3000, () => {
  console.log("Rodando na porta " + (process.env.PORT || 3000));
});