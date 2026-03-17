const express = require("express")
const crypto = require("crypto")
const cors = require("cors")
const { createClient } = require("@supabase/supabase-js")

const app = express()

app.use(express.json())
app.use(cors())

// servir frontend
app.use(express.static("frontend"))

const PORT = 3000


// ============================
// SUPABASE
// ============================


const supabase = createClient(
 "https://ymgafrwqmhdfgjhagqiu.supabase.co",
 "sb_publishable_TukYYsKFgO2YkuM5CwT8mw_zMhBVkcz"
)


// ============================
// AUTH (LOGIN + CADASTRO)
// ============================

app.post("/auth", async (req,res)=>{

 const { nome,email,password } = req.body

 const { data:user, error } = await supabase
 .from("users")
 .select("*")
 .eq("email",email)
 .maybeSingle()

 if(error){
  return res.status(500).json({ error: error.message })
 }

 // =====================
 // LOGIN
 // =====================

 if(user){

  if(user.password_hash !== password){
   return res.status(401).json({
    error:"Senha incorreta"
   })
  }

  return res.json({
   message:"Login realizado",
   user_id:user.id
  })

 }

 // =====================
 // CADASTRO AUTOMÁTICO
 // =====================

 const { publicKey, privateKey } =
 crypto.generateKeyPairSync("rsa",{

  modulusLength:2048,

  publicKeyEncoding:{
   type:"spki",
   format:"pem"
  },

  privateKeyEncoding:{
   type:"pkcs8",
   format:"pem"
  }

 })

 const { data:newUser, error:insertError } = await supabase
 .from("users")
 .insert({

  nome: nome || "Usuário",
  email,
  password_hash: password,
  public_key: publicKey,
  private_key: privateKey

 })
 .select()
 .single()

 if(insertError){
  return res.status(500).json({
   error: insertError.message
  })
 }

 return res.json({
  message:"Usuário criado automaticamente",
  user_id:newUser.id
 })

})


// ============================
// ASSINAR TEXTO
// ============================

app.post("/sign", async (req,res)=>{

 const { user_id,texto } = req.body

 const { data:user } = await supabase
 .from("users")
 .select("*")
 .eq("id",user_id)
 .single()

 if(!user){
  return res.status(404).json({
   error:"Usuário não encontrado"
  })
 }

 // HASH
 const hash = crypto
 .createHash("sha256")
 .update(texto)
 .digest("hex")

 // ASSINATURA
 const sign = crypto.createSign("RSA-SHA256")
 sign.update(texto)

 const assinatura = sign.sign(
  user.private_key,
  "hex"
 )

 // SALVAR
 const { data } = await supabase
 .from("signatures")
 .insert({

  user_id,
  texto,
  hash,
  assinatura,
  algoritmo:"RSA-SHA256"

 })
 .select()
 .single()

 res.json({
  assinatura_id:data.id
 })

})


// ============================
// VERIFICAR
// ============================

app.get("/verify/:id", async (req,res)=>{

 const id = req.params.id

 // buscar assinatura
 const { data:assinatura } = await supabase
 .from("signatures")
 .select("*")
 .eq("id",id)
 .single()

 if(!assinatura){
  return res.status(404).json({
   error:"Assinatura não encontrada"
  })
 }

 // buscar usuario
 const { data:user } = await supabase
 .from("users")
 .select("*")
 .eq("id",assinatura.user_id)
 .single()

 // verificar assinatura
 const verify = crypto.createVerify("RSA-SHA256")
 verify.update(assinatura.texto)

 const valido = verify.verify(
  user.public_key,
  assinatura.assinatura,
  "hex"
 )

 console.log("resultado verificação:", valido)

 // salvar log
 const { error } = await supabase
 .from("verify_logs")
 .insert({

  signature_id: id,
  resultado: valido

 })

 if(error){
  console.log("erro ao salvar log:", error)
 }

 // resposta
 res.json({

  status: valido ? "VALIDA":"INVALIDA",
  signatario:user.nome,
  algoritmo:assinatura.algoritmo,
  data:assinatura.created_at,
  texto:assinatura.texto

 })

})


// ============================

app.listen(PORT,()=>{

 console.log("Servidor rodando")
 console.log("http://localhost:3000")

})


















